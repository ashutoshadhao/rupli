import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import type { Unit } from '@rupli/shared';
import { compareDraft, setUnit, type DraftOption } from '../logic/compare';
import { font, useTheme } from '../theme';
import { Pill, PrimaryButton, Txt } from '../ui/core';
import { EmptyState } from './lists';

const UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'pcs'];
const blank = (): DraftOption => ({ name: '', qty: '1', unit: 'L', price: '' });

export function CompareView({ onAddWinner }: { onAddWinner: (name: string) => void }) {
  const { c } = useTheme();
  const [opts, setOpts] = useState<DraftOption[]>([]);
  const set = (i: number, patch: Partial<DraftOption>) => setOpts(o => o.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const view = compareDraft(opts);
  const field = { borderRadius: 14, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.soft, paddingHorizontal: 10, fontSize: 17, fontFamily: font.bold, color: c.ink } as const;

  if (!opts.length) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}><Txt v="title">Compare</Txt></View>
        <EmptyState title="Which pack is cheaper?" body="Enter two to four packs with quantity and price. Rupli works out the price per kg, L or piece." art={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 84, height: 100, borderRadius: 24, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={36} style={{ lineHeight: 42 }}>🌻</Txt><Txt w="700" size={14}>1 L</Txt>
            </View>
            <Txt w="800" size={20} color="mute">vs</Txt>
            <View style={{ width: 84, height: 100, borderRadius: 24, backgroundColor: c.mint, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={36} style={{ lineHeight: 42 }}>🛢️</Txt><Txt w="700" size={14}>5 L</Txt>
            </View>
          </View>
        } />
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
          <PrimaryButton label="Start comparing" center onPress={() => setOpts([{ ...blank(), qty: '1' }, { ...blank(), qty: '5' }])} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt v="title" size={34}>Compare</Txt>
        {opts.length < 4 && (
          <Pressable onPress={() => setOpts(o => [...o, blank()])} style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={18} strokeWidth={2.75} color={c.ink} /><Txt w="600" size={15}>Option</Txt>
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }} keyboardShouldPersistTaps="handled">
        {opts.map((o, i) => {
          const best = i === view.bestIndex;
          return (
            <View key={i} style={{ backgroundColor: c.card, borderRadius: 22, paddingVertical: 10, paddingHorizontal: 12, gap: 8, borderWidth: best ? 2.5 : 1.5, borderColor: best ? c.green : c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: best ? c.green : c.soft, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt w="800" size={14} color={best ? 'onGreen' : 'ink'}>{String.fromCharCode(65 + i)}</Txt>
                </View>
                <TextInput value={o.name} onChangeText={name => set(i, { name })} placeholder={`Pack ${String.fromCharCode(65 + i)} name`} placeholderTextColor={c.mute}
                  style={{ flex: 1, fontSize: 16, fontFamily: font.bold, color: c.ink, padding: 0 }} />
                {best ? <Pill label="⭐ Best value" bg="yellow" fg="onYellow" w="800" size={12} />
                  : opts.length > 2 && <Pressable accessibilityLabel="Remove option" hitSlop={10} onPress={() => setOpts(x => x.filter((_, j) => j !== i))}><X size={18} color={c.mute} /></Pressable>}
              </View>
              <View style={{ flexDirection: 'row', gap: 6, height: 44 }}>
                <TextInput value={o.qty} onChangeText={qty => set(i, { qty: qty.replace(/[^\d.,]/g, '') })} keyboardType="decimal-pad" accessibilityLabel="Quantity" style={[field, { width: 58 }]} />
                <View style={{ flexDirection: 'row', borderRadius: 14, backgroundColor: c.soft, padding: 3 }}>
                  {UNITS.map(u => (
                    <Pressable key={u} onPress={() => setOpts(o => setUnit(o, i, u))} style={{ width: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: o.unit === u ? (best ? c.green : c.ink) : 'transparent' }}>
                      <Txt size={14} w={o.unit === u ? '700' : '400'} color={o.unit === u ? (best ? 'onGreen' : 'bg') : 'ink'}>{u}</Txt>
                    </Pressable>
                  ))}
                </View>
                <View style={[field, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
                  <Txt w="700" size={17}>₹</Txt>
                  <TextInput value={o.price} onChangeText={price => set(i, { price: price.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" accessibilityLabel="Price"
                    style={{ flex: 1, fontSize: 17, fontFamily: font.bold, color: c.ink, padding: 0 }} />
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ backgroundColor: c.green, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, gap: 8 }}>
          {view.bestIndex != null ? (
            <>
              <Txt size={14} color="onGreen" style={{ opacity: 0.85 }}>{opts[view.bestIndex]!.name || `Pack ${String.fromCharCode(65 + view.bestIndex)}`}</Txt>
              <Txt w="800" size={22} color="yellow" style={{ lineHeight: 26 }}>{view.saving}</Txt>
            </>
          ) : <Txt w="700" size={17} color="onGreen">{view.message}</Txt>}
          {view.rows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, height: 26, borderRadius: 13, backgroundColor: c.onGreenSoft, overflow: 'hidden', justifyContent: 'center' }}>
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.widthPct}%`, borderRadius: 13, backgroundColor: r.best ? c.yellow : 'rgba(255,246,230,0.3)' }} />
                <Txt size={13} w={r.best ? '700' : '600'} color={r.best ? 'onYellow' : 'onGreen'} numberOfLines={1} style={{ paddingHorizontal: 10 }}>{r.name || `Pack ${String.fromCharCode(65 + i)}`}</Txt>
              </View>
              <Txt w="800" size={15} color="onGreen" style={{ width: 80, textAlign: 'right' }}>{r.label}</Txt>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}>
        <PrimaryButton label="Add winner to list" height={58} disabled={view.bestIndex == null}
          onPress={() => view.bestIndex != null && onAddWinner(opts[view.bestIndex]!.name)}
          right={<Plus size={22} strokeWidth={2.75} color={c.onYellow} />} />
      </View>
    </KeyboardAvoidingView>
  );
}
