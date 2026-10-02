import { Hono } from 'hono';
import { asc, eq, isNull, or } from 'drizzle-orm';
import { categories } from '../db/schema';
import type { AppEnv } from '../lib/env';

export const categoryRoutes = new Hono<AppEnv>().get('/', async c => {
  const rows = await c.get('db').select().from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, c.get('userId')))).orderBy(asc(categories.name));
  return c.json(rows);
});
