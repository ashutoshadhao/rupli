import { beforeEach, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, json, req, productId, resetDb } from './helpers';
import { transactions } from '../src/db/schema';

beforeEach(resetDb);

async function listWithDal(user = 'user_a') {
  const { body: l } = await json(user, 'POST', '/v1/lists', { name: 'Oct', month: '2026-10' });
  const { body: item } = await json(user, 'POST', `/v1/lists/${l.id}/items`, { productId: await productId('toor-dal'), packSize: '1 kg', brand: null, qty: 2 });
  return { list: l, item };
}

it('start from list → add → finish → last price + list done + cart txn', async () => {
  const { list, item } = await listWithDal();
  const { status, body: trip } = await json('user_a', 'POST', '/v1/trips', { listId: list.id, store: 'DMart, Kothrud' });
  expect(status).toBe(201);
  expect((await json('user_a', 'GET', `/v1/lists/${list.id}`)).body.status).toBe('shopping');

  const add = await json('user_a', 'POST', `/v1/trips/${trip.id}/items`, { productId: item.productId, packSize: '1 kg', brand: null, qty: 2, pricePaise: 17700, listItemId: item.id });
  expect(add.status).toBe(201);
  const { body: t } = await json('user_a', 'GET', `/v1/trips/${trip.id}`);
  expect(t.items[0]).toMatchObject({ qty: 2, pricePaise: 17700, product: { name: 'Toor dal' } });

  const fin = await json('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 35400 });
  expect(fin.status).toBe(200);
  const [txn] = await db.select().from(transactions).where(eq(transactions.tripId, trip.id));
  expect(txn).toMatchObject({ source: 'cart', amountPaise: 35400, direction: 'debit', merchant: 'DMart, Kothrud', sourceRef: trip.id });
  expect(fin.body.transactionId).toBe(txn!.id);

  const { body: l } = await json('user_a', 'GET', `/v1/lists/${list.id}`);
  expect(l.status).toBe('done');
  expect(l.items[0]).toMatchObject({ lastPricePaise: 17700 });

  const { body: recent } = await json('user_a', 'GET', '/v1/trips?limit=5');
  expect(recent[0]).toMatchObject({ id: trip.id, itemCount: 1, totalPaise: 35400, billTotalPaise: 35400 });
});

it('finishing twice → 409 and only one cart transaction', async () => {
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', {});
  expect((await req('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 1000 })).status).toBe(200);
  const again = await json('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 1000 });
  expect(again.status).toBe(409);
  expect(again.body.error.code).toBe('trip_finished');
  expect(await db.select().from(transactions).where(eq(transactions.tripId, trip.id))).toHaveLength(1);
});

it('finished trip is read-only', async () => {
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', {});
  await req('user_a', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 1000 });
  const r = await req('user_a', 'POST', `/v1/trips/${trip.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 1, pricePaise: 6800 });
  expect(r.status).toBe(409);
  expect((await req('user_a', 'POST', `/v1/trips/${trip.id}/pause`)).status).toBe(409);
});

it('edit and delete trip items, pause toggles', async () => {
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', {});
  const { body: ti } = await json('user_a', 'POST', `/v1/trips/${trip.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: 'Amul', qty: 1, pricePaise: 6800 });
  expect((await json('user_a', 'PATCH', `/v1/trips/${trip.id}/items/${ti.id}`, { pricePaise: 7000 })).body.pricePaise).toBe(7000);
  expect((await req('user_a', 'DELETE', `/v1/trips/${trip.id}/items/${ti.id}`)).status).toBe(204);
  expect((await json('user_a', 'POST', `/v1/trips/${trip.id}/pause`)).body.pausedAt).not.toBeNull();
  expect((await json('user_a', 'POST', `/v1/trips/${trip.id}/pause`)).body.pausedAt).toBeNull();
});

it('cross-user → 404 (trip, list on start)', async () => {
  const { list } = await listWithDal('user_a');
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', {});
  expect((await req('user_b', 'GET', `/v1/trips/${trip.id}`)).status).toBe(404);
  expect((await req('user_b', 'POST', `/v1/trips/${trip.id}/finish`, { billTotalPaise: 100 })).status).toBe(404);
  expect((await req('user_b', 'POST', '/v1/trips', { listId: list.id })).status).toBe(404);
});

it.todo('SMS that arrived before finish gets linked (enabled in Task 9)');
