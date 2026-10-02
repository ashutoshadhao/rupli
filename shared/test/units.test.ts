import { describe, it, expect } from 'vitest';
import { parsePack, toBase, packsBaseUnit, compare } from '../src/units';

it('parses packs', () => {
  expect(parsePack('500 ml')).toEqual({ qty: 500, unit: 'ml' });
  expect(parsePack('1 l')).toEqual({ qty: 1, unit: 'L' });
  expect(parsePack('12 pc')).toEqual({ qty: 12, unit: 'pcs' });
  expect(parsePack('big')).toBeNull();
});
it('converts to base', () => expect(toBase(250, 'g')).toEqual({ qty: 0.25, unit: 'kg' }));
it('packsBaseUnit', () => {
  expect(packsBaseUnit(['500 ml', '1 L'])).toBe('L');
  expect(packsBaseUnit(['500 g', '1 L'])).toBeNull();
});
describe('compare', () => {
  it('design example: 5 L saves ₹9/L · 5.5%', () => {
    const r = compare([
      { name: 'Fortune 1 L', qty: 1, unit: 'L', pricePaise: 16500 },
      { name: 'Fortune 5 L', qty: 5, unit: 'L', pricePaise: 78000 },
      { name: 'Saffola 1 L', qty: 1, unit: 'L', pricePaise: 19900 },
    ]);
    expect(r).toMatchObject({ bestIndex: 1, baseUnit: 'L', savingPerUnitPaise: 900, savingPct: 5.5, error: null });
    expect(r.perUnitPaise).toEqual([16500, 15600, 19900]);
  });
  it('mixes g and kg', () => {
    const r = compare([{ name: 'a', qty: 500, unit: 'g', pricePaise: 6000 }, { name: 'b', qty: 1, unit: 'kg', pricePaise: 11000 }]);
    expect(r.bestIndex).toBe(1);
  });
  it('ignores zero/empty options (no Infinity/NaN)', () => {
    const r = compare([{ name: 'a', qty: 0, unit: 'L', pricePaise: 100 }, { name: 'b', qty: 1, unit: 'L', pricePaise: 0 }, { name: 'c', qty: 1, unit: 'L', pricePaise: 100 }]);
    expect(r).toMatchObject({ error: 'need_two', bestIndex: null });
    expect(r.perUnitPaise).toEqual([null, null, 100]);
  });
  it('refuses mixed units', () => {
    expect(compare([{ name: 'a', qty: 1, unit: 'kg', pricePaise: 1 }, { name: 'b', qty: 1, unit: 'L', pricePaise: 1 }]).error).toBe('mixed_units');
  });
});
