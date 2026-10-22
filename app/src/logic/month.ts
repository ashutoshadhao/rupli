// all month maths in Asia/Kolkata, matching the API
export const monthKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(d).slice(0, 7);

export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1 + by, 1)).toISOString().slice(0, 7);
}

const fmt = (month: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(new Date(`${month}-01T12:00:00Z`));
export const monthLabel = (month: string) => fmt(month, { month: 'short', year: 'numeric' });   // "Oct 2026"
export const monthName = (month: string) => fmt(month, { month: 'long' });                      // "October"
export const monthShort = (month: string) => fmt(month, { month: 'short' });                    // "Oct"

// "28 Sep" in IST
export const dayMonth = (iso: string) => {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' }).format(d);
  return `${day} ${monthShort(monthKey(d))}`;
};

const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
// "Yesterday, 7:42 pm" in IST
export function when(iso: string, now = new Date()) {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
    .format(d).replace(/\s?([AP]M)$/, (_, m: string) => ` ${m.toLowerCase()}`);
  const day = dayKey(d) === dayKey(now) ? 'Today'
    : dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000)) ? 'Yesterday' : dayMonth(iso);
  return `${day}, ${time}`;
}
