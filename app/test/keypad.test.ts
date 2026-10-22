import { it, expect } from 'vitest';
import { pressKey, rupeesToPaise } from '../src/logic/keypad';

it('appends digits up to 5', () => {
  let v = '';
  for (const k of ['1', '2', '3', '4', '5', '6'] as const) v = pressKey(v, k);
  expect(v).toBe('12345');
});
it('C clears, ⌫ deletes, ⌫ on empty stays empty', () => {
  expect(pressKey('177', 'C')).toBe('');
  expect(pressKey('177', '⌫')).toBe('17');
  expect(pressKey('', '⌫')).toBe('');
});
it('drops leading zeros', () => {
  expect(pressKey('', '0')).toBe('');
  expect(pressKey(pressKey('', '0'), '5')).toBe('5');
  expect(pressKey('5', '0')).toBe('50');
});
it('converts to paise; empty or 0 is null', () => {
  expect(rupeesToPaise('177')).toBe(17700);
  expect(rupeesToPaise('')).toBeNull();
});

it('untouched keypad keeps the exact last price, incl. paise', async () => {
  const { priceFromKeypad } = await import('../src/logic/keypad');
  expect(priceFromKeypad(null, 4550)).toBe(4550);
  expect(priceFromKeypad('46', 4550)).toBe(4600);
  expect(priceFromKeypad('', 4550)).toBeNull();
  expect(priceFromKeypad(null, null)).toBeNull();
});
