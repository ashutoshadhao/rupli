import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import { CreateRecurring } from '@rupli/shared';
import { recurringExpenses } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { body, idParam, notFound } from '../lib/http';
import { assertCategoryVisible } from '../lib/categories';
import { recurringOwned } from '../lib/recurring';

const thisIstMonth = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 7);

export const recurringRoutes = new Hono<AppEnv>()
  .get('/', async c => c.json(await c.get('db').select().from(recurringExpenses)
    .where(eq(recurringExpenses.userId, c.get('userId'))).orderBy(asc(recurringExpenses.dayOfMonth))))
  .post('/', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const b = await body(c, CreateRecurring);
    await assertCategoryVisible(db, userId, b.categoryId);
    const [row] = await db.insert(recurringExpenses).values({ ...b, userId, startMonth: b.startMonth ?? thisIstMonth() }).returning();
    return c.json(row, 201);
  })
  // stopping a bill keeps the months already added
  .delete('/:id', async c => {
    const [row] = await c.get('db').delete(recurringExpenses).where(recurringOwned(idParam(c), c.get('userId'))).returning();
    if (!row) throw notFound('recurring expense');
    return c.body(null, 204);
  });
