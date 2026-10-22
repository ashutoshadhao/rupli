import { it, expect } from 'vitest';
import { shareText } from '../src/logic/lists';
import { budgetStatus, cheapest, spendCsv } from '../src/logic/spend';

it('shareText groups items and ticks picked ones', () => {
  const t = shareText({ name: 'Oct 2026 · Monthly Kirana', month: '2026-10', items: [
    { checked: true, qty: 2, packSize: '1 L', brand: 'Amul', product: { name: 'Milk', category: 'dairy' } },
    { checked: false, qty: 1, packSize: '5 kg', brand: null, product: { name: 'Atta', category: 'atta-rice' } },
  ] });
  expect(t).toContain('✅ Milk · 1 L × 2 (Amul)');
  expect(t).toContain('▫️ Atta · 5 kg');
  expect(t).not.toContain('5 kg ×');
});

it('budgetStatus warns at 80% and flags over-budget', () => {
  expect(budgetStatus(100, null)).toBeNull();
  expect(budgetStatus(7900, 10000)!.level).toBe('ok');
  expect(budgetStatus(8000, 10000)!.level).toBe('warn');
  expect(budgetStatus(10500, 10000)).toEqual({ pct: 105, leftPaise: -500, level: 'over' });
});

it('spendCsv: IST dates, quoted cells, oldest first', () => {
  const csv = spendCsv([
    { occurredAt: '2026-10-02T20:00:00Z', amountPaise: 12550, direction: 'debit', merchant: 'DMart, Thane', note: 'he said "ok"', source: 'cart', category: { name: 'Groceries' } },
    { occurredAt: '2026-10-01T03:00:00Z', amountPaise: 210000, direction: 'debit', merchant: null, note: null, source: 'manual', category: { name: 'Household' } },
  ]).split('\n');
  expect(csv[1]).toBe('2026-10-01,Household,Household,2100.00,manual,');
  expect(csv[2]).toBe('2026-10-03,"DMart, Thane",Groceries,125.50,cart,"he said ""ok"""');
});

it('cheapest looks only at the latest pack size', () => {
  const rows = [{ packSize: '1 L', pricePaise: 190, store: 'A' }, { packSize: '5 L', pricePaise: 100, store: 'B' }, { packSize: '1 L', pricePaise: 170, store: 'C' }];
  expect(cheapest(rows)!.store).toBe('C');
  expect(cheapest([])).toBeNull();
});
