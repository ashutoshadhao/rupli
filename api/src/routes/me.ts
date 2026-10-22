import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { SetBudget } from '@rupli/shared';
import { users } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { body } from '../lib/http';

export const meRoutes = new Hono<AppEnv>()
  .get('/', async c => {
    const [u] = await c.get('db').select({ budgetPaise: users.budgetPaise }).from(users).where(eq(users.id, c.get('userId')));
    return c.json({ budgetPaise: u?.budgetPaise ?? null });
  })
  .put('/', async c => {
    const { budgetPaise } = await body(c, SetBudget);
    await c.get('db').update(users).set({ budgetPaise }).where(eq(users.id, c.get('userId')));
    return c.json({ budgetPaise });
  });
