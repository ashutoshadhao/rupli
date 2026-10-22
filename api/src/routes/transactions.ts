import { Hono } from 'hono';
import { and, eq, ne, sql } from 'drizzle-orm';
import { ManualTxn, SmsBatch, UpdateTxn, defaultCategorySlug, findCartMatch, matchRule, smsFallbackRef } from '@rupli/shared';
import { accounts, categoryRules, transactions } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { ApiError, body, idParam, notFound } from '../lib/http';
import { assertCategoryVisible, categoryMaps } from '../lib/categories';

export const transactionRoutes = new Hono<AppEnv>()
  .post('/', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const b = await body(c, ManualTxn);
    await assertCategoryVisible(db, userId, b.categoryId);
    const [row] = await db.insert(transactions).values({ ...b, userId, occurredAt: new Date(b.occurredAt), source: 'manual' }).returning();
    return c.json(row, 201);
  })

  .patch('/:id', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const id = idParam(c);
    const b = await body(c, UpdateTxn);
    await assertCategoryVisible(db, userId, b.categoryId);
    const [row] = await db.update(transactions).set({ categoryId: b.categoryId })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId))).returning();
    if (!row) throw notFound('transaction');
    if (b.makeRule && row.merchant) {
      const pattern = row.merchant.toLowerCase();
      await db.insert(categoryRules).values({ userId, pattern, categoryId: b.categoryId })
        .onConflictDoUpdate({ target: [categoryRules.userId, categoryRules.pattern], set: { categoryId: b.categoryId } });
      await db.update(transactions).set({ categoryId: b.categoryId })
        .where(and(eq(transactions.userId, userId), ne(transactions.source, 'cart'), sql`lower(${transactions.merchant}) = ${pattern}`));
    }
    return c.json(row);
  })

  // manual (and SMS) entries can be removed; a cart spend belongs to its trip, so delete the trip instead
  .delete('/:id', async c => {
    const db = c.get('db');
    const [t] = await db.select().from(transactions).where(and(eq(transactions.id, idParam(c)), eq(transactions.userId, c.get('userId'))));
    if (!t) throw notFound('transaction');
    if (t.source === 'cart') throw new ApiError(409, 'delete_trip_instead', 'This spend comes from a shopping trip. Delete the trip instead.');
    await db.delete(transactions).where(eq(transactions.id, t.id));
    return c.body(null, 204);
  })

  // ponytail: one round-trip per item; batch the inserts if 5k+ imports feel slow
  .post('/sms-batch', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const { items } = await body(c, SmsBatch);
    const cats = await categoryMaps(db, userId);
    let inserted = 0, duplicates = 0, linked = 0;
    for (const s of items) {
      const occurredAt = new Date(s.occurredAt);
      const accountId = s.last4
        ? (await db.insert(accounts).values({ userId, bank: s.bank ?? 'Unknown', last4: s.last4 })
            .onConflictDoUpdate({ target: [accounts.userId, accounts.bank, accounts.last4], set: { last4: s.last4 } })
            .returning({ id: accounts.id }))[0]!.id
        : null;
      const categoryId = matchRule(s.merchant, cats.rules) ?? cats.bySlug.get(defaultCategorySlug(s.merchant, s.direction))!;
      const [row] = await db.insert(transactions).values({
        userId, amountPaise: s.amountPaise, direction: s.direction, occurredAt, merchant: s.merchant, categoryId, accountId,
        source: 'sms', sourceRef: s.ref ?? smsFallbackRef(s),
      }).onConflictDoNothing().returning({ id: transactions.id });
      if (!row) { duplicates++; continue; }
      inserted++;
      if (s.direction !== 'debit') continue;
      const carts = await db.execute<{ id: string; amount_paise: string; occurred_at: string }>(sql`
        select t.id, t.amount_paise, t.occurred_at from transactions t
        where t.user_id = ${userId} and t.source = 'cart' and t.amount_paise = ${s.amountPaise}
          and t.occurred_at between ${occurredAt.toISOString()}::timestamptz - interval '30 minutes'
                                and ${occurredAt.toISOString()}::timestamptz + interval '30 minutes'
          and not exists (select 1 from transactions s where s.linked_transaction_id = t.id)`);
      const match = findCartMatch({ amountPaise: s.amountPaise, occurredAt },
        carts.map(r => ({ id: r.id, amountPaise: Number(r.amount_paise), occurredAt: new Date(r.occurred_at) })));
      if (match) {
        await db.update(transactions).set({ linkedTransactionId: match }).where(eq(transactions.id, row.id));
        linked++;
      }
    }
    return c.json({ inserted, duplicates, linked });
  });
