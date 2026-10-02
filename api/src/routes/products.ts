import { Hono } from 'hono';
import { asc, sql } from 'drizzle-orm';
import { CreateProduct, packsBaseUnit } from '@rupli/shared';
import { products } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { body } from '../lib/http';
import { visibleProduct } from '../lib/products';

export const productRoutes = new Hono<AppEnv>()
  .get('/', async c => {
    const rows = await c.get('db').select().from(products).where(visibleProduct(c.get('userId'))).orderBy(asc(products.category), asc(products.name));
    return c.json(rows);
  })
  .get('/usual', async c => {
    const rows = await c.get('db').execute<{ product_id: string }>(sql`
      select product_id from (
        select li.product_id, l.created_at as at from list_items li join lists l on l.id = li.list_id where l.user_id = ${c.get('userId')}
        union all
        select ti.product_id, t.started_at from trip_items ti join trips t on t.id = ti.trip_id where t.user_id = ${c.get('userId')}
      ) x group by product_id order by count(*) desc, max(at) desc limit 12`);
    return c.json(rows.map(r => r.product_id));
  })
  .post('/', async c => {
    const b = await body(c, CreateProduct);
    const [row] = await c.get('db').insert(products)
      .values({ ...b, userId: c.get('userId'), baseUnit: packsBaseUnit(b.packSizes)! }).returning();
    return c.json(row, 201);
  });

