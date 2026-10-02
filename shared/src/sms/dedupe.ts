// used when an SMS has no UPI ref, so a re-sent batch still dedupes
export const smsFallbackRef = (p: { bank: string | null; last4: string | null; amountPaise: number; occurredAt: string }) =>
  `${p.bank ?? '?'}:${p.last4 ?? '?'}:${p.amountPaise}:${p.occurredAt}`;

export function findCartMatch(
  sms: { amountPaise: number; occurredAt: Date },
  carts: { id: string; amountPaise: number; occurredAt: Date }[],
  windowMin = 30,
): string | null {
  const dist = (d: Date) => Math.abs(d.getTime() - sms.occurredAt.getTime());
  const hits = carts
    .filter(c => c.amountPaise === sms.amountPaise && dist(c.occurredAt) <= windowMin * 60_000)
    .sort((a, b) => dist(a.occurredAt) - dist(b.occurredAt));
  return hits[0]?.id ?? null;
}
