import { it, expect } from 'vitest';
import { barHeights, groupDonut, pctChange } from '../src/logic/spend';

it('groups product categories into the six donut groups', () => {
  const g = groupDonut([
    { category: 'dairy', totalPaise: 2000 }, { category: 'sabzi', totalPaise: 500 }, { category: 'fruits', totalPaise: 500 },
    { category: 'dal', totalPaise: 700 }, { category: 'other', totalPaise: 300 },
  ]);
  expect(g.map(x => [x.key, x.totalPaise])).toEqual([['dairy', 2000], ['sabzi-fruits', 1000], ['other', 1000]]);
  expect(g.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(100);
});
it('pctChange: null when nothing last month, never Infinity', () => {
  expect(pctChange(842000, 910500)).toBe(-7.5);
  expect(pctChange(100, 0)).toBeNull();
});
it('bar heights relative to the tallest month, min 4%', () => {
  expect(barHeights([0, 50, 100])).toEqual([4, 50, 100]);
  expect(barHeights([0, 0])).toEqual([4, 4]);
});

it('when(): Today / Yesterday / date, IST, lowercase am-pm', async () => {
  const { when } = await import('../src/logic/month');
  const now = new Date('2026-10-02T12:00:00+05:30');
  expect(when('2026-10-01T19:42:00+05:30', now)).toBe('Yesterday, 7:42 pm');
  expect(when('2026-10-02T09:05:00+05:30', now)).toBe('Today, 9:05 am');
  expect(when('2026-09-28T19:42:00+05:30', now)).toBe('28 Sep, 7:42 pm');
});
