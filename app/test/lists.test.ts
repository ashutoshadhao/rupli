import { it, expect } from 'vitest';
import { defaultListName, groupByCategory, previousMonthList, listTitle } from '../src/logic/lists';

const L = (id: string, month: string | null, createdAt = '2026-09-01T00:00:00Z') => ({ id, month, createdAt, name: id });

it('previousMonthList picks the newest list tagged with last month', () => {
  const lists = [L('a', '2026-09', '2026-09-01T00:00:00Z'), L('b', '2026-09', '2026-09-20T00:00:00Z'), L('c', '2026-10'), L('d', null)];
  expect(previousMonthList(lists, new Date('2026-10-02T10:00:00+05:30'))?.id).toBe('b');
  expect(previousMonthList(lists, new Date('2026-12-02T10:00:00+05:30'))).toBeNull();
  expect(previousMonthList([L('j', '2025-12')], new Date('2026-01-05T10:00:00+05:30'))?.id).toBe('j');
});
it('defaultListName', () => expect(defaultListName(new Date('2026-10-02T10:00:00+05:30'))).toBe('Oct 2026 · Monthly Kirana'));
it('listTitle shows month tag + name without duplicating', () => {
  expect(listTitle({ name: 'Oct 2026 · Monthly Kirana', month: '2026-10' })).toBe('Oct 2026 · Monthly Kirana');
  expect(listTitle({ name: 'Diwali & Pooja', month: '2026-11' })).toBe('Nov 2026 · Diwali & Pooja');
  expect(listTitle({ name: 'Party', month: null })).toBe('Party');
});
it('groupByCategory keeps catalog order and counts picked', () => {
  const items = [
    { id: '1', checked: true, product: { category: 'dal' } }, { id: '2', checked: false, product: { category: 'dairy' } },
    { id: '3', checked: false, product: { category: 'dal' } },
  ];
  const g = groupByCategory(items);
  expect(g.map(x => [x.label, x.picked, x.items.length])).toEqual([['Dairy', 0, 1], ['Dal', 1, 2]]);
});

it('activeList: shopping first, else newest non-done', async () => {
  const { activeList } = await import('../src/logic/lists');
  const mk = (id: string, status: 'draft' | 'shopping' | 'done', createdAt: string) => ({ id, status, createdAt });
  expect(activeList([mk('a', 'draft', '2026-10-01'), mk('b', 'shopping', '2026-09-01')])?.id).toBe('b');
  expect(activeList([mk('a', 'draft', '2026-09-01'), mk('c', 'draft', '2026-10-01'), mk('d', 'done', '2026-11-01')])?.id).toBe('c');
  expect(activeList([mk('d', 'done', '2026-11-01')])).toBeNull();
});

it('copyName swaps the month tag', async () => {
  const { copyName } = await import('../src/logic/lists');
  expect(copyName('Sep 2026 · Monthly Kirana', '2026-10')).toBe('Oct 2026 · Monthly Kirana');
  expect(copyName('Party', '2026-10')).toBe('Oct 2026 · Party');
});

it('month labels use 3-letter months', async () => {
  const { monthShort, dayMonth, monthLabel } = await import('../src/logic/month');
  expect(monthShort('2026-09')).toBe('Sep');
  expect(monthLabel('2026-09')).toBe('Sep 2026');
  expect(dayMonth('2026-09-28T20:00:00Z')).toBe('29 Sep'); // IST is +5:30
});

it('deletable: never a list being shopped; visible: empty lists are hidden', async () => {
  const { deletable, visibleLists } = await import('../src/logic/lists');
  const L = (id: string, status: 'draft' | 'shopping' | 'done', itemCount: number) => ({ id, status, itemCount });
  expect(deletable(L('a', 'shopping', 3))).toBe(false);
  expect(deletable(L('b', 'draft', 3))).toBe(true);
  expect(deletable(L('c', 'done', 3))).toBe(true);
  expect(visibleLists([L('a', 'draft', 0), L('b', 'draft', 2), L('c', 'shopping', 0)]).map(l => l.id)).toEqual(['b', 'c']);
});
