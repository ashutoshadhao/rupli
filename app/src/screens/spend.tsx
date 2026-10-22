import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Check, ChevronLeft, ChevronRight, Plus, Share2 } from 'lucide-react-native';
import { formatINR } from '@rupli/shared';
import type { Category, Recurring, Spend, SpendTxn } from '../api';
import { SwipeToDelete } from '../ui/actions';
import { pressKey, rupeesToPaise } from '../logic/keypad';
import { monthLabel, monthName, monthShort, when } from '../logic/month';
import { barHeights, groupDonut, pctChange } from '../logic/spend';
import { txnTitle } from '../logic/text';
import { font, useTheme } from '../theme';
import { Card, EmojiTile, IconButton, Pill, PrimaryButton, SOURCE_BADGE, Toggle, Txt } from '../ui/core';
import { Keypad } from '../ui/layout';
import { EmptyState } from './lists';

const PRIMARY_CATS = ['groceries', 'food', 'household', 'health', 'pooja', 'fuel'];

export interface SpendProps {
  month: string; spend: Spend; canNext: boolean;
  onPrev: () => void; onNext: () => void; onOpen: (t: SpendTxn) => void; onAdd: () => void;
  recurring?: Recurring[]; onStopRecurring?: (r: Recurring, close: () => void) => void; onExport?: () => void;
}

function Donut({ parts }: { parts: { pct: number; color: string }[] }) {
  const { c } = useTheme();
  const r = 42, C = 2 * Math.PI * r;
  const lens = parts.map(p => (p.pct / 100) * C);
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={104} height={104} viewBox="0 0 104 104" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {parts.map((p, i) => (
          <Circle key={i} cx={52} cy={52} r={r} fill="none" stroke={p.color} strokeWidth={20} strokeDasharray={`${lens[i]} ${C - lens[i]!}`} strokeDashoffset={-starts[i]!} />
        ))}
      </Svg>
      <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
        <Txt w="700" size={12} style={{ textAlign: 'center', lineHeight: 13 }}>{parts.length}{'\n'}groups</Txt>
      </View>
    </View>
  );
}

export function SpendView({ month, spend, canNext, onPrev, onNext, onOpen, onAdd, recurring = [], onStopRecurring, onExport }: SpendProps) {
  const { c } = useTheme();
  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Txt v="title" size={34} style={{ flex: 1 }}>Spend</Txt>
      {onExport && spend.transactions.length > 0 && (
        <View style={{ marginRight: 8 }}><IconButton label="Export month" onPress={onExport}><Share2 size={20} strokeWidth={2.25} color={c.ink} /></IconButton></View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line }}>
        <Pressable accessibilityLabel="Previous month" onPress={onPrev} style={{ width: 40, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} strokeWidth={2.75} color={c.ink} />
        </Pressable>
        <Txt w="700" size={15}>{monthLabel(month)}</Txt>
        <Pressable accessibilityLabel="Next month" disabled={!canNext} onPress={onNext} style={{ width: 40, height: '100%', alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.3 }}>
          <ChevronRight size={18} strokeWidth={2.75} color={c.ink} />
        </Pressable>
      </View>
    </View>
  );
  if (!spend.allPaise && !spend.transactions.length) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <EmptyState title={`No spends in ${monthName(month)} yet`} body="Finish a shopping trip or add an expense to see it here." art={
          <View style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 14, borderColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt v="num" size={44} color="mute">₹0</Txt>
          </View>
        } />
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
          <PrimaryButton label="Add expense" center onPress={onAdd} left={<Plus size={20} strokeWidth={2.75} color={c.onYellow} />} />
        </View>
      </View>
    );
  }
  const change = pctChange(spend.totalPaise, spend.prevTotalPaise);
  const diff = spend.totalPaise - spend.prevTotalPaise;
  const heights = barHeights(spend.months.map(m => m.totalPaise));
  const donut = groupDonut(spend.byProductCategory);
  return (
    <View style={{ flex: 1 }}>
      {header}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90, gap: 10 }}>
        <View style={{ backgroundColor: c.green, borderRadius: 26, paddingVertical: 16, paddingHorizontal: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Txt w="600" size={14} color="onGreen" style={{ opacity: 0.85 }}>🛒 Groceries</Txt>
            <Txt size={14} color="onGreen" style={{ opacity: 0.85 }}>All spends <Txt w="800" size={14} color="yellow">{formatINR(spend.allPaise)}</Txt></Txt>
          </View>
          <Txt v="hero" size={56} color="onGreen" style={{ lineHeight: 56, letterSpacing: -1.1 }}>{formatINR(spend.totalPaise)}</Txt>
          {change != null && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <Pill label={`${change <= 0 ? '▼' : '▲'} ${Math.abs(change)}%`} bg="yellow" fg="onYellow" w="700" style={{ paddingVertical: 3 }} />
              <Txt size={13} color="onGreen" style={{ opacity: 0.85 }}>{formatINR(Math.abs(diff))} {diff <= 0 ? 'less' : 'more'} than {monthShort(spend.months.at(-2)!.month)}</Txt>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end', height: 92, marginTop: 14 }}>
            {spend.months.map((m, i) => (
              <View key={m.month} style={{ flex: 1, height: `${heights[i]}%`, borderRadius: 8, backgroundColor: i === spend.months.length - 1 ? c.yellow : 'rgba(255,246,230,0.28)' }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {spend.months.map((m, i) => {
              const cur = i === spend.months.length - 1;
              return <Txt key={m.month} size={12} w={cur ? '800' : '400'} color={cur ? 'yellow' : 'onGreen'} style={{ flex: 1, textAlign: 'center', opacity: cur ? 1 : 0.85 }}>{monthShort(m.month)}</Txt>;
            })}
          </View>
        </View>
        {donut.length > 0 && (
          <Card pad={14} style={{ borderRadius: 22, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Donut parts={donut} />
            <View style={{ flex: 1, gap: 3 }}>
              {donut.map(g => (
                <View key={g.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: g.color }} />
                  <Txt size={13} style={{ flex: 1 }}>{g.label}</Txt>
                  <Txt w="700" size={13}>{formatINR(g.totalPaise)}</Txt>
                </View>
              ))}
            </View>
          </Card>
        )}
        {recurring.length > 0 && (
          <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, paddingBottom: 2 }}>
              <Txt w="700" size={15}>Monthly bills</Txt>
              <Txt v="meta">{formatINR(recurring.reduce((a, r) => a + r.amountPaise, 0))}/month</Txt>
            </View>
            {recurring.map(r => (
              <SwipeToDelete key={r.id} onDelete={close => onStopRecurring?.(r, close)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.card }}>
                  <EmojiTile emoji="🔁" size={38} r={12} bg="mint" />
                  <View style={{ flex: 1 }}>
                    <Txt w="600" size={15} numberOfLines={1}>{r.name}</Txt>
                    <Txt v="meta">Every month on day {r.dayOfMonth}</Txt>
                  </View>
                  <Txt w="800" size={16}>{formatINR(r.amountPaise)}</Txt>
                </View>
              </SwipeToDelete>
            ))}
          </Card>
        )}
        <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
          <Txt w="700" size={15} style={{ paddingTop: 10, paddingBottom: 2 }}>Transactions</Txt>
          {spend.transactions.map(t => (
            <Pressable key={t.id} onPress={() => onOpen(t)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, borderTopWidth: 1, borderTopColor: c.line }}>
              <EmojiTile emoji={t.category.emoji} size={40} r={12} />
              <View style={{ flex: 1 }}>
                <Txt w="600" size={15} numberOfLines={1}>{txnTitle(t)}</Txt>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Pill label={SOURCE_BADGE[t.source]} size={12} style={{ paddingVertical: 1, paddingHorizontal: 8 }} />
                  <Txt size={12} color="mute">{when(t.occurredAt)}</Txt>
                </View>
              </View>
              <Txt w="800" size={16} color={t.direction === 'credit' ? 'green' : 'ink'}>{t.direction === 'credit' ? '+' : ''}{formatINR(t.amountPaise)}</Txt>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
      <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <PrimaryButton label="Add expense" height={56} size={16} onPress={onAdd} style={{ width: 180 }} center left={<Plus size={20} strokeWidth={2.75} color={c.onYellow} />} />
      </View>
    </View>
  );
}

function CategoryGrid({ categories, value, onPick }: { categories: Category[]; value: string | null; onPick: (id: string) => void }) {
  const { c } = useTheme();
  const [all, setAll] = useState(false);
  const primary = PRIMARY_CATS.map(s => categories.find(x => x.slug === s)).filter((x): x is Category => !!x);
  const shown = all ? categories : primary.some(p => p.id === value) || !value ? primary : [...primary, categories.find(x => x.id === value)!];
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shown.map(cat => {
          const on = cat.id === value;
          return (
            <Pressable key={cat.id} onPress={() => onPick(cat.id)} style={{
              width: '31.8%', height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2,
              backgroundColor: on ? c.green : c.card, borderWidth: on ? 2 : 1.5, borderColor: on ? c.green : c.line,
            }}>
              <Txt size={22} style={{ lineHeight: 26 }}>{cat.emoji}</Txt>
              <Txt size={13} w={on ? '700' : '500'} color={on ? 'onGreen' : 'ink'} numberOfLines={1}>{cat.name}</Txt>
            </Pressable>
          );
        })}
      </View>
      {!all && categories.length > primary.length && (
        <Pressable onPress={() => setAll(true)} style={{ height: 40, justifyContent: 'center' }}><Txt w="600" size={15} color="green">More categories</Txt></Pressable>
      )}
    </View>
  );
}

export function TxnDetailView({ txn, categories, onBack, onSave, onDelete, busy }: {
  txn: SpendTxn; categories: Category[]; onBack: () => void; onSave: (categoryId: string, makeRule: boolean) => void;
  onDelete?: () => void; busy?: boolean;
}) {
  const { c } = useTheme();
  const [cat, setCat] = useState(txn.category.id);
  const [always, setAlways] = useState(false);
  const catName = categories.find(x => x.id === cat)?.name ?? txn.category.name;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <IconButton label="Back" onPress={onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        <View style={{ backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}>
          <Txt w="600" size={13}>{txn.source === 'sms' ? '💬 From SMS' : txn.source === 'cart' ? '🛒 From a trip' : '✍️ Added by you'}</Txt>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 6 }}>
          <EmojiTile emoji={categories.find(x => x.id === cat)?.emoji ?? txn.category.emoji} size={60} r={20} bg="mint" />
          <Txt v="hero" size={68} style={{ lineHeight: 70, marginTop: 8, letterSpacing: -1.4 }}>{formatINR(txn.amountPaise)}</Txt>
          <Txt w="700" size={19}>{txnTitle(txn)}</Txt>
          <Txt size={14} color="mute">{when(txn.occurredAt)}</Txt>
          {txn.note && txn.note !== txnTitle(txn) ? <Txt size={14} color="mute" style={{ marginTop: 4 }}>“{txn.note}”</Txt> : null}
        </View>
        {(txn.account || (txn.source === 'sms' && txn.sourceRef)) && (
          <Card pad={0} style={{ paddingHorizontal: 16, paddingVertical: 2, borderRadius: 22 }}>
            {txn.account && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 44, alignItems: 'center' }}>
                <Txt size={15} color="mute">Account</Txt><Txt w="700" size={15}>{txn.account.bank} ••{txn.account.last4}</Txt>
              </View>
            )}
            {txn.source === 'sms' && txn.sourceRef && /^\d{9,12}$/.test(txn.sourceRef) && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 44, alignItems: 'center', borderTopWidth: txn.account ? 1 : 0, borderTopColor: c.line }}>
                <Txt size={15} color="mute">UPI ref</Txt><Txt w="700" size={13} style={{ fontFamily: 'monospace' }}>{txn.sourceRef}</Txt>
              </View>
            )}
          </Card>
        )}
        <Txt w="700" size={15} style={{ marginTop: 2 }}>Category</Txt>
        <CategoryGrid categories={categories} value={cat} onPick={setCat} />
        {txn.merchant && txn.source !== 'cart' && (
          <Pressable onPress={() => setAlways(a => !a)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, borderRadius: 20, backgroundColor: c.soft, paddingHorizontal: 16 }}>
            <Txt w="600" size={15} style={{ flex: 1, lineHeight: 20 }}>Always categorise {txn.merchant} as {catName}</Txt>
            <Toggle on={always} onPress={() => setAlways(a => !a)} />
          </Pressable>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
        <PrimaryButton label="Save" disabled={busy} onPress={() => onSave(cat, always)} right={<Check size={22} strokeWidth={2.75} color={c.onYellow} />} />
        {onDelete && (
          <Pressable accessibilityRole="button" onPress={onDelete} style={{ height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <Txt w="600" size={15} color="chili">Delete this expense</Txt>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function NewExpenseView({ categories, onBack, onSave, busy }: {
  categories: Category[]; onBack: () => void; busy?: boolean;
  onSave: (v: { amountPaise: number; categoryId: string; note: string; date: Date; repeat: boolean }) => void;
}) {
  const { c } = useTheme();
  const [val, setVal] = useState('');
  const [opened] = useState(() => Date.now());
  const [daysAgo, setDaysAgo] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const date = new Date(opened - daysAgo * 86_400_000);
  const dateLabel = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const [cat, setCat] = useState<string | null>(categories.find(x => x.slug === 'groceries')?.id ?? null);
  const [note, setNote] = useState('');
  const amount = rupeesToPaise(val);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
        <IconButton label="Back" onPress={onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        <Txt w="700" size={19}>Add expense</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: c.soft, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 18 }}>
          <Txt w="600" size={14} color="mute">Amount</Txt>
          <Txt v="hero" size={64} style={{ lineHeight: 66 }}>{formatINR(amount ?? 0)}</Txt>
        </View>
        <CategoryGrid categories={categories} value={cat} onPick={setCat} />
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card }}>
          <Pressable accessibilityLabel="Earlier day" onPress={() => setDaysAgo(d => Math.min(d + 1, 90))} style={{ width: 52, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={20} strokeWidth={2.75} color={c.ink} />
          </Pressable>
          <Txt w="700" size={16} style={{ flex: 1, textAlign: 'center' }}>📅 {dateLabel}</Txt>
          <Pressable accessibilityLabel="Later day" disabled={!daysAgo} onPress={() => setDaysAgo(d => Math.max(d - 1, 0))} style={{ width: 52, height: '100%', alignItems: 'center', justifyContent: 'center', opacity: daysAgo ? 1 : 0.3 }}>
            <ChevronRight size={20} strokeWidth={2.75} color={c.ink} />
          </Pressable>
        </View>
        <Pressable onPress={() => setRepeat(r => !r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, borderRadius: 18, backgroundColor: c.soft, paddingHorizontal: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt w="600" size={15}>🔁 Repeat every month</Txt>
            <Txt v="meta">{repeat ? `Added on day ${date.getDate()} of each month` : 'For milkman, maid, rent…'}</Txt>
          </View>
          <Toggle on={repeat} onPress={() => setRepeat(r => !r)} />
        </Pressable>
        <TextInput value={note} onChangeText={setNote} placeholder={repeat ? 'Name, e.g. Milkman' : 'Note (optional), e.g. sabzi wala'} placeholderTextColor={c.mute} maxLength={200}
          style={{ height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: 16, fontSize: 16, fontFamily: font.regular, color: c.ink }} />
        <Keypad onKey={k => setVal(v => pressKey(v, k, 6))} />
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
        <PrimaryButton label="Save expense" disabled={!amount || !cat || busy} onPress={() => amount && cat && onSave({ amountPaise: amount, categoryId: cat, note, date, repeat })}
          right={<Check size={22} strokeWidth={2.75} color={c.onYellow} />} />
      </View>
    </View>
  );
}
