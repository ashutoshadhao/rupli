import { beforeEach, it, expect } from 'vitest';
import { json, req, productId, resetDb } from './helpers';

beforeEach(resetDb);

it('401 without token, health is public', async () => {
  expect((await req(null, 'GET', '/v1/lists')).status).toBe(401);
  expect((await req(null, 'GET', '/health')).status).toBe(200);
});

it('create → add item → get → copy', async () => {
  const { body: l } = await json('user_a', 'POST', '/v1/lists', { name: 'Oct 2026 · Monthly Kirana', month: '2026-10' });
  const milk = await productId('milk');
  expect((await req('user_a', 'POST', `/v1/lists/${l.id}/items`, { productId: milk, packSize: '1 L', brand: 'Amul', qty: 30 })).status).toBe(201);
  const { body: got } = await json('user_a', 'GET', `/v1/lists/${l.id}`);
  expect(got).toMatchObject({ month: '2026-10', status: 'draft' });
  expect(got.items[0]).toMatchObject({ qty: 30, packSize: '1 L', brand: 'Amul', lastPricePaise: null, product: { name: 'Milk', emoji: '🥛' } });

  await req('user_a', 'PATCH', `/v1/lists/${l.id}/items/${got.items[0].id}`, { checked: true });
  const { body: all } = await json('user_a', 'GET', '/v1/lists');
  expect(all[0]).toMatchObject({ itemCount: 1, checkedCount: 1, estimatePaise: 0 });

  const { status, body: copy } = await json('user_a', 'POST', `/v1/lists/${l.id}/copy`, { name: 'Nov 2026 · Monthly Kirana', month: '2026-11' });
  expect(status).toBe(201);
  const { body: c } = await json('user_a', 'GET', `/v1/lists/${copy.id}`);
  expect(c).toMatchObject({ month: '2026-11', copiedFrom: l.id });
  expect(c.items[0]).toMatchObject({ qty: 30, checked: false, brand: 'Amul' });
});

it('delete item and archive list', async () => {
  const { body: l } = await json('user_a', 'POST', '/v1/lists', { name: 'A' });
  const { body: it1 } = await json('user_a', 'POST', `/v1/lists/${l.id}/items`, { productId: await productId('onion'), packSize: '2 kg', brand: null, qty: 1 });
  expect((await req('user_a', 'DELETE', `/v1/lists/${l.id}/items/${it1.id}`)).status).toBe(204);
  await req('user_a', 'PATCH', `/v1/lists/${l.id}`, { archived: true });
  expect((await json('user_a', 'GET', '/v1/lists')).body).toEqual([]);
});

it('cross-user and bad ids → 404', async () => {
  const { body: l } = await json('user_a', 'POST', '/v1/lists', { name: 'A' });
  expect((await req('user_b', 'GET', `/v1/lists/${l.id}`)).status).toBe(404);
  expect((await req('user_b', 'PATCH', `/v1/lists/${l.id}`, { name: 'x' })).status).toBe(404);
  expect((await req('user_b', 'POST', `/v1/lists/${l.id}/copy`, { name: 'x' })).status).toBe(404);
  expect((await req('user_b', 'POST', `/v1/lists/${l.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 1 })).status).toBe(404);
  expect((await req('user_a', 'GET', '/v1/lists/not-a-uuid')).status).toBe(404);
});

it('custom products are private', async () => {
  const { status, body: p } = await json('user_a', 'POST', '/v1/products', { name: 'Ragi papad', category: 'snacks', emoji: '🫓', packSizes: ['200 g'] });
  expect(status).toBe(201);
  expect(p.baseUnit).toBe('kg');
  const { body: l } = await json('user_b', 'POST', '/v1/lists', { name: 'B' });
  expect((await req('user_b', 'POST', `/v1/lists/${l.id}/items`, { productId: p.id, packSize: '200 g', brand: null, qty: 1 })).status).toBe(404);
  const { body: bProducts } = await json('user_b', 'GET', '/v1/products');
  expect(bProducts.some((x: { id: string }) => x.id === p.id)).toBe(false);
  expect(bProducts.length).toBeGreaterThanOrEqual(250);
});

it('categories and usual', async () => {
  const { body: cats } = await json('user_a', 'GET', '/v1/categories');
  expect(cats.map((c: { slug: string }) => c.slug)).toContain('groceries');
  const { body: l } = await json('user_a', 'POST', '/v1/lists', { name: 'A' });
  const milk = await productId('milk');
  await req('user_a', 'POST', `/v1/lists/${l.id}/items`, { productId: milk, packSize: '1 L', brand: null, qty: 1 });
  expect((await json('user_a', 'GET', '/v1/products/usual')).body).toEqual([milk]);
});

it('400 on invalid input with error shape', async () => {
  const r = await json('user_a', 'POST', '/v1/lists', { name: '' });
  expect(r.status).toBe(400);
  expect(r.body.error.code).toBe('invalid_input');
  const bad = await req('user_a', 'POST', '/v1/lists');
  expect(bad.status).toBe(400);
});

it('empty PATCH body → 400, not 500', async () => {
  const { body: l } = await json('user_a', 'POST', '/v1/lists', { name: 'A' });
  const { body: i } = await json('user_a', 'POST', `/v1/lists/${l.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 1 });
  expect((await req('user_a', 'PATCH', `/v1/lists/${l.id}`, {})).status).toBe(400);
  expect((await req('user_a', 'PATCH', `/v1/lists/${l.id}/items/${i.id}`, {})).status).toBe(400);
  const { body: trip } = await json('user_a', 'POST', '/v1/trips', {});
  const { body: ti } = await json('user_a', 'POST', `/v1/trips/${trip.id}/items`, { productId: await productId('milk'), packSize: '1 L', brand: null, qty: 1, pricePaise: 6800 });
  expect((await req('user_a', 'PATCH', `/v1/trips/${trip.id}/items/${ti.id}`, {})).status).toBe(400);
});
