import { it, expect } from 'vitest';
import { recheckItems, splitToPickInCart } from '../src/logic/cart';

const li = (id: string) => ({ id, productId: `p${id}`, packSize: '1 kg', checked: false });
it('items already in the cart leave To pick', () => {
  const { toPick, inCart } = splitToPickInCart([li('1'), li('2'), li('3')], [{ id: 't1', listItemId: '2' }, { id: 't2', listItemId: null }]);
  expect(toPick.map(i => i.id)).toEqual(['1', '3']);
  expect(inCart.map(i => i.id)).toEqual(['t1', 't2']);
});
it('recheck: changed prices and weighed produce, in that order', () => {
  const items = [
    { id: 'a', productId: 'dal', packSize: '1 kg', qty: 2, pricePaise: 17700, product: { category: 'dal' } },
    { id: 'b', productId: 'onion', packSize: '2 kg', qty: 1, pricePaise: 6000, product: { category: 'sabzi' } },
    { id: 'c', productId: 'milk', packSize: '1 L', qty: 30, pricePaise: 6800, product: { category: 'dairy' } },
    { id: 'd', productId: 'eggs', packSize: '12 pcs', qty: 1, pricePaise: 8400, product: { category: 'bakery-eggs' } },
  ];
  const last = (p: string) => ({ dal: 16500, milk: 6800, onion: 6000 } as Record<string, number>)[p] ?? null;
  expect(recheckItems(items, last)).toEqual([
    { item: items[0], reason: 'changed', lastPaise: 16500 },
    { item: items[1], reason: 'weighed', lastPaise: 6000 },
  ]);
});
