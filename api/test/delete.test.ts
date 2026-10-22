import { beforeEach, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, json, req, productId, resetDb } from './helpers';
import { listItems, transactions, trips } from '../src/db/schema';

beforeEach(resetDb);

async function listWithMilk(user = 'user_a') {
  const { body: l } = await json(user, 'POST', '/v1/lists', { name: 'Oct' });
  await json(user, 'POST', `/v1/lists/${l.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 1 });
  return l;
}

it('DELETE /lists/:id removes the list and its items; finished trips keep their history', async () => {
  const l = await listWithMilk();
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', { listId: l.id });
  await req('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 6800 });
  expect((await req('user_a', 'DELETE', `/v1/lists/${l.id}`)).status).toBe(204);
  expect((await req('user_a', 'GET', `/v1/lists/${l.id}`)).status).toBe(404);
  expect(await db.select().from(listItems).where(eq(listItems.listId, l.id))).toHaveLength(0);
  const [t] = await db.select().from(trips).where(eq(trips.id, trip.id));
  expect(t).toMatchObject({ listId: null, billTotalPaise: 6800 });
});

it('a list with an open trip cannot be deleted', async () => {
  const l = await listWithMilk();
  await json('user_a', 'POST', '/v1/trips', { listId: l.id });
  const r = await json('user_a', 'DELETE', `/v1/lists/${l.id}`);
  expect(r.status).toBe(409);
  expect(r.body.error.code).toBe('list_in_use');
});

it('DELETE /trips/:id removes the trip and its spend; an open trip frees its list', async () => {
  const l = await listWithMilk();
  const { body: done } = await json('user_a', 'POST', '/v1/trips', { listId: l.id });
  const fin = await json('user_a', 'POST', `/v1/trips/${done.id}/finish`, { billTotalPaise: 6800 });
  expect((await req('user_a', 'DELETE', `/v1/trips/${done.id}`)).status).toBe(204);
  expect(await db.select().from(transactions).where(eq(transactions.id, fin.body.transactionId))).toHaveLength(0);

  const { body: open } = await json('user_a', 'POST', '/v1/trips', { listId: l.id });
  expect((await json('user_a', 'GET', `/v1/lists/${l.id}`)).body.status).toBe('shopping');
  expect((await req('user_a', 'DELETE', `/v1/trips/${open.id}`)).status).toBe(204);
  expect((await json('user_a', 'GET', `/v1/lists/${l.id}`)).body.status).toBe('draft');
  expect((await json('user_a', 'GET', '/v1/trips/open')).body).toBeNull();
});

it('cross-user deletes → 404', async () => {
  const l = await listWithMilk('user_a');
  const { body: t } = await json('user_a', 'POST', '/v1/trips', {});
  expect((await req('user_b', 'DELETE', `/v1/lists/${l.id}`)).status).toBe(404);
  expect((await req('user_b', 'DELETE', `/v1/trips/${t.id}`)).status).toBe(404);
});

it('GET /trips filters by IST month and store, with paging', async () => {
  const mk = async (store: string, finishedAt: string) => {
    const { body: t } = await json('user_a', 'POST', '/v1/trips', { store });
    await req('user_a', 'POST', `/v1/trips/${t.id}/finish`, { billTotalPaise: 1000 });
    await db.update(trips).set({ finishedAt: new Date(finishedAt) }).where(eq(trips.id, t.id));
    return t.id as string;
  };
  const a = await mk('DMart, Kothrud', '2026-10-31T20:00:00+05:30'); // still October in IST
  await mk('Zepto', '2026-10-05T10:00:00+05:30');
  await mk('DMart, Baner', '2026-09-20T10:00:00+05:30');
  expect((await json('user_a', 'GET', '/v1/trips?month=2026-10')).body).toHaveLength(2);
  const dmart = (await json('user_a', 'GET', '/v1/trips?store=dmart')).body;
  expect(dmart.map((t: { store: string }) => t.store)).toEqual(['DMart, Kothrud', 'DMart, Baner']);
  expect((await json('user_a', 'GET', '/v1/trips?month=2026-10&store=dmart')).body.map((t: { id: string }) => t.id)).toEqual([a]);
  expect((await json('user_a', 'GET', '/v1/trips?limit=1&offset=1')).body).toHaveLength(1);
  expect((await json('user_a', 'GET', '/v1/trips?month=oct')).status).toBe(400);
});

it('deleting the only finished trip of a list puts the list back to draft', async () => {
  const l = await listWithMilk();
  const { body: t } = await json('user_a', 'POST', '/v1/trips', { listId: l.id });
  await req('user_a', 'POST', `/v1/trips/${t.id}/finish`, { billTotalPaise: 6800 });
  expect((await json('user_a', 'GET', `/v1/lists/${l.id}`)).body.status).toBe('done');
  await req('user_a', 'DELETE', `/v1/trips/${t.id}`);
  expect((await json('user_a', 'GET', `/v1/lists/${l.id}`)).body.status).toBe('draft');
});

it('DELETE /transactions/:id removes a manual expense; cart spends must go through their trip', async () => {
  const cats = (await json('user_a', 'GET', '/v1/categories')).body as { id: string; slug: string }[];
  const groceries = cats.find(c => c.slug === 'groceries')!.id;
  const { body: m } = await json('user_a', 'POST', '/v1/transactions', { amountPaise: 5000, direction: 'debit', categoryId: groceries, occurredAt: new Date().toISOString() });
  expect((await req('user_b', 'DELETE', `/v1/transactions/${m.id}`)).status).toBe(404);
  expect((await req('user_a', 'DELETE', `/v1/transactions/${m.id}`)).status).toBe(204);
  const { body: t } = await json('user_a', 'POST', '/v1/trips', {});
  const fin = await json('user_a', 'POST', `/v1/trips/${t.id}/finish`, { billTotalPaise: 100 });
  const r = await json('user_a', 'DELETE', `/v1/transactions/${fin.body.transactionId}`);
  expect(r.status).toBe(409);
  expect(r.body.error.code).toBe('delete_trip_instead');
});
