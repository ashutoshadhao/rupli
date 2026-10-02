export function parseRupeesToPaise(s: string): number | null {
  const m = /^\s*([\d,]+)(?:\.(\d{1,2}))?\s*$/.exec(s);
  if (!m || !/\d/.test(m[1]!)) return null;
  const whole = Number(m[1]!.replace(/,/g, ''));
  if (!Number.isSafeInteger(whole)) return null;
  return whole * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

export function formatINR(paise: number): string {
  const r = Math.abs(paise) / 100;
  const s = r.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 });
  return (paise < 0 ? '-' : '') + '₹' + s;
}
