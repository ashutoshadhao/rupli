import { it, expect } from 'vitest';
import { cartTotal, billCheck, priceDelta, estimateTotal } from '../src/cart';
it('totals', () => expect(cartTotal([{ qty: 2, pricePaise: 17700 }, { qty: 1, pricePaise: 6000 }])).toBe(41400));
it('bill check', () => {
  expect(billCheck(234800, 234800)).toEqual({ status: 'match' });
  expect(billCheck(234800, 237100)).toEqual({ status: 'over', diffPaise: 2300 });
  expect(billCheck(234800, 234000)).toEqual({ status: 'under', diffPaise: 800 });
});
it('price delta', () => {
  expect(priceDelta(17700, 16500)).toEqual({ kind: 'more', diffPaise: 1200 });
  expect(priceDelta(16000, 16500)).toEqual({ kind: 'less', diffPaise: 500 });
  expect(priceDelta(16500, 16500)).toEqual({ kind: 'same' });
  expect(priceDelta(16500, null)).toEqual({ kind: 'none' });
});
it('estimate skips unknown prices', () => expect(estimateTotal([{ qty: 30, lastPricePaise: 6800 }, { qty: 1, lastPricePaise: null }])).toBe(204000));
