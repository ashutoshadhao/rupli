import { chartColors } from '../chartColors';

const GROUPS = [
  { key: 'dairy', label: 'Dairy', cats: ['dairy'] }, { key: 'atta-rice', label: 'Atta & Rice', cats: ['atta-rice'] },
  { key: 'sabzi-fruits', label: 'Sabzi & Fruits', cats: ['sabzi', 'fruits'] }, { key: 'oil-ghee', label: 'Oil & Ghee', cats: ['oil-ghee'] },
  { key: 'cleaning', label: 'Cleaning', cats: ['cleaning'] },
] as const;

export function groupDonut(rows: { category: string; totalPaise: number }[]) {
  const total = rows.reduce((s, r) => s + r.totalPaise, 0);
  const out = [...GROUPS.map(g => ({ key: g.key as string, label: g.label as string, totalPaise: rows.filter(r => (g.cats as readonly string[]).includes(r.category)).reduce((s, r) => s + r.totalPaise, 0) })),
    { key: 'other', label: 'Other', totalPaise: rows.filter(r => !GROUPS.some(g => (g.cats as readonly string[]).includes(r.category))).reduce((s, r) => s + r.totalPaise, 0) }];
  return out.filter(g => g.totalPaise > 0).map(g => ({
    ...g, color: chartColors[g.key as keyof typeof chartColors], pct: total ? (g.totalPaise / total) * 100 : 0,
  }));
}

export const pctChange = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

export function barHeights(values: number[]) {
  const max = Math.max(...values, 0);
  return values.map(v => (max > 0 ? Math.max(4, Math.round((v / max) * 100)) : 4));
}

// grocery budget: warn from 80 %, "over" past 100 %
export function budgetStatus(spentPaise: number, budgetPaise: number | null) {
  if (!budgetPaise) return null;
  const pct = Math.round((spentPaise / budgetPaise) * 100);
  return { pct, leftPaise: budgetPaise - spentPaise, level: pct >= 100 ? 'over' as const : pct >= 80 ? 'warn' as const : 'ok' as const };
}

const istDate = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function spendCsv(txns: { occurredAt: string; amountPaise: number; direction: string; merchant: string | null; note: string | null; source: string; category: { name: string } }[]) {
  const rows = [...txns].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)).map(t => [
    istDate(t.occurredAt), t.merchant ?? t.category.name, t.category.name,
    ((t.direction === 'credit' ? -1 : 1) * t.amountPaise / 100).toFixed(2), t.source, t.note ?? '',
  ].map(csvCell).join(','));
  return ['Date,Paid to,Category,Amount (INR),Source,Note', ...rows].join('\n');
}

// cheapest the user paid for the pack size they bought most recently
export function cheapest<T extends { packSize: string; pricePaise: number }>(rows: T[]): T | null {
  const same = rows.filter(r => r.packSize === rows[0]?.packSize);
  return same.reduce<T | null>((m, r) => (!m || r.pricePaise < m.pricePaise ? r : m), null);
}
