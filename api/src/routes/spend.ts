import { Hono } from 'hono';
import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { Month } from '@rupli/shared';
import { accounts, categories, transactions } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { istMonthStart, monthsEnding, nextMonth } from '../lib/months';

export const spendRoutes = new Hono<AppEnv>().get('/', async c => {
  const db = c.get('db'), userId = c.get('userId');
  const month = Month.parse(c.req.query('month'));
  const months = monthsEnding(month, 6);
  const from = istMonthStart(months[0]!), monthFrom = istMonthStart(month), to = istMonthStart(nextMonth(month));
  const [groceries] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, 'groceries'));

  const totals = await db.execute<{ m: string; total: string }>(sql`
    select to_char(occurred_at at time zone 'Asia/Kolkata', 'YYYY-MM') m, sum(amount_paise) total
    from transactions
    where user_id = ${userId} and direction = 'debit' and linked_transaction_id is null and category_id = ${groceries!.id}
      and occurred_at >= ${from.toISOString()}::timestamptz and occurred_at < ${to.toISOString()}::timestamptz
    group by 1`);
  const byMonth = new Map(totals.map(r => [r.m, Number(r.total)]));
  const series = months.map(m => ({ month: m, totalPaise: byMonth.get(m) ?? 0 }));
  const totalPaise = series.at(-1)!.totalPaise;

  const cats = await db.execute<{ category: string; total: string }>(sql`
    select p.category, sum(ti.qty * ti.price_paise) total
    from trip_items ti join trips t on t.id = ti.trip_id join products p on p.id = ti.product_id
    where t.user_id = ${userId} and t.finished_at >= ${monthFrom.toISOString()}::timestamptz and t.finished_at < ${to.toISOString()}::timestamptz
    group by 1 order by 2 desc`);
  const byProductCategory = cats.map(r => ({ category: r.category, totalPaise: Number(r.total) }));
  const other = totalPaise - byProductCategory.reduce((s, x) => s + x.totalPaise, 0);
  if (other > 0) byProductCategory.push({ category: 'other', totalPaise: other });

  const rows = await db.select({ t: transactions, cat: categories, acc: accounts }).from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .leftJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(and(eq(transactions.userId, userId), isNull(transactions.linkedTransactionId),
      gte(transactions.occurredAt, monthFrom), lt(transactions.occurredAt, to)))
    .orderBy(desc(transactions.occurredAt)).limit(200);

  return c.json({
    month, totalPaise, prevTotalPaise: series.at(-2)!.totalPaise, months: series, byProductCategory,
    transactions: rows.map(({ t, cat, acc }) => ({
      id: t.id, amountPaise: t.amountPaise, direction: t.direction, occurredAt: t.occurredAt, merchant: t.merchant,
      source: t.source, sourceRef: t.sourceRef, note: t.note,
      category: { id: cat.id, name: cat.name, emoji: cat.emoji }, account: acc ? { bank: acc.bank, last4: acc.last4 } : null,
    })),
  });
});
