import { sql } from 'drizzle-orm';
import type { Db } from '../db/client';

export const priceKey = (productId: string, packSize: string) => `${productId}|${packSize}`;

// latest paid price per product + pack, from finished trips
export async function lastPrices(db: Db, userId: string) {
  const rows = await db.execute<{ product_id: string; pack_size: string; price_paise: string; brand: string | null; finished_at: string }>(sql`
    select distinct on (ti.product_id, ti.pack_size) ti.product_id, ti.pack_size, ti.price_paise, ti.brand, t.finished_at
    from trip_items ti join trips t on t.id = ti.trip_id
    where t.user_id = ${userId} and t.finished_at is not null
    order by ti.product_id, ti.pack_size, t.finished_at desc`);
  return new Map(rows.map(r => [priceKey(r.product_id, r.pack_size), { pricePaise: Number(r.price_paise), brand: r.brand, at: new Date(r.finished_at) }]));
}
