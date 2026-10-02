import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import type { Db } from '../db/client';
import { categories, categoryRules } from '../db/schema';
import { notFound } from './http';

export async function assertCategoryVisible(db: Db, userId: string, id: string) {
  const [c] = await db.select({ id: categories.id }).from(categories)
    .where(and(eq(categories.id, id), or(isNull(categories.userId), eq(categories.userId, userId))));
  if (!c) throw notFound('category');
}

export async function categoryMaps(db: Db, userId: string) {
  const defaults = await db.select({ id: categories.id, slug: categories.slug }).from(categories).where(isNotNull(categories.slug));
  const rules = await db.select({ pattern: categoryRules.pattern, key: categoryRules.categoryId }).from(categoryRules)
    .where(eq(categoryRules.userId, userId));
  return { bySlug: new Map(defaults.map(d => [d.slug!, d.id])), rules };
}
