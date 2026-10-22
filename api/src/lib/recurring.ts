import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { recurringExpenses, transactions } from '../db/schema';
import { monthsEnding } from './months';

const IST_MS = 5.5 * 3600_000;
const istMonth = (d: Date) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 7);

// due moment for a bill in a month: its day (clamped to the month's last day) at 09:00 IST
export function dueAt(month: string, day: number) {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return new Date(`${month}-${String(Math.min(day, last)).padStart(2, '0')}T09:00:00+05:30`);
}

// turn every due monthly bill into a transaction; source_ref makes it idempotent
export async function materializeRecurring(db: Db, userId: string, now = new Date()) {
  const recs = await db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, userId));
  const current = istMonth(now);
  for (const r of recs) {
    if (r.startMonth > current) continue;
    const span = (Number(current.slice(0, 4)) - Number(r.startMonth.slice(0, 4))) * 12 + Number(current.slice(5)) - Number(r.startMonth.slice(5)) + 1;
    let done = r.doneThrough;
    for (const month of monthsEnding(current, Math.min(span, 24))) { // ponytail: back-fills at most 2 years
      if (done && month <= done) continue;
      const at = dueAt(month, r.dayOfMonth);
      if (at > now) break;
      await db.insert(transactions).values({
        userId, amountPaise: r.amountPaise, direction: 'debit', occurredAt: at, merchant: r.name, categoryId: r.categoryId,
        source: 'manual', sourceRef: `rec:${r.id}:${month}`, note: 'Monthly',
      }).onConflictDoNothing();
      done = month;
    }
    if (done !== r.doneThrough) await db.update(recurringExpenses).set({ doneThrough: done }).where(eq(recurringExpenses.id, r.id));
  }
}

export const recurringOwned = (id: string, userId: string) => and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId));
