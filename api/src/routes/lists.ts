import { Hono, type Context } from 'hono';
import { and, asc, desc, eq, inArray, isNull, max } from 'drizzle-orm';
import { AddListItem, CopyList, CreateList, UpdateList, UpdateListItem, estimateTotal } from '@rupli/shared';
import { listItems, lists, products } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { body, idParam, notFound } from '../lib/http';
import { lastPrices, priceKey } from '../lib/prices';
import { assertProductVisible } from '../lib/products';

type C = Context<AppEnv>;
type ListRow = typeof lists.$inferSelect;

const monthToDate = (m: string | null | undefined) => (m ? `${m}-01` : m);
const serialize = (l: ListRow) => ({
  id: l.id, name: l.name, month: l.month?.slice(0, 7) ?? null, status: l.status,
  copiedFrom: l.copiedFrom, archivedAt: l.archivedAt, createdAt: l.createdAt,
});

export async function ownedList(c: C, id = idParam(c)) {
  const [l] = await c.get('db').select().from(lists).where(and(eq(lists.id, id), eq(lists.userId, c.get('userId'))));
  if (!l) throw notFound('list');
  return l;
}

async function ownedItem(c: C, listId: string) {
  const [i] = await c.get('db').select().from(listItems).where(and(eq(listItems.id, idParam(c, 'itemId')), eq(listItems.listId, listId)));
  if (!i) throw notFound('item');
  return i;
}

export const listRoutes = new Hono<AppEnv>()
  .get('/', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const rows = await db.select().from(lists).where(and(eq(lists.userId, userId), isNull(lists.archivedAt))).orderBy(desc(lists.createdAt));
    const items = rows.length ? await db.select().from(listItems).where(inArray(listItems.listId, rows.map(l => l.id))) : [];
    const prices = await lastPrices(db, userId);
    return c.json(rows.map(l => {
      const its = items.filter(i => i.listId === l.id);
      return {
        ...serialize(l), itemCount: its.length, checkedCount: its.filter(i => i.checked).length,
        estimatePaise: estimateTotal(its.map(i => ({ qty: i.qty, lastPricePaise: prices.get(priceKey(i.productId, i.packSize))?.pricePaise ?? null }))),
      };
    }));
  })

  .post('/', async c => {
    const b = await body(c, CreateList);
    const [l] = await c.get('db').insert(lists).values({ userId: c.get('userId'), name: b.name, month: monthToDate(b.month) }).returning();
    return c.json(serialize(l!), 201);
  })

  .get('/:id', async c => {
    const db = c.get('db');
    const l = await ownedList(c);
    const rows = await db.select({ item: listItems, product: products }).from(listItems)
      .innerJoin(products, eq(products.id, listItems.productId))
      .where(eq(listItems.listId, l.id)).orderBy(asc(listItems.position), asc(listItems.id));
    const prices = await lastPrices(db, c.get('userId'));
    return c.json({
      ...serialize(l),
      items: rows.map(({ item, product }) => {
        const last = prices.get(priceKey(item.productId, item.packSize));
        return {
          ...item, lastPricePaise: last?.pricePaise ?? null, lastBrand: last?.brand ?? null,
          product: { id: product.id, name: product.name, aliases: product.aliases, emoji: product.emoji, category: product.category },
        };
      }),
    });
  })

  .patch('/:id', async c => {
    const l = await ownedList(c);
    const b = await body(c, UpdateList);
    const [u] = await c.get('db').update(lists).set({
      ...(b.name !== undefined && { name: b.name }),
      ...(b.month !== undefined && { month: monthToDate(b.month) }),
      ...(b.status !== undefined && { status: b.status }),
      ...(b.archived !== undefined && { archivedAt: b.archived ? new Date() : null }),
    }).where(eq(lists.id, l.id)).returning();
    return c.json(serialize(u!));
  })

  .post('/:id/copy', async c => {
    const db = c.get('db');
    const src = await ownedList(c);
    const b = await body(c, CopyList);
    const created = await db.transaction(async tx => {
      const [l] = await tx.insert(lists).values({ userId: c.get('userId'), name: b.name, month: monthToDate(b.month), copiedFrom: src.id }).returning();
      const items = await tx.select().from(listItems).where(eq(listItems.listId, src.id));
      if (items.length) {
        await tx.insert(listItems).values(items.map(({ id: _, listId: __, ...i }) => ({ ...i, listId: l!.id, checked: false })));
      }
      return l!;
    });
    return c.json(serialize(created), 201);
  })

  .post('/:id/items', async c => {
    const db = c.get('db');
    const l = await ownedList(c);
    const b = await body(c, AddListItem);
    await assertProductVisible(db, c.get('userId'), b.productId);
    const [{ pos } = { pos: null }] = await db.select({ pos: max(listItems.position) }).from(listItems).where(eq(listItems.listId, l.id));
    const [row] = await db.insert(listItems).values({ ...b, listId: l.id, position: (pos ?? -1) + 1 }).returning();
    return c.json(row, 201);
  })

  .patch('/:id/items/:itemId', async c => {
    const l = await ownedList(c);
    const i = await ownedItem(c, l.id);
    const b = await body(c, UpdateListItem);
    const [row] = await c.get('db').update(listItems).set(b).where(eq(listItems.id, i.id)).returning();
    return c.json(row);
  })

  .delete('/:id/items/:itemId', async c => {
    const l = await ownedList(c);
    const i = await ownedItem(c, l.id);
    await c.get('db').delete(listItems).where(eq(listItems.id, i.id));
    return c.body(null, 204);
  });
