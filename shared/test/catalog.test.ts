import { it, expect } from 'vitest';
import { CATALOG, PRODUCT_CATEGORIES, searchProducts } from '../src/catalog';
import { packsBaseUnit } from '../src/units';
import { SmsBatch, AddTripItem, CreateProduct } from '../src/schemas';

it('catalog is well-formed', () => {
  expect(CATALOG.length).toBeGreaterThanOrEqual(250);
  expect(new Set(CATALOG.map(p => p.slug)).size).toBe(CATALOG.length);
  for (const p of CATALOG) {
    expect(packsBaseUnit(p.packSizes), p.slug).toBe(p.baseUnit);
    expect(PRODUCT_CATEGORIES.some(c => c.slug === p.category), p.slug).toBe(true);
  }
  for (const c of PRODUCT_CATEGORIES) expect(CATALOG.filter(p => p.category === c.slug).length, c.slug).toBeGreaterThanOrEqual(8);
});
it('includes the design sample items', () => {
  for (const s of ['milk', 'atta', 'toor-dal', 'sunflower-oil', 'salt', 'onion', 'detergent-powder', 'eggs'])
    expect(CATALOG.some(p => p.slug === s), s).toBe(true);
});
it('search by alias', () => {
  expect(searchProducts('doodh', CATALOG)[0]?.slug).toBe('milk');
  expect(searchProducts('kanda', CATALOG)[0]?.slug).toBe('onion');
  expect(searchProducts('Aloo', CATALOG)[0]?.slug).toBe('potato');
  expect(searchProducts('  ', CATALOG)).toEqual([]);
});
it('schemas', () => {
  expect(AddTripItem.safeParse({ productId: crypto.randomUUID(), packSize: '1 L', brand: null, qty: 1, pricePaise: 0 }).success).toBe(false);
  expect(SmsBatch.safeParse({ items: [] }).success).toBe(true);
  expect(CreateProduct.safeParse({ name: 'Ragi', category: 'atta-rice', emoji: '🌾', packSizes: ['1 kg'] }).success).toBe(true);
  expect(CreateProduct.safeParse({ name: 'Ragi', category: 'atta-rice', emoji: '🌾', packSizes: ['1 kg', '1 L'] }).success).toBe(false);
  expect(CreateProduct.safeParse({ name: 'Ragi', category: 'nope', emoji: '🌾', packSizes: ['1 kg'] }).success).toBe(false);
});
