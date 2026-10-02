import { and, eq, isNull, or } from 'drizzle-orm';
import type { Db } from '../db/client';
import { products } from '../db/schema';
import { notFound } from './http';

export const visibleProduct = (userId: string) => or(isNull(products.userId), eq(products.userId, userId));

export async function assertProductVisible(db: Db, userId: string, productId: string) {
  const [p] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), visibleProduct(userId)));
  if (!p) throw notFound('product');
}
