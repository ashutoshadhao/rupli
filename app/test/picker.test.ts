import { it, expect } from 'vitest';
import { pickReducer, selectionEstimate, type Selection } from '../src/logic/picker';

it('add, update, remove selections', () => {
  let s: Selection = {};
  s = pickReducer(s, { type: 'set', item: { productId: 'milk', packSize: '1 L', brand: 'Amul', qty: 2 } });
  s = pickReducer(s, { type: 'set', item: { productId: 'dal', packSize: '1 kg', brand: null, qty: 1 } });
  s = pickReducer(s, { type: 'set', item: { productId: 'milk', packSize: '500 ml', brand: null, qty: 4 } });
  expect(Object.values(s)).toHaveLength(2);
  expect(s.milk).toMatchObject({ packSize: '500 ml', qty: 4 });
  s = pickReducer(s, { type: 'remove', productId: 'dal' });
  expect(Object.keys(s)).toEqual(['milk']);
});
it('estimate uses last price for the chosen pack, unknown counts 0', () => {
  const s: Selection = {
    milk: { productId: 'milk', packSize: '1 L', brand: null, qty: 30 },
    dal: { productId: 'dal', packSize: '1 kg', brand: null, qty: 2 },
  };
  const last = (p: string, pack: string) => (p === 'milk' && pack === '1 L' ? 6800 : null);
  expect(selectionEstimate(s, last)).toBe(204000);
});
