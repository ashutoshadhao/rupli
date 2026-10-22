import { Hono, type Context } from 'hono';
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, max, or, sql, sum } from 'drizzle-orm';
import { AddListItem, CopyList, CreateList, JoinList, UpdateList, UpdateListItem, estimateTotal } from '@rupli/shared';
import { listItems, listMembers, lists, products, trips } from '../db/schema';
import type { AppEnv } from '../lib/env';
import { ApiError, body, idParam, notFound } from '../lib/http';
import { lastPrices, priceKey } from '../lib/prices';
import { assertProductVisible } from '../lib/products';

type C = Context<AppEnv>;
type ListRow = typeof lists.$inferSelect;

const monthToDate = (m: string | null | undefined) => (m ? `${m}-01` : m);
const serialize = (l: ListRow) => ({
  id: l.id, name: l.name, month: l.month?.slice(0, 7) ?? null, status: l.status,
  copiedFrom: l.copiedFrom, archivedAt: l.archivedAt, createdAt: l.createdAt,
});

// lists the user owns or joined with an invite code
const accessible = (userId: string) =>
  or(eq(lists.userId, userId), sql`${lists.id} in (select list_id from list_members where user_id = ${userId})`);

// any list the user can see and edit (owner or family member); strangers get 404
export async function ownedList(c: C, id = idParam(c)) {
  const [l] = await c.get('db').select().from(lists).where(and(eq(lists.id, id), accessible(c.get('userId'))));
  if (!l) throw notFound('list');
  return l;
}

// delete / archive / share stay with the owner; to a member the list "doesn't exist" for those actions
async function ownerList(c: C) {
  const l = await ownedList(c);
  if (l.userId !== c.get('userId')) throw notFound('list');
  return l;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I to avoid misreading
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

async function ownedItem(c: C, listId: string) {
  const [i] = await c.get('db').select().from(listItems).where(and(eq(listItems.id, idParam(c, 'itemId')), eq(listItems.listId, listId)));
  if (!i) throw notFound('item');
  return i;
}

export const listRoutes = new Hono<AppEnv>()
  .get('/', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const rows = await db.select().from(lists).where(and(accessible(userId), isNull(lists.archivedAt))).orderBy(desc(lists.createdAt));
    const items = rows.length ? await db.select().from(listItems).where(inArray(listItems.listId, rows.map(l => l.id))) : [];
    const prices = await lastPrices(db, userId);
    const paid = rows.length ? await db.select({ listId: trips.listId, total: sum(trips.billTotalPaise).mapWith(Number) }).from(trips)
      .where(and(isNotNull(trips.finishedAt), inArray(trips.listId, rows.map(l => l.id)))).groupBy(trips.listId) : [];
    const members = rows.length ? await db.select({ listId: listMembers.listId, n: count() }).from(listMembers)
      .where(inArray(listMembers.listId, rows.map(l => l.id))).groupBy(listMembers.listId) : [];
    return c.json(rows.map(l => {
      const its = items.filter(i => i.listId === l.id);
      const memberCount = members.find(m => m.listId === l.id)?.n ?? 0;
      return {
        ...serialize(l), itemCount: its.length, checkedCount: its.filter(i => i.checked).length,
        owner: l.userId === userId, shared: memberCount > 0 || l.userId !== userId, memberCount,
        paidPaise: paid.find(p => p.listId === l.id)?.total ?? null,
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
    const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(listMembers).where(eq(listMembers.listId, l.id));
    const isOwner = l.userId === c.get('userId');
    return c.json({
      ...serialize(l), owner: isOwner, shared: n > 0 || !isOwner, memberCount: n, inviteCode: isOwner ? l.inviteCode : null,
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
    const b = await body(c, UpdateList);
    const l = b.archived !== undefined ? await ownerList(c) : await ownedList(c);
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

  // finished trips keep their history (trips.list_id is set null); a list being shopped can't go
  .delete('/:id', async c => {
    const db = c.get('db');
    const l = await ownerList(c);
    const [open] = await db.select({ id: trips.id }).from(trips).where(and(eq(trips.listId, l.id), isNull(trips.finishedAt)));
    if (open) throw new ApiError(409, 'list_in_use', 'Finish or delete the open trip for this list first');
    await db.delete(lists).where(eq(lists.id, l.id));
    return c.body(null, 204);
  })

  // owner gets a stable 6-character code to send to family
  .post('/:id/share', async c => {
    const db = c.get('db');
    const l = await ownerList(c);
    if (l.inviteCode) return c.json({ code: l.inviteCode });
    for (let i = 0; i < 5; i++) {
      const [u] = await db.update(lists).set({ inviteCode: newCode() }).where(eq(lists.id, l.id)).returning().catch(() => []);
      if (u) return c.json({ code: u.inviteCode });
    }
    throw new ApiError(409, 'code_failed', 'Could not create a share code, try again');
  })

  .post('/join', async c => {
    const db = c.get('db'), userId = c.get('userId');
    const { code } = await body(c, JoinList);
    const [l] = await db.select().from(lists).where(and(eq(lists.inviteCode, code.toUpperCase()), isNull(lists.archivedAt)));
    if (!l) throw notFound('list');
    if (l.userId !== userId) await db.insert(listMembers).values({ listId: l.id, userId }).onConflictDoNothing();
    return c.json(serialize(l));
  })

  .post('/:id/leave', async c => {
    const l = await ownedList(c);
    await c.get('db').delete(listMembers).where(and(eq(listMembers.listId, l.id), eq(listMembers.userId, c.get('userId'))));
    return c.body(null, 204);
  })

  .post('/:id/items', async c => {
    const db = c.get('db');
    const l = await ownedList(c);
    const b = await body(c, AddListItem);
    await assertProductVisible(db, c.get('userId'), b.productId);
    const [{ pos } = { pos: null }] = await db.select({ pos: max(listItems.position) }).from(listItems).where(eq(listItems.listId, l.id));
    // app-chosen id makes offline adds replayable; a retry returns the same row
    const [row] = await db.insert(listItems).values({ ...b, listId: l.id, position: (pos ?? -1) + 1 }).onConflictDoNothing().returning();
    if (row) return c.json(row, 201);
    const [existing] = await db.select().from(listItems).where(and(eq(listItems.id, b.id!), eq(listItems.listId, l.id)));
    if (!existing) throw new ApiError(409, 'id_taken', 'That item id is already in use');
    return c.json(existing, 201);
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
