import { CATALOG, DEFAULT_CATEGORIES } from '@rupli/shared';
import type { Category, ListDetail, ListSummary, Product, Spend, Trip } from '../api';

// sample data from docs/design/handoff/README.md, for the dev gallery only
const P = (id: string, name: string, alias: string, emoji: string, category: string) => ({ id, name, aliases: [alias], emoji, category });
const item = (id: string, product: ReturnType<typeof P>, packSize: string, brand: string | null, qty: number, last: number | null, checked = false) =>
  ({ id, listId: 'l1', productId: product.id, packSize, brand, qty, checked, position: 0, lastPricePaise: last, lastBrand: brand, product });

const lists: ListSummary[] = [
  { id: 'l1', name: 'Oct 2026 · Monthly Kirana', month: '2026-10', status: 'shopping', copiedFrom: null, createdAt: '2026-10-01', itemCount: 40, checkedCount: 12, estimatePaise: 685000, paidPaise: null },
  { id: 'l2', name: 'Diwali & Pooja', month: '2026-11', status: 'draft', copiedFrom: null, createdAt: '2026-10-02', itemCount: 16, checkedCount: 0, estimatePaise: 234000, paidPaise: null },
  { id: 'l3', name: 'Sep 2026 · Monthly Kirana', month: '2026-09', status: 'done', copiedFrom: null, createdAt: '2026-09-01', itemCount: 38, checkedCount: 38, estimatePaise: 910500, paidPaise: 910500 },
  { id: 'l4', name: 'Aug 2026 · Monthly Kirana', month: '2026-08', status: 'done', copiedFrom: null, createdAt: '2026-08-01', itemCount: 41, checkedCount: 41, estimatePaise: 821000, paidPaise: 821000 },
];

const trips: Trip[] = [
  { id: 't1', listId: 'l3', store: 'DMart, Kothrud', startedAt: '2026-09-28T11:00:00Z', pausedAt: null, finishedAt: '2026-09-28T12:00:00Z', billTotalPaise: 234800, itemCount: 18, totalPaise: 234800 },
  { id: 't2', listId: null, store: 'Zepto', startedAt: '2026-09-24T11:00:00Z', pausedAt: null, finishedAt: '2026-09-24T12:00:00Z', billTotalPaise: 48600, itemCount: 6, totalPaise: 48600 },
  { id: 't3', listId: null, store: 'Sabzi mandi', startedAt: '2026-09-21T11:00:00Z', pausedAt: null, finishedAt: '2026-09-21T12:00:00Z', billTotalPaise: 32000, itemCount: 9, totalPaise: 32000 },
];

const milk = P('p1', 'Milk', 'doodh', '🥛', 'dairy'), atta = P('p2', 'Aashirvaad Atta', 'gehu', '🌾', 'atta-rice');
const dal = P('p3', 'Toor Dal', 'arhar', '🫘', 'dal'), oil = P('p4', 'Sunflower Oil', 'tel', '🌻', 'oil-ghee');
const listDetail: ListDetail = {
  ...lists[0]!, items: [
    item('i1', milk, '1 L', 'Amul', 30, 6800), item('i2', atta, '10 kg', 'Aashirvaad', 1, 48500, true),
    item('i3', dal, '1 kg', null, 2, 16500), item('i4', oil, '5 L', 'Fortune', 1, 78000, true),
  ],
};

const products: Product[] = CATALOG.map(p => ({ ...p, id: p.slug, userId: null }));
const PRICES: Record<string, number> = { 'milk|1 L': 6800, 'milk|500 ml': 3400, 'milk|6 L': 39600, 'toor-dal|1 kg': 16500, 'atta|10 kg': 48500 };
const lastPrice = (id: string, pack: string) => (PRICES[`${id}|${pack}`] ? { pricePaise: PRICES[`${id}|${pack}`]!, brand: id === 'milk' ? 'Amul' : null, at: '2026-09-28' } : null);

const trip = {
  id: 'trip1', listId: 'l1', store: 'DMart, Kothrud', startedAt: '2026-10-02T10:00:00Z', pausedAt: null, finishedAt: null, billTotalPaise: null,
  items: [
    { id: 'ti2', tripId: 'trip1', productId: 'p2', packSize: '10 kg', brand: 'Aashirvaad', qty: 1, pricePaise: 48500, listItemId: 'i2', product: atta },
    { id: 'ti3', tripId: 'trip1', productId: 'p3', packSize: '1 kg', brand: null, qty: 2, pricePaise: 17700, listItemId: 'i3', product: dal },
    { id: 'ti4', tripId: 'trip1', productId: 'p4', packSize: '5 L', brand: 'Fortune', qty: 1, pricePaise: 78000, listItemId: 'i4', product: oil },
  ],
};

const categories: Category[] = DEFAULT_CATEGORIES.map(c => ({ ...c, id: c.slug, userId: null }));
const cat = (slug: string) => { const c = categories.find(x => x.slug === slug)!; return { id: c.id, name: c.name, emoji: c.emoji }; };
const spend: Spend = {
  month: '2026-10', totalPaise: 842000, allPaise: 872000, prevTotalPaise: 910500, budgetPaise: 1000000,
  months: [['2026-05', 690000], ['2026-06', 760000], ['2026-07', 905000], ['2026-08', 821000], ['2026-09', 910500], ['2026-10', 842000]].map(([month, totalPaise]) => ({ month: month as string, totalPaise: totalPaise as number })),
  byProductCategory: [{ category: 'dairy', totalPaise: 219000 }, { category: 'atta-rice', totalPaise: 193600 }, { category: 'sabzi', totalPaise: 134700 },
    { category: 'oil-ghee', totalPaise: 109500 }, { category: 'cleaning', totalPaise: 67400 }, { category: 'other', totalPaise: 117800 }],
  transactions: [
    { id: 'x1', amountPaise: 48600, direction: 'debit', occurredAt: new Date(Date.now() - 86_400_000).toISOString(), merchant: 'Zepto', source: 'sms', sourceRef: '427519830042', note: null, category: { ...cat('food'), emoji: '🛵' }, account: { bank: 'HDFC Bank', last4: '1234' } },
    { id: 'x2', amountPaise: 234800, direction: 'debit', occurredAt: '2026-09-28T12:00:00Z', merchant: 'DMart, Kothrud', source: 'cart', sourceRef: 't1', note: null, category: cat('groceries'), account: null },
    { id: 'x3', amountPaise: 12000, direction: 'debit', occurredAt: '2026-09-27T09:00:00Z', merchant: 'Sabzi wala', source: 'manual', sourceRef: null, note: null, category: cat('groceries'), account: null },
  ],
};

export const SAMPLE = {
  categories, spend,
  trip,
  products, lastPrice, usual: ['milk', 'atta', 'toor-dal', 'sunflower-oil', 'onion', 'eggs'],
  home: { firstName: 'Aarti', initials: 'AK', month: '2026-10', prevMonth: '2026-09', totalPaise: 842000, prevTotalPaise: 910500, activeList: lists[0]!, trips },
  lists, listDetail, trips,
};
