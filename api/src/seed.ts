import { sql } from 'drizzle-orm';
import { CATALOG, DEFAULT_CATEGORIES } from '@rupli/shared';
import type { Db } from './db/client';
import { categories, products } from './db/schema';

// idempotent: global rows are keyed by slug
export async function seed(db: Db) {
  await db.insert(categories).values(DEFAULT_CATEGORIES.map(c => ({ ...c })))
    .onConflictDoUpdate({ target: categories.slug, set: { name: sql`excluded.name`, emoji: sql`excluded.emoji` } });
  await db.insert(products).values(CATALOG).onConflictDoUpdate({
    target: products.slug,
    set: Object.fromEntries(['name', 'aliases', 'category', 'emoji', 'base_unit', 'pack_sizes', 'brands']
      .map(col => [col.replace(/_(\w)/g, (_, ch: string) => ch.toUpperCase()), sql.raw(`excluded.${col}`)])),
  });
}
