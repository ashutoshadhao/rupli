// ['YYYY-MM', …] of n months ending at `month`, oldest first
export function monthsEnding(month: string, n: number): string[] {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1)).toISOString().slice(0, 7));
}

export const nextMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
};

// start of a month in Asia/Kolkata
export const istMonthStart = (month: string) => new Date(`${month}-01T00:00:00+05:30`);
