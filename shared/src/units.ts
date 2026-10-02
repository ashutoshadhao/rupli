export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'pcs';
export type BaseUnit = 'kg' | 'L' | 'pcs';
const TO_BASE: Record<Unit, [BaseUnit, number]> = { g: ['kg', 0.001], kg: ['kg', 1], ml: ['L', 0.001], L: ['L', 1], pcs: ['pcs', 1] };
const ALIAS: Record<string, Unit> = { g: 'g', kg: 'kg', ml: 'ml', l: 'L', pcs: 'pcs', pc: 'pcs' };

export function parsePack(label: string): { qty: number; unit: Unit } | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*([a-z]+)\s*$/i.exec(label);
  const unit = m && ALIAS[m[2]!.toLowerCase()];
  return m && unit ? { qty: Number(m[1]), unit } : null;
}

export function toBase(qty: number, unit: Unit): { qty: number; unit: BaseUnit } {
  const [base, f] = TO_BASE[unit];
  return { qty: qty * f, unit: base };
}

export function packsBaseUnit(labels: string[]): BaseUnit | null {
  const units = labels.map(l => { const p = parsePack(l); return p && TO_BASE[p.unit][0]; });
  return units.length && units.every(u => u && u === units[0]) ? units[0]! : null;
}

export interface CompareOption { name: string; qty: number; unit: Unit; pricePaise: number }
export interface CompareResult {
  perUnitPaise: (number | null)[]; baseUnit: BaseUnit | null; bestIndex: number | null;
  savingPerUnitPaise: number | null; savingPct: number | null; error: null | 'need_two' | 'mixed_units';
}

export function compare(options: CompareOption[]): CompareResult {
  const ok = (o: CompareOption) => o.qty > 0 && o.pricePaise > 0 && Number.isFinite(o.qty) && Number.isFinite(o.pricePaise);
  const perUnitPaise = options.map(o => (ok(o) ? Math.round(o.pricePaise / toBase(o.qty, o.unit).qty) : null));
  const valid = options.map((o, i) => [o, i] as const).filter(([o]) => ok(o));
  const none = { perUnitPaise, baseUnit: null, bestIndex: null, savingPerUnitPaise: null, savingPct: null };
  const bases = new Set(valid.map(([o]) => TO_BASE[o.unit][0]));
  if (bases.size > 1) return { ...none, error: 'mixed_units' };
  if (valid.length < 2) return { ...none, error: 'need_two' };
  const ranked = valid.map(([, i]) => i).sort((a, b) => perUnitPaise[a]! - perUnitPaise[b]!);
  const best = perUnitPaise[ranked[0]!]!, second = perUnitPaise[ranked[1]!]!;
  return {
    perUnitPaise, baseUnit: [...bases][0]!, bestIndex: ranked[0]!, error: null,
    savingPerUnitPaise: second - best, savingPct: Math.round(((second - best) / second) * 1000) / 10,
  };
}
