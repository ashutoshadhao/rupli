import { describe, it, expect } from 'vitest';
import { parseRupeesToPaise, formatINR } from '../src/money';

describe('parseRupeesToPaise', () => {
  it.each([
    ['486.00', 48600], ['1,250.00', 125000], ['1,25,000.00', 12500000],
    ['250.0', 25000], ['500', 50000], ['0.5', 50],
  ])('%s → %i', (s, p) => expect(parseRupeesToPaise(s)).toBe(p));
  it.each(['', 'abc', '1.234', '-5'])('rejects %s', s => expect(parseRupeesToPaise(s)).toBeNull());
});

describe('formatINR', () => {
  it('formats Indian style', () => {
    expect(formatINR(12500000)).toBe('₹1,25,000');
    expect(formatINR(6850)).toBe('₹68.50');
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-2300)).toBe('-₹23');
  });
});
