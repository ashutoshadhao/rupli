export const cartTotal = (lines: { qty: number; pricePaise: number }[]) => lines.reduce((s, l) => s + l.qty * l.pricePaise, 0);

export function billCheck(cartPaise: number, billPaise: number) {
  const d = billPaise - cartPaise;
  return d === 0 ? ({ status: 'match' } as const) : ({ status: d > 0 ? 'over' : 'under', diffPaise: Math.abs(d) } as const);
}

export function priceDelta(newPaise: number, lastPaise: number | null) {
  if (lastPaise == null) return { kind: 'none' } as const;
  const d = newPaise - lastPaise;
  return d === 0 ? ({ kind: 'same' } as const) : ({ kind: d > 0 ? 'more' : 'less', diffPaise: Math.abs(d) } as const);
}

export const estimateTotal = (items: { qty: number; lastPricePaise: number | null }[]) =>
  items.reduce((s, i) => s + i.qty * (i.lastPricePaise ?? 0), 0);
