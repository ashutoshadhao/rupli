import { PRODUCT_CATEGORIES } from '@rupli/shared';
import { monthKey, monthLabel, shiftMonth } from './month';

export function previousMonthList<T extends { month: string | null; createdAt: string }>(lists: T[], today = new Date()): T | null {
  const prev = shiftMonth(monthKey(today), -1);
  return lists.filter(l => l.month === prev).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export const defaultListName = (d = new Date()) => `${monthLabel(monthKey(d))} · Monthly Kirana`;

export function listTitle(l: { name: string; month: string | null }) {
  if (!l.month) return l.name;
  const tag = monthLabel(l.month);
  return l.name.startsWith(tag) ? l.name : `${tag} · ${l.name}`;
}

export function groupByCategory<T extends { checked: boolean; product: { category: string } }>(items: T[]) {
  return PRODUCT_CATEGORIES
    .map(cat => {
      const its = items.filter(i => i.product.category === cat.slug);
      return { slug: cat.slug, label: cat.label, items: its, picked: its.filter(i => i.checked).length };
    })
    .filter(g => g.items.length > 0);
}

// the list Home and Lists highlight: one being shopped, else the newest unfinished one
export function activeList<T extends { status: string; createdAt: string }>(lists: T[]): T | null {
  return lists.find(l => l.status === 'shopping')
    ?? lists.filter(l => l.status !== 'done').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export const copyName = (name: string, toMonth: string) => `${monthLabel(toMonth)} · ${name.replace(/^[A-Z][a-z]{2} \d{4} · /, '')}`;

// a list with an open trip (status "shopping") holds items in a cart, so it can't be deleted
export const deletable = (l: { status: string }) => l.status !== 'shopping';

// nothing added = nothing to show (an open trip's list stays visible even while empty)
export const visibleLists = <T extends { status: string; itemCount: number }>(lists: T[]) =>
  lists.filter(l => l.itemCount > 0 || l.status === 'shopping');

// plain text for WhatsApp: grouped like the list screen, picked items ticked
export function shareText(l: { name: string; month: string | null; items: { checked: boolean; qty: number; packSize: string; brand: string | null; product: { name: string; category: string } }[] }) {
  const groups = groupByCategory(l.items).map(g =>
    `*${g.label}*\n` + g.items.map(i => `${i.checked ? '✅' : '▫️'} ${i.product.name} · ${i.packSize}${i.qty > 1 ? ` × ${i.qty}` : ''}${i.brand ? ` (${i.brand})` : ''}`).join('\n'));
  return `🛒 *${listTitle(l)}*\n\n${groups.join('\n\n')}\n\n— sent from Rupli`;
}
