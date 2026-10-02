import { config } from 'dotenv';
config({ path: '.env.test', quiet: true });
import { sql, eq } from 'drizzle-orm';
import { createDb } from '../src/db/client';
import { createApp } from '../src/app';
import { products } from '../src/db/schema';

export const db = createDb(process.env.TEST_DATABASE_URL!);
export const app = createApp({ db, verify: async t => (t.startsWith('user_') ? t : null) });

export const req = (user: string | null, method: string, path: string, body?: unknown) =>
  app.request(path, {
    method,
    headers: { 'content-type': 'application/json', ...(user ? { authorization: `Bearer ${user}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const json = async (user: string | null, method: string, path: string, body?: unknown) => {
  const r = await req(user, method, path, body);
  return { status: r.status, body: r.status === 204 ? null : await r.json() };
};

export const productId = async (slug: string) => (await db.select().from(products).where(eq(products.slug, slug)))[0]!.id;

export async function resetDb() {
  await db.execute(sql.raw(`delete from transactions; delete from category_rules; delete from accounts; delete from trip_items;
    delete from trips; delete from list_items; delete from lists; delete from products where user_id is not null;
    delete from categories where user_id is not null; delete from users;`));
}
