export interface Pick { productId: string; packSize: string; brand: string | null; qty: number }
export type Selection = Record<string, Pick>;
export type PickAction = { type: 'set'; item: Pick } | { type: 'remove'; productId: string } | { type: 'clear' };

export function pickReducer(s: Selection, a: PickAction): Selection {
  if (a.type === 'clear') return {};
  if (a.type === 'remove') { const { [a.productId]: _, ...rest } = s; return rest; }
  return { ...s, [a.item.productId]: a.item };
}

export const selectionEstimate = (s: Selection, lastPrice: (productId: string, pack: string) => number | null) =>
  Object.values(s).reduce((sum, p) => sum + p.qty * (lastPrice(p.productId, p.packSize) ?? 0), 0);
