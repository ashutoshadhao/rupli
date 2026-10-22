import { compare, formatINR, parseRupeesToPaise, type BaseUnit, type Unit } from '@rupli/shared';

export interface DraftOption { name: string; qty: string; unit: Unit; price: string }

export const perUnitLabel = (paise: number, base: BaseUnit) => `${formatINR(paise)}/${base === 'pcs' ? 'pc' : base}`;

export function compareDraft(opts: DraftOption[]) {
  const r = compare(opts.map(o => ({
    name: o.name, unit: o.unit,
    qty: Number(o.qty.replace(',', '.')) || 0,
    pricePaise: parseRupeesToPaise(o.price) ?? 0,
  })));
  const max = Math.max(0, ...r.perUnitPaise.map(p => p ?? 0));
  const rows = opts.map((o, i) => {
    const p = r.perUnitPaise[i];
    return {
      name: o.name, best: i === r.bestIndex,
      label: p != null && r.baseUnit ? perUnitLabel(p, r.baseUnit) : '—',
      widthPct: p != null && max > 0 ? Math.round((p / max) * 100) : 0,
    };
  });
  const message = r.error === 'mixed_units' ? 'Compare kg with kg or L with L' : r.error === 'need_two' ? 'Fill in at least two packs' : null;
  const saving = r.bestIndex != null && r.baseUnit && r.savingPerUnitPaise != null
    ? `saves ${perUnitLabel(r.savingPerUnitPaise, r.baseUnit)} · ${r.savingPct}%` : null;
  return { bestIndex: r.bestIndex, rows, message, saving };
}

const FAMILY: Record<Unit, string> = { g: 'mass', kg: 'mass', ml: 'volume', L: 'volume', pcs: 'count' };
// picking a unit from another family (L → g) switches every option, so the comparison never goes "mixed"
export function setUnit(opts: DraftOption[], i: number, unit: Unit): DraftOption[] {
  const switchAll = opts.some((o, j) => j !== i && FAMILY[o.unit] !== FAMILY[unit]);
  return opts.map((o, j) => (j === i || switchAll ? { ...o, unit } : o));
}
