import { it, expect } from 'vitest';
import { matchRule, defaultCategorySlug } from '../src/sms/categorize';
import { findCartMatch, smsFallbackRef } from '../src/sms/dedupe';

it('defaults', () => {
  expect(defaultCategorySlug('ZEPTO MARKETPLACE', 'debit')).toBe('groceries');
  expect(defaultCategorySlug('Swiggy Instamart', 'debit')).toBe('groceries');
  expect(defaultCategorySlug('SWIGGY', 'debit')).toBe('food');
  expect(defaultCategorySlug('rapido@ybl', 'debit')).toBe('transport');
  expect(defaultCategorySlug('Motorola Store', 'debit')).toBe('uncategorised');
  expect(defaultCategorySlug('aarti@okicici', 'credit')).toBe('income');
  expect(defaultCategorySlug(null, 'debit')).toBe('uncategorised');
});
it('user rules first', () => expect(matchRule('ZEPTO', [{ pattern: 'zepto', key: 'c1' }])).toBe('c1'));
it('regex chars in pattern are literal', () => expect(matchRule('a+b store', [{ pattern: 'a+b', key: 1 }])).toBe(1));
it('cart match: same amount, closest within 30 min', () => {
  const at = new Date('2026-10-01T12:00:00Z');
  const carts = [
    { id: 'far', amountPaise: 234800, occurredAt: new Date('2026-10-01T12:45:00Z') },
    { id: 'near', amountPaise: 234800, occurredAt: new Date('2026-10-01T12:10:00Z') },
    { id: 'other', amountPaise: 1000, occurredAt: at },
  ];
  expect(findCartMatch({ amountPaise: 234800, occurredAt: at }, carts)).toBe('near');
  expect(findCartMatch({ amountPaise: 5, occurredAt: at }, carts)).toBeNull();
});
it('fallback ref is deterministic', () =>
  expect(smsFallbackRef({ bank: 'HDFC Bank', last4: '9012', amountPaise: 234800, occurredAt: '2026-09-30T13:35:22.000Z' }))
    .toBe('HDFC Bank:9012:234800:2026-09-30T13:35:22.000Z'));
