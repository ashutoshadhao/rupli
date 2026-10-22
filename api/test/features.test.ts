import { beforeEach, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, json, req, productId, resetDb } from './helpers';
import { trips, transactions } from '../src/db/schema';

beforeEach(resetDb);
const catId = async (user: string, slug: string) => ((await json(user, 'GET', '/v1/categories')).body as { id: string; slug: string }[]).find(c => c.slug === slug)!.id;

it('budget: set, read, clear; included in spend', async () => {
  expect((await json('user_a', 'GET', '/v1/me')).body).toEqual({ budgetPaise: null });
  expect((await json('user_a', 'PUT', '/v1/me', { budgetPaise: 800000 })).body).toEqual({ budgetPaise: 800000 });
  expect((await json('user_a', 'GET', '/v1/spend?month=2026-10')).body.budgetPaise).toBe(800000);
  expect((await json('user_b', 'GET', '/v1/me')).body.budgetPaise).toBeNull();
  expect((await json('user_a', 'PUT', '/v1/me', { budgetPaise: null })).body.budgetPaise).toBeNull();
  expect((await req('user_a', 'PUT', '/v1/me', { budgetPaise: -5 })).status).toBe(400);
});

it('price history: every paid price for a product, newest first, with store', async () => {
  const milk = await productId('milk');
  const buy = async (store: string, price: number, at: string) => {
    const { body: t } = await json('user_a', 'POST', '/v1/trips', { store });
    await json('user_a', 'POST', `/v1/trips/${t.id}/items`, { productId: milk, packSize: '1 L', brand: 'Amul', qty: 1, pricePaise: price });
    await req('user_a', 'POST', `/v1/trips/${t.id}/finish`, { billTotalPaise: price });
    await db.update(trips).set({ finishedAt: new Date(at) }).where(eq(trips.id, t.id));
  };
  await buy('DMart', 6400, '2026-08-05T10:00:00+05:30');
  await buy('Zepto', 6800, '2026-09-05T10:00:00+05:30');
  await buy('DMart', 7200, '2026-10-05T10:00:00+05:30');
  const { body } = await json('user_a', 'GET', `/v1/products/${milk}/prices`);
  expect(body.map((r: { pricePaise: number; store: string }) => [r.pricePaise, r.store])).toEqual([[7200, 'DMart'], [6800, 'Zepto'], [6400, 'DMart']]);
  expect((await json('user_b', 'GET', `/v1/products/${milk}/prices`)).body).toEqual([]);
});

it('expenses can be backdated', async () => {
  const r = await json('user_a', 'POST', '/v1/transactions', { amountPaise: 5000, direction: 'debit', categoryId: await catId('user_a', 'household'), occurredAt: '2026-10-01T10:00:00+05:30' });
  expect(new Date(r.body.occurredAt).toISOString()).toBe('2026-10-01T04:30:00.000Z');
});

it('recurring expenses: created, listed, materialised once per month (idempotent), stoppable', async () => {
  const household = await catId('user_a', 'household');
  const { status, body: rec } = await json('user_a', 'POST', '/v1/recurring', { name: 'Milkman', amountPaise: 210000, categoryId: household, dayOfMonth: 1, startMonth: '2026-08' });
  expect(status).toBe(201);
  expect((await json('user_a', 'GET', '/v1/recurring')).body).toHaveLength(1);
  // spend for Oct materialises Aug, Sep, Oct (all due by Oct 1) — and asking again adds nothing
  await json('user_a', 'GET', '/v1/spend?month=2026-10');
  await json('user_a', 'GET', '/v1/spend?month=2026-10');
  const rows = await db.select().from(transactions).where(eq(transactions.userId, 'user_a'));
  expect(rows.map(r => r.sourceRef).sort()).toEqual([`rec:${rec.id}:2026-08`, `rec:${rec.id}:2026-09`, `rec:${rec.id}:2026-10`]);
  expect(rows.every(r => r.merchant === 'Milkman' && r.amountPaise === 210000)).toBe(true);
  const { body: s } = await json('user_a', 'GET', '/v1/spend?month=2026-10');
  expect(s.allPaise).toBe(210000);
  // deleting one month's entry sticks: it is not re-added on the next load
  const oct = rows.find(r => r.sourceRef === `rec:${rec.id}:2026-10`)!;
  expect((await req('user_a', 'DELETE', `/v1/transactions/${oct.id}`)).status).toBe(204);
  expect((await json('user_a', 'GET', '/v1/spend?month=2026-10')).body.allPaise).toBe(0);
  expect((await req('user_b', 'DELETE', `/v1/recurring/${rec.id}`)).status).toBe(404);
  expect((await req('user_a', 'DELETE', `/v1/recurring/${rec.id}`)).status).toBe(204);
  expect((await json('user_a', 'GET', '/v1/recurring')).body).toHaveLength(0);
  // past entries stay in history
  expect(await db.select().from(transactions).where(eq(transactions.userId, 'user_a'))).toHaveLength(2);
});

it('a recurring day later than today is not added early; day 31 lands on the last day of short months', async () => {
  const rent = await catId('user_a', 'rent');
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  await json('user_a', 'POST', '/v1/recurring', { name: 'Late', amountPaise: 100, categoryId: rent, dayOfMonth: 31, startMonth: thisMonth });
  await json('user_a', 'GET', `/v1/spend?month=${thisMonth}`);
  const rows = await db.select().from(transactions).where(eq(transactions.userId, 'user_a'));
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  expect(rows).toHaveLength(now.getUTCDate() >= lastDay ? 1 : 0);
});

it('family sharing: owner shares a code, member joins, both edit; only owner deletes; strangers 404', async () => {
  const { body: l } = await json('user_a', 'POST', '/v1/lists', { name: 'Family kirana' });
  const { body: share } = await json('user_a', 'POST', `/v1/lists/${l.id}/share`);
  expect(share.code).toMatch(/^[A-Z2-9]{6}$/);
  expect((await json('user_a', 'POST', `/v1/lists/${l.id}/share`)).body.code).toBe(share.code); // stable
  expect((await req('user_b', 'GET', `/v1/lists/${l.id}`)).status).toBe(404);
  const joined = await json('user_b', 'POST', '/v1/lists/join', { code: share.code.toLowerCase() });
  expect(joined.status).toBe(200);
  expect(joined.body.id).toBe(l.id);
  // member sees it, marked shared, and can add items
  const bLists = (await json('user_b', 'GET', '/v1/lists')).body;
  expect(bLists[0]).toMatchObject({ id: l.id, shared: true, owner: false });
  expect((await req('user_b', 'POST', `/v1/lists/${l.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 2 })).status).toBe(201);
  expect((await json('user_a', 'GET', `/v1/lists/${l.id}`)).body.items).toHaveLength(1);
  expect((await json('user_a', 'GET', '/v1/lists')).body[0]).toMatchObject({ shared: true, owner: true, memberCount: 1 });
  // member can shop it
  expect((await req('user_b', 'POST', '/v1/trips', { listId: l.id })).status).toBe(201);
  // only the owner can delete; member can leave
  expect((await req('user_b', 'DELETE', `/v1/lists/${l.id}`)).status).toBe(404);
  expect((await req('user_c', 'POST', '/v1/lists/join', { code: 'ZZZZZZ' })).status).toBe(404);
  expect((await req('user_b', 'POST', `/v1/lists/${l.id}/leave`)).status).toBe(204);
  expect((await req('user_b', 'GET', `/v1/lists/${l.id}`)).status).toBe(404);
});
