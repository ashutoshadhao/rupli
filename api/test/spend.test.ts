import { beforeEach, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, json, productId, resetDb } from './helpers';
import { categories, trips, transactions } from '../src/db/schema';
import { monthsEnding } from '../src/lib/months';

beforeEach(resetDb);
const catId = async (slug: string) => (await db.select().from(categories).where(eq(categories.slug, slug)))[0]!.id;

it('monthsEnding handles year rollover', () => {
  expect(monthsEnding('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
  expect(monthsEnding('2026-10', 6)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
});

it('monthly grocery totals, prev month, product categories, linked SMS excluded, IST boundary', async () => {
  const groceries = await catId('groceries');
  // Oct trip: dal 2×177 + milk 30×68 = 354 + 2040 = 2394 items, bill 2348
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', { store: 'DMart' });
  await json('user_a', 'POST', `/v1/trips/${trip.id}/items`, { productId: await productId('toor-dal'), packSize: '1 kg', brand: null, qty: 2, pricePaise: 17700 });
  await json('user_a', 'POST', `/v1/trips/${trip.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 30, pricePaise: 6800 });
  const fin = await json('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 234800 });
  // pin the trip + its txn into October 2026 regardless of today's date
  const octAt = new Date('2026-10-15T12:00:00+05:30');
  await db.update(trips).set({ finishedAt: octAt }).where(eq(trips.id, trip.id));
  await db.update(transactions).set({ occurredAt: octAt }).where(eq(transactions.id, fin.body.transactionId));

  await json('user_a', 'POST', '/v1/transactions', { amountPaise: 910500, direction: 'debit', categoryId: groceries, occurredAt: '2026-09-10T10:00:00+05:30' });
  // 31 Oct 8 pm IST = 31 Oct 14:30 UTC → October
  await json('user_a', 'POST', '/v1/transactions', { amountPaise: 1000, direction: 'debit', categoryId: groceries, occurredAt: '2026-10-31T20:00:00+05:30' });
  // 1 Nov 2 am IST = 31 Oct 20:30 UTC → November, must NOT count
  await json('user_a', 'POST', '/v1/transactions', { amountPaise: 7, direction: 'debit', categoryId: groceries, occurredAt: '2026-11-01T02:00:00+05:30' });
  // linked SMS duplicate of the trip
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [{ amountPaise: 234800, direction: 'debit', merchant: 'DMART', ref: '99', last4: '1234', bank: 'HDFC Bank', occurredAt: '2026-10-15T12:10:00+05:30' }] });
  // non-grocery spend appears in the list but not the total
  await json('user_a', 'POST', '/v1/transactions', { amountPaise: 30000, direction: 'debit', categoryId: await catId('fuel'), occurredAt: '2026-10-05T10:00:00+05:30' });

  const { status, body: s } = await json('user_a', 'GET', '/v1/spend?month=2026-10');
  expect(status).toBe(200);
  expect(s.totalPaise).toBe(234800 + 1000);
  expect(s.prevTotalPaise).toBe(910500);
  expect(s.months).toHaveLength(6);
  expect(s.months.at(-1)).toEqual({ month: '2026-10', totalPaise: 235800 });
  expect(s.byProductCategory).toEqual(expect.arrayContaining([
    { category: 'dairy', totalPaise: 204000 }, { category: 'dal', totalPaise: 35400 },
  ]));
  expect(s.byProductCategory.find((c: { category: string }) => c.category === 'other')).toBeUndefined();
  expect(s.transactions.some((t: { source: string }) => t.source === 'sms')).toBe(false);
  expect(s.transactions.find((t: { amountPaise: number }) => t.amountPaise === 30000)).toMatchObject({ category: { name: 'Fuel' } });
  expect((await json('user_b', 'GET', '/v1/spend?month=2026-10')).body.totalPaise).toBe(0);
  expect((await json('user_a', 'GET', '/v1/spend?month=oct')).status).toBe(400);
});

it("'other' covers grocery spend without item breakdown", async () => {
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [{ amountPaise: 48600, direction: 'debit', merchant: 'ZEPTO', ref: '1', last4: '1234', bank: 'HDFC Bank', occurredAt: '2026-10-01T14:12:00+05:30' }] });
  const { body: s } = await json('user_a', 'GET', '/v1/spend?month=2026-10');
  expect(s.byProductCategory).toEqual([{ category: 'other', totalPaise: 48600 }]);
  expect(s.transactions[0]).toMatchObject({ merchant: 'ZEPTO', source: 'sms', account: { bank: 'HDFC Bank', last4: '1234' } });
});
