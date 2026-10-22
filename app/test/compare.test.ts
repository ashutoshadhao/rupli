import { it, expect } from 'vitest';
import { compareDraft, perUnitLabel } from '../src/logic/compare';

const d = (name: string, qty: string, unit: 'g' | 'kg' | 'ml' | 'L' | 'pcs', price: string) => ({ name, qty, unit, price });

it('design example', () => {
  const v = compareDraft([d('Fortune 1 L', '1', 'L', '165'), d('Fortune 5 L', '5', 'L', '780'), d('Saffola 1 L', '1', 'L', '199')]);
  expect(v.bestIndex).toBe(1);
  expect(v.saving).toBe('saves ₹9/L · 5.5%');
  expect(v.rows.map(r => r.label)).toEqual(['₹165/L', '₹156/L', '₹199/L']);
  expect(v.rows[2]!.widthPct).toBe(100);
});
it('blank or zero fields never produce NaN/Infinity', () => {
  const v = compareDraft([d('A', '', 'L', '165'), d('B', '0', 'L', ''), d('C', '1', 'L', '199')]);
  expect(v.bestIndex).toBeNull();
  expect(JSON.stringify(v)).not.toMatch(/NaN|Infinity/);
  expect(v.message).toBe('Fill in at least two packs');
});
it('mixed units message, decimals accepted', () => {
  expect(compareDraft([d('A', '1', 'kg', '50'), d('B', '1', 'L', '60')]).message).toBe('Compare kg with kg or L with L');
  expect(perUnitLabel(4999, 'kg')).toBe('₹49.99/kg');
  expect(compareDraft([d('A', '1.5', 'kg', '75.50'), d('B', '500', 'g', '30')]).bestIndex).toBe(0);
});

it('switching one option to another unit family moves every option with it', async () => {
  const { setUnit } = await import('../src/logic/compare');
  const opts = [d('A', '1', 'L', '165'), d('B', '5', 'L', '780'), d('C', '1', 'L', '199')];
  expect(setUnit(opts, 1, 'g').map(o => o.unit)).toEqual(['g', 'g', 'g']);
  // same family stays per-option: 500 g vs 1 kg is a fair comparison
  const mass = [d('A', '500', 'g', '60'), d('B', '1', 'g', '110')];
  expect(setUnit(mass, 1, 'kg').map(o => o.unit)).toEqual(['g', 'kg']);
});
