import { CATALOG } from '@rupli/shared';

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// the catalog is written most-bought first (milk before butter, wheat atta before bajra)
const RANK = new Map(CATALOG.map((p, i) => [p.slug, i]));
export const sortByCatalog = <T extends { slug: string | null; name: string }>(xs: T[]) =>
  [...xs].sort((a, b) => (RANK.get(a.slug ?? '') ?? 1e9) - (RANK.get(b.slug ?? '') ?? 1e9) || a.name.localeCompare(b.name));

export const txnTitle = (t: { merchant: string | null; note: string | null; category: { name: string } }) =>
  t.merchant ?? t.note ?? t.category.name;
