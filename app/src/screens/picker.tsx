import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Plus, Search, X } from 'lucide-react-native';
import { PRODUCT_CATEGORIES, formatINR, searchProducts } from '@rupli/shared';
import type { Product } from '../api';
import { pickReducer, selectionEstimate, type Pick, type Selection } from '../logic/picker';
import { font, useTheme } from '../theme';
import { Chip, EmojiTile, IconButton, PrimaryButton, Stepper, Txt } from '../ui/core';
import { Sheet } from '../ui/layout';
import { sortByCatalog } from '../logic/text';

export type LastPrice = (productId: string, pack: string) => { pricePaise: number; brand: string | null; at: string } | null;

export interface PickerProps {
  title: string; products: Product[]; usualIds: string[]; lastPrice: LastPrice; initialQuery?: string;
  cta?: string; onClose: () => void; onDone: (picks: Pick[]) => void;
  onLeave?: (picks: Pick[]) => void; // left without Done (back, ✕): picks still count
  onCreate?: (p: NewProduct) => Promise<Product>; // item not in the catalog
}

export interface NewProduct { name: string; category: string; emoji: string; packSizes: string[] }

const alias = (p: Product) => p.aliases[0] ?? '';

export function PickerView({ title, products, usualIds, lastPrice, initialQuery = '', cta = 'Add to list', onClose, onDone, onLeave, onCreate }: PickerProps) {
  const { c } = useTheme();
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState<string>(PRODUCT_CATEGORIES[0].slug);
  const [sel, dispatch] = useReducer(pickReducer, {} as Selection);
  const [sheet, setSheet] = useState<Product | null>(null);
  const [creating, setCreating] = useState<string | null>(null); // prefilled name while the new-item sheet is open
  const latest = useRef({ sel, done: false });
  useEffect(() => { latest.current.sel = sel; }, [sel]);
  useEffect(() => () => {
    const { sel: s, done } = latest.current;
    if (!done && Object.keys(s).length) onLeave?.(Object.values(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const usual = usualIds.map(id => byId.get(id)).filter((p): p is Product => !!p);
  const tiles = q.trim() ? searchProducts(q, products) : sortByCatalog(products.filter(p => p.category === cat));
  const count = Object.keys(sel).length;
  // offer "new item" only when no tile already has that exact name
  const canCreate = !!onCreate && !!q.trim() && !tiles.some(p => p.name.toLowerCase() === q.trim().toLowerCase());
  const est = selectionEstimate(sel, (id, pack) => lastPrice(id, pack)?.pricePaise ?? null);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
        <IconButton label="Close" onPress={onClose}><X size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        <Txt w="700" size={19}>{title}</Txt>
      </View>
      <View style={{ marginHorizontal: 16, marginTop: 6, height: 54, borderRadius: 27, backgroundColor: c.card, borderWidth: 2, borderColor: c.green, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18 }}>
        <Search size={22} strokeWidth={2.5} color={c.ink} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search milk, doodh, dahi…" placeholderTextColor={c.mute} autoCorrect={false}
          style={{ flex: 1, fontSize: 17, fontFamily: font.regular, color: c.ink }} />
        {q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')} hitSlop={10}><X size={18} color={c.mute} /></Pressable> : null}
      </View>

      {canCreate ? (
        <Pressable accessibilityRole="button" onPress={() => setCreating(q.trim())} style={{
          marginHorizontal: 16, marginTop: 10, minHeight: 52, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.green,
          flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
        }}>
          <Plus size={20} strokeWidth={2.75} color={c.green} />
          <Txt w="700" size={16} color="green" numberOfLines={1} style={{ flex: 1 }}>Add “{q.trim()}” as a new item</Txt>
        </Pressable>
      ) : null}

      {!q.trim() && usual.length > 0 && (
        <View style={{ paddingTop: 16 }}>
          <Txt w="700" size={16} style={{ paddingHorizontal: 20, paddingBottom: 8 }}>Your usual</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 4 }}>
            {usual.map(p => {
              const s = sel[p.id];
              return (
                <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.name}${s ? `, ${s.qty} selected` : ''}`} onPress={() => setSheet(p)} style={{
                  width: 76, height: 88, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 4,
                  backgroundColor: s ? c.green : c.card, borderWidth: s ? 0 : 1.5, borderColor: c.line,
                }}>
                  <Txt size={30} style={{ lineHeight: 34 }}>{p.emoji}</Txt>
                  <Txt w="600" size={13} color={s ? 'onGreen' : 'ink'} numberOfLines={1}>{p.name}</Txt>
                  {s && <Badge n={s.qty} bg="yellow" fg="onYellow" ring />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {!q.trim() && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
            {PRODUCT_CATEGORIES.map(t => (
              <Pressable key={t.slug} onPress={() => setCat(t.slug)} style={{
                height: 44, borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center',
                backgroundColor: cat === t.slug ? c.ink : c.card, borderWidth: cat === t.slug ? 0 : 1.5, borderColor: c.line,
              }}>
                <Txt size={15} w={cat === t.slug ? '700' : '500'} color={cat === t.slug ? 'bg' : 'ink'}>{t.label}</Txt>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList data={tiles} keyExtractor={p => p.id} numColumns={3} style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: q.trim() ? 14 : 0, paddingBottom: 12, gap: 10 }} columnWrapperStyle={{ gap: 10 }}
        ListEmptyComponent={<Txt color="mute" style={{ textAlign: 'center', marginTop: 24 }}>No match. Try the Hindi or Marathi name{onCreate ? ', or add it as a new item above.' : '.'}</Txt>}
        ListFooterComponent={!q.trim() && onCreate ? (
          <Pressable accessibilityRole="button" onPress={() => setCreating('')} style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Txt w="600" size={15} color="green">Can’t find it? ＋ Add a new item</Txt>
          </Pressable>
        ) : null}
        renderItem={({ item: p }) => {
          const s = sel[p.id];
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`${p.name}${s ? `, ${s.qty} selected` : ''}`} onPress={() => setSheet(p)} style={{
              flex: 1 / 3, height: 112, borderRadius: 20, backgroundColor: c.card, padding: 10, alignItems: 'center', justifyContent: 'center',
              borderWidth: s ? 2.5 : 1.5, borderColor: s ? c.green : c.line,
            }}>
              <Txt size={34} style={{ lineHeight: 38, marginBottom: 6 }}>{p.emoji}</Txt>
              <Txt w="700" size={15} numberOfLines={1} style={{ textAlign: 'center' }}>{p.name}</Txt>
              <Txt size={12} color="mute" numberOfLines={1}>{alias(p)}</Txt>
              {s && <Badge n={s.qty} bg="green" fg="onGreen" />}
            </Pressable>
          );
        }} />

      <View style={{ marginHorizontal: 16, marginTop: 10, marginBottom: 12, borderRadius: 22, backgroundColor: c.ink, paddingVertical: 8, paddingRight: 8, paddingLeft: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Txt v="num" size={34} color="yellow" style={{ lineHeight: 36 }}>{count}</Txt>
        <View style={{ flex: 1 }}>
          <Txt w="700" size={16} color="bg">{count === 1 ? 'item' : 'items'} selected</Txt>
          <Txt size={14} color="bg" style={{ opacity: 0.75 }}>est. {formatINR(est)}</Txt>
        </View>
        <Pressable accessibilityRole="button" disabled={!count} onPress={() => { latest.current.done = true; onDone(Object.values(sel)); }}
          style={{ height: 52, paddingHorizontal: 22, borderRadius: 16, backgroundColor: c.yellow, justifyContent: 'center', opacity: count ? 1 : 0.5 }}>
          <Txt w="700" size={17} color="onYellow">Done</Txt>
        </Pressable>
      </View>

      {creating !== null && onCreate && <NewItemSheet name={creating} category={cat} onClose={() => setCreating(null)}
        onSave={async draft => { const p = await onCreate(draft); setCreating(null); setQ(''); setCat(p.category); setSheet(p); }} />}

      {sheet && <PackSheet product={sheet} current={sel[sheet.id]} lastPrice={lastPrice} cta={cta} onClose={() => setSheet(null)}
        onRemove={() => { dispatch({ type: 'remove', productId: sheet.id }); setSheet(null); }}
        onAdd={item => { dispatch({ type: 'set', item }); setSheet(null); }} />}
    </View>
  );
}

function Badge({ n, bg, fg, ring }: { n: number; bg: 'yellow' | 'green'; fg: 'onYellow' | 'onGreen'; ring?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{
      position: 'absolute', top: ring ? -4 : 6, right: ring ? -4 : 6, minWidth: 24, height: 24, paddingHorizontal: 6, borderRadius: 12,
      backgroundColor: c[bg], alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: c.bg,
    }}>
      <Txt w="800" size={12} color={fg}>{n}</Txt>
    </View>
  );
}

export function PackSheet({ product, current, lastPrice, cta, onClose, onAdd, onRemove }: {
  product: Product; current?: Pick; lastPrice: LastPrice; cta: string;
  onClose: () => void; onAdd: (p: Pick) => void; onRemove: () => void;
}) {
  const { c } = useTheme();
  const recent = product.packSizes.map(pk => ({ pk, last: lastPrice(product.id, pk) })).filter(x => x.last).sort((a, b) => b.last!.at.localeCompare(a.last!.at))[0];
  const [pack, setPack] = useState(current?.packSize ?? recent?.pk ?? product.packSizes[0]!);
  const [brand, setBrand] = useState<string | null>(current?.brand ?? recent?.last?.brand ?? null);
  const [qty, setQty] = useState(current?.qty ?? 1);
  const each = lastPrice(product.id, pack)?.pricePaise ?? null;
  return (
    <Sheet visible onClose={onClose}>
      <View style={{ gap: 18, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <EmojiTile emoji={product.emoji} size={68} r={22} />
          <View style={{ flex: 1 }}>
            <Txt v="section" size={28} style={{ lineHeight: 30 }}>{product.name}{alias(product) ? <Txt size={28} color="mute"> · {alias(product)}</Txt> : null}</Txt>
            {recent?.last && (
              <Txt size={14} color="mute" style={{ marginTop: 4 }}>
                Last paid {formatINR(recent.last.pricePaise)} · {[recent.last.brand, recent.pk].filter(Boolean).join(' ')}
              </Txt>
            )}
          </View>
          <IconButton label="Close" bg="soft" onPress={onClose}><X size={20} strokeWidth={2.5} color={c.ink} /></IconButton>
        </View>
        <View>
          <Txt w="700" size={15} style={{ marginBottom: 8 }}>Pack size</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {product.packSizes.map(pk => {
              const on = pk === pack, lp = lastPrice(product.id, pk);
              return (
                <Pressable key={pk} onPress={() => setPack(pk)} style={{
                  width: '31.8%', height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: on ? c.green : c.card, borderWidth: on ? 2 : 1.5, borderColor: on ? c.green : c.line,
                }}>
                  <Txt w="700" size={18} color={on ? 'onGreen' : 'ink'}>{pk}</Txt>
                  {lp && <Txt size={13} color={on ? 'onGreen' : 'mute'} style={on ? { opacity: 0.85 } : undefined}>{formatINR(lp.pricePaise)}</Txt>}
                </Pressable>
              );
            })}
          </View>
        </View>
        {product.brands.length > 0 && (
          <View>
            <Txt w="700" size={15} style={{ marginBottom: 8 }}>Brand <Txt size={15} color="mute">· optional</Txt></Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[...product.brands, 'Any'].map(b => {
                const v = b === 'Any' ? null : b;
                return <Chip key={b} label={b} selected={brand === v} onPress={() => setBrand(v)} />;
              })}
            </View>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.soft, borderRadius: 22, paddingVertical: 10, paddingRight: 10, paddingLeft: 18 }}>
          <View>
            <Txt w="700" size={15}>Quantity</Txt>
            <Txt v="meta">{each != null ? `${formatINR(each)} each` : 'Price at the counter'}</Txt>
          </View>
          <Stepper large value={qty} onChange={setQty} />
        </View>
        <PrimaryButton label={current ? 'Update' : cta} height={62} onPress={() => onAdd({ productId: product.id, packSize: pack, brand, qty })}
          right={each != null ? <Txt v="num" size={21} color="onYellow" style={{ lineHeight: 24 }}>{formatINR(each * qty)}</Txt> : undefined} />
        {current && (
          <Pressable onPress={onRemove} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Txt w="600" size={15} color="chili">Remove</Txt>
          </Pressable>
        )}
      </View>
    </Sheet>
  );
}

const UNITS = [
  { key: 'kg', label: 'By weight', packs: ['250 g', '500 g', '1 kg', '5 kg'] },
  { key: 'L', label: 'By volume', packs: ['200 ml', '500 ml', '1 L', '5 L'] },
  { key: 'pcs', label: 'By piece', packs: ['1 pcs', '2 pcs', '6 pcs', '12 pcs'] },
] as const;
const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛', 'atta-rice': '🌾', dal: '🫘', 'oil-ghee': '🫗', masala: '🌶️', sabzi: '🥬', fruits: '🍎', 'bakery-eggs': '🍞', snacks: '🍪',
  beverages: '🧃', 'dry-fruits': '🥜', cleaning: '🧽', 'personal-care': '🧴', pooja: '🪔', baby: '🍼', kitchen: '🍳',
};

function NewItemSheet({ name: initial, category, onClose, onSave }: {
  name: string; category: string; onClose: () => void; onSave: (p: NewProduct) => Promise<void>;
}) {
  const { c } = useTheme();
  const [name, setName] = useState(initial);
  const [cat, setCat] = useState(category);
  const [unit, setUnit] = useState<(typeof UNITS)[number]['key']>('kg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setError(null);
    try { await onSave({ name: name.trim(), category: cat, emoji: CATEGORY_EMOJI[cat] ?? '🛒', packSizes: [...UNITS.find(u => u.key === unit)!.packs] }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not add the item'); setBusy(false); }
  };
  return (
    <Sheet visible onClose={onClose}>
      <View style={{ gap: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <EmojiTile emoji={CATEGORY_EMOJI[cat] ?? '🛒'} size={60} r={20} />
          <Txt v="section" size={24} style={{ flex: 1 }}>New item</Txt>
          <IconButton label="Close" bg="soft" onPress={onClose}><X size={20} strokeWidth={2.5} color={c.ink} /></IconButton>
        </View>
        <TextInput value={name} onChangeText={setName} autoFocus={!initial} placeholder="Name, e.g. Sabudana" placeholderTextColor={c.mute} maxLength={60}
          style={{ height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: 16, fontSize: 18, fontFamily: font.semibold, color: c.ink }} />
        <View>
          <Txt w="700" size={15} style={{ marginBottom: 8 }}>Category</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PRODUCT_CATEGORIES.map(t => <Chip key={t.slug} label={`${CATEGORY_EMOJI[t.slug]} ${t.label}`} selected={cat === t.slug} onPress={() => setCat(t.slug)} height={44} />)}
          </ScrollView>
        </View>
        <View>
          <Txt w="700" size={15} style={{ marginBottom: 8 }}>Sold</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {UNITS.map(u => (
              <Pressable key={u.key} onPress={() => setUnit(u.key)} style={{
                flex: 1, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                backgroundColor: unit === u.key ? c.green : c.card, borderWidth: unit === u.key ? 2 : 1.5, borderColor: unit === u.key ? c.green : c.line,
              }}>
                <Txt w="700" size={15} color={unit === u.key ? 'onGreen' : 'ink'}>{u.label}</Txt>
                <Txt size={12} color={unit === u.key ? 'onGreen' : 'mute'}>{u.packs[0].replace(' pcs', ' pc')} – {u.packs[3]}</Txt>
              </Pressable>
            ))}
          </View>
        </View>
        {error && <Txt size={14} color="chili">{error}</Txt>}
        <PrimaryButton label="Add item" height={60} center disabled={!name.trim() || busy} onPress={save}
          left={<Plus size={20} strokeWidth={2.75} color={c.onYellow} />} />
      </View>
    </Sheet>
  );
}
