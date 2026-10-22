export type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'C' | '⌫';

// whole rupees typed on the in-store keypad
export function pressKey(value: string, key: Key, maxDigits = 5): string {
  if (key === 'C') return '';
  if (key === '⌫') return value.slice(0, -1);
  if (value.length >= maxDigits) return value;
  return (value + key).replace(/^0+/, '');
}

export const rupeesToPaise = (v: string): number | null => (v && Number(v) > 0 ? Number(v) * 100 : null);

// null = keypad untouched: keep the exact last price so ₹45.50 is not silently saved as ₹46
export const priceFromKeypad = (val: string | null, lastPaise: number | null) => (val === null ? lastPaise : rupeesToPaise(val));
