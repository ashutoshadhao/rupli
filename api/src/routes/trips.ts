import { Hono, type Context } from 'hono';
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { AddTripItem, FinishTrip, StartTrip, UpdateTripItem } from '@rupli/shared';
import { categories, lists, products, transactions, tripItems, trips } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { ApiError, body, idParam, notFound } from '../lib/http';
import { assertProductVisible } from '../lib/products';
import { ownedList } from './lists';

type C = Context<AppEnv>;
const finished = () => new ApiError(409, 'trip_finished', 'This trip is already finished');

async function ownedTrip(c: C, { open = false } = {}) {
  const [t] = await c.get('db').select().from(trips).where(and(eq(trips.id, idParam(c)), eq(trips.userId, c.get('userId'))));
  if (!t) throw notFound('trip');
  if (open && t.finishedAt) throw finished();
  return t;
}

async function ownedTripItem(c: C, tripId: string) {
  const [i] = await c.get('db').select().from(tripItems).where(and(eq(tripItems.id, idParam(c, 'itemId')), eq(tripItems.tripId, tripId)));
  if (!i) throw notFound('item');
  return i;
}

export const tripRoutes = new Hono<AppEnv>()
  .post('/', async c => {
    const db = c.get('db');
    const b = await body(c, StartTrip);
    if (b.listId) {
      const l = await ownedList(c, b.listId);
      await db.update(lists).set({ status: 'shopping' }).where(eq(lists.id, l.id));
    }
    const [t] = await db.insert(trips).values({ userId: c.get('userId'), listId: b.listId, store: b.store }).returning();
    return c.json(t, 201);
  })

  .get('/', async c => {
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 5) || 5, 1), 50);
    const rows = await c.get('db').select({
      trip: trips,
      itemCount: sql<number>`(select count(*)::int from trip_items ti where ti.trip_id = "trips"."id")`,
    }).from(trips).where(and(eq(trips.userId, c.get('userId')), isNotNull(trips.finishedAt)))
      .orderBy(desc(trips.finishedAt)).limit(limit);
    return c.json(rows.map(r => ({ ...r.trip, itemCount: r.itemCount, totalPaise: r.trip.billTotalPaise })));
  })

  .get('/:id', async c => {
    const t = await ownedTrip(c);
    const rows = await c.get('db').select({ item: tripItems, product: products }).from(tripItems)
      .innerJoin(products, eq(products.id, tripItems.productId)).where(eq(tripItems.tripId, t.id)).orderBy(asc(tripItems.id));
    return c.json({
      ...t,
      items: rows.map(({ item, product }) => ({
        ...item, product: { id: product.id, name: product.name, aliases: product.aliases, emoji: product.emoji, category: product.category },
      })),
    });
  })

  .post('/:id/items', async c => {
    const db = c.get('db');
    const t = await ownedTrip(c, { open: true });
    const b = await body(c, AddTripItem);
    await assertProductVisible(db, c.get('userId'), b.productId);
    const [row] = await db.insert(tripItems).values({ ...b, tripId: t.id }).returning();
    return c.json(row, 201);
  })

  .patch('/:id/items/:itemId', async c => {
    const t = await ownedTrip(c, { open: true });
    const i = await ownedTripItem(c, t.id);
    const b = await body(c, UpdateTripItem);
    const [row] = await c.get('db').update(tripItems).set(b).where(eq(tripItems.id, i.id)).returning();
    return c.json(row);
  })

  .delete('/:id/items/:itemId', async c => {
    const t = await ownedTrip(c, { open: true });
    const i = await ownedTripItem(c, t.id);
    await c.get('db').delete(tripItems).where(eq(tripItems.id, i.id));
    return c.body(null, 204);
  })

  .post('/:id/pause', async c => {
    const t = await ownedTrip(c, { open: true });
    const [row] = await c.get('db').update(trips).set({ pausedAt: t.pausedAt ? null : new Date() }).where(eq(trips.id, t.id)).returning();
    return c.json(row);
  })

  .post('/:id/finish', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const t = await ownedTrip(c);
    const { billTotalPaise } = await body(c, FinishTrip);
    const result = await db.transaction(async tx => {
      // conditional update makes a concurrent double-finish lose cleanly
      const [trip] = await tx.update(trips).set({ finishedAt: new Date(), pausedAt: null, billTotalPaise })
        .where(and(eq(trips.id, t.id), sql`${trips.finishedAt} is null`)).returning();
      if (!trip) throw finished();
      const [groceries] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.slug, 'groceries'));
      const [txn] = await tx.insert(transactions).values({
        userId, amountPaise: billTotalPaise, direction: 'debit', occurredAt: trip.finishedAt!, merchant: trip.store ?? 'Grocery trip',
        categoryId: groceries!.id, source: 'cart', sourceRef: trip.id, tripId: trip.id,
      }).returning();
      // an SMS for this payment may have arrived before the user tapped Finish
      await tx.execute(sql`
        update transactions set linked_transaction_id = ${txn!.id}
        where id = (
          select id from transactions
          where user_id = ${userId} and source = 'sms' and direction = 'debit' and linked_transaction_id is null
            and amount_paise = ${billTotalPaise}
            and occurred_at between ${trip.finishedAt!.toISOString()}::timestamptz - interval '30 minutes'
                                and ${trip.finishedAt!.toISOString()}::timestamptz + interval '30 minutes'
          order by abs(extract(epoch from occurred_at - ${trip.finishedAt!.toISOString()}::timestamptz)) limit 1)`);
      if (trip.listId) await tx.update(lists).set({ status: 'done' }).where(eq(lists.id, trip.listId));
      return { trip, transactionId: txn!.id };
    });
    return c.json(result);
  });
