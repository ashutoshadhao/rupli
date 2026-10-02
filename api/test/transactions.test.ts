import { beforeEach, it, expect } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db, json, req, resetDb } from './helpers';
import { accounts, categories, transactions } from '../src/db/schema';

beforeEach(resetDb);

const zepto = { amountPaise: 48600, direction: 'debit', merchant: 'ZEPTO MARKETPLACE', ref: '427519830042', last4: '1234', bank: 'HDFC Bank', occurredAt: '2026-10-01T14:12:00+05:30' };
const catId = async (slug: string) => (await db.select().from(categories).where(eq(categories.slug, slug)))[0]!.id;
const userTxns = (u: string) => db.select().from(transactions).where(eq(transactions.userId, u));

it('sms batch inserts, categorises, creates account', async () => {
  const r = await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [zepto] });
  expect(r.body).toEqual({ inserted: 1, duplicates: 0, linked: 0 });
  const [t] = await userTxns('user_a');
  expect(t).toMatchObject({ source: 'sms', amountPaise: 48600, categoryId: await catId('groceries'), sourceRef: '427519830042' });
  const [a] = await db.select().from(accounts).where(eq(accounts.userId, 'user_a'));
  expect(a).toMatchObject({ bank: 'HDFC Bank', last4: '1234' });
  expect(t!.accountId).toBe(a!.id);
});

it('re-sent batch is idempotent (with and without ref)', async () => {
  const noRef = { ...zepto, ref: null, amountPaise: 1000 };
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [zepto, noRef] });
  const again = await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [zepto, noRef] });
  expect(again.body).toEqual({ inserted: 0, duplicates: 2, linked: 0 });
  expect(await userTxns('user_a')).toHaveLength(2);
});

it('same UPI ref for two different users is fine', async () => {
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [zepto] });
  expect((await json('user_b', 'POST', '/v1/transactions/sms-batch', { items: [zepto] })).body.inserted).toBe(1);
});

it('credit → income; unknown merchant → uncategorised', async () => {
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [
    { ...zepto, ref: '1', direction: 'credit', merchant: 'aarti@okicici' },
    { ...zepto, ref: '2', merchant: 'SHARMA STORES' },
  ] });
  const rows = await userTxns('user_a');
  expect(rows.find(r => r.sourceRef === '1')!.categoryId).toBe(await catId('income'));
  expect(rows.find(r => r.sourceRef === '2')!.categoryId).toBe(await catId('uncategorised'));
});

it('recategorise with makeRule applies to past and future SMS', async () => {
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [{ ...zepto, ref: '1', merchant: 'SHARMA STORES' }, { ...zepto, ref: '2', merchant: 'SHARMA STORES' }] });
  const [first] = await userTxns('user_a');
  const household = await catId('household');
  expect((await req('user_a', 'PATCH', `/v1/transactions/${first!.id}`, { categoryId: household, makeRule: true })).status).toBe(200);
  await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [{ ...zepto, ref: '3', merchant: 'Sharma Stores' }] });
  const rows = await userTxns('user_a');
  expect(rows.every(r => r.categoryId === household)).toBe(true);
});

it('manual expense; cross-user PATCH → 404; foreign category → 404', async () => {
  const groceries = await catId('groceries');
  const m = await json('user_a', 'POST', '/v1/transactions', { amountPaise: 5000, direction: 'debit', categoryId: groceries, occurredAt: '2026-10-02T10:00:00+05:30', note: 'sabzi wala' });
  expect(m.status).toBe(201);
  expect(m.body).toMatchObject({ source: 'manual', amountPaise: 5000 });
  expect((await req('user_b', 'PATCH', `/v1/transactions/${m.body.id}`, { categoryId: groceries })).status).toBe(404);
  const [own] = await db.insert(categories).values({ userId: 'user_a', name: 'Mine', emoji: '⭐' }).returning();
  expect((await req('user_b', 'POST', '/v1/transactions', { amountPaise: 5000, direction: 'debit', categoryId: own!.id, occurredAt: '2026-10-02T10:00:00+05:30' })).status).toBe(404);
});

it('SMS after a cart trip with the same amount is linked, not double counted', async () => {
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', { store: 'DMart' });
  const fin = await json('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 234800 });
  const occurredAt = new Date(Date.now() + 5 * 60_000).toISOString();
  const r = await json('user_a', 'POST', '/v1/transactions/sms-batch', { items: [{ ...zepto, amountPaise: 234800, merchant: 'DMART', occurredAt }] });
  expect(r.body).toEqual({ inserted: 1, duplicates: 0, linked: 1 });
  const [sms] = await db.select().from(transactions).where(and(eq(transactions.userId, 'user_a'), eq(transactions.source, 'sms')));
  expect(sms!.linkedTransactionId).toBe(fin.body.transactionId);
});
