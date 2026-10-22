import { parsePack } from '@rupli/shared';

export function splitToPickInCart<L extends { id: string }, T extends { listItemId: string | null }>(listItems: L[], tripItems: T[]) {
  const taken = new Set(tripItems.map(t => t.listItemId).filter(Boolean));
  return { toPick: listItems.filter(i => !taken.has(i.id)), inCart: tripItems };
}

const WEIGHED = new Set(['sabzi', 'fruits']);
type RecheckItem = { productId: string; packSize: string; pricePaise: number; product?: { category: string } };

// what to look at first when the bill and the cart disagree
export function recheckItems<T extends RecheckItem>(items: T[], lastPaise: (productId: string, pack: string) => number | null) {
  const out: { item: T; reason: 'changed' | 'weighed'; lastPaise: number | null }[] = [];
  for (const item of items) {
    const last = lastPaise(item.productId, item.packSize);
    if (last != null && last !== item.pricePaise) out.push({ item, reason: 'changed', lastPaise: last });
  }
  for (const item of items) {
    const unit = parsePack(item.packSize)?.unit;
    if (WEIGHED.has(item.product?.category ?? '') && (unit === 'kg' || unit === 'g') && !out.some(o => o.item === item)) {
      out.push({ item, reason: 'weighed', lastPaise: lastPaise(item.productId, item.packSize) });
    }
  }
  return out;
}
