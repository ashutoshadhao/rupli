import { it, expect } from 'vitest';
import { plural, sortByCatalog, txnTitle } from '../src/logic/text';

it('plural', () => {
  expect(plural(1, 'item')).toBe('1 item');
  expect(plural(0, 'item')).toBe('0 items');
  expect(plural(3, 'trip')).toBe('3 trips');
  expect(plural(1, 'list')).toBe('1 list');
});
it('picker shows catalog order (most bought first), custom products last', () => {
  const p = (slug: string | null, name: string) => ({ slug, name });
  const sorted = sortByCatalog([p('butter', 'Butter'), p(null, 'My ragi'), p('milk', 'Milk'), p('atta', 'Wheat atta'), p('bajra-atta', 'Bajra atta')]);
  expect(sorted.map(x => x.name)).toEqual(['Milk', 'Butter', 'Wheat atta', 'Bajra atta', 'My ragi']);
});
it('txnTitle: merchant, else note, else category', () => {
  const t = (merchant: string | null, note: string | null) => ({ merchant, note, category: { name: 'Groceries' } });
  expect(txnTitle(t('Zepto', 'x'))).toBe('Zepto');
  expect(txnTitle(t(null, 'sabzi wala'))).toBe('sabzi wala');
  expect(txnTitle(t(null, null))).toBe('Groceries');
});
