import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ArrowRight, Check, ChevronLeft, Copy, EllipsisVertical, Plus, Trash2, X } from 'lucide-react-native';
import { formatINR } from '@rupli/shared';
import type { ListDetail, ListItem, ListSummary } from '../api';
import { activeList, deletable as canDelete, groupByCategory, listTitle, visibleLists } from '../logic/lists';
import { SwipeToDelete } from '../ui/actions';
import { useTheme } from '../theme';
import { Card, Checkbox, EmojiTile, IconButton, Pill, PrimaryButton, Progress, SecondaryButton, Stepper, Txt } from '../ui/core';
import { BottomBar } from '../ui/layout';
import { plural } from '../logic/text';

export function EmptyState({ art, title, body }: { art: React.ReactNode; title: string; body: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 }}>
      {art}
      <Txt v="section" size={28} style={{ textAlign: 'center' }}>{title}</Txt>
      <Txt size={17} color="mute" style={{ textAlign: 'center', lineHeight: 25 }}>{body}</Txt>
    </View>
  );
}

export function ScreenTitle({ children }: { children: string }) {
  return <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}><Txt v="title">{children}</Txt></View>;
}

export interface ListsProps {
  lists: ListSummary[]; canCopy: boolean;
  onOpen: (id: string) => void; onNew: () => void; onCopy: () => void;
  onDelete: (ids: string[]) => Promise<boolean>; // resolves true once the user confirmed
}

// a family member can't delete someone else's list
const deletable = (l: ListSummary) => canDelete(l) && l.owner !== false;

export function ListsView({ lists: all, canCopy, onOpen, onNew, onCopy, onDelete }: ListsProps) {
  const { c } = useTheme();
  const lists = visibleLists(all);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selecting = selected.size > 0;
  const toggle = (l: ListSummary) => {
    if (!deletable(l)) return;
    setSelected(s => { const n = new Set(s); if (n.has(l.id)) n.delete(l.id); else n.add(l.id); return n; });
  };
  // long-press starts selecting; while selecting, a tap toggles instead of opening
  const press = (l: ListSummary) => (selecting ? toggle(l) : onOpen(l.id));

  if (!lists.length) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenTitle>Lists</ScreenTitle>
        <EmptyState title="No lists yet" body="Start with the usuals: milk, atta, dal, oil. Rupli remembers sizes and brands for next month." art={
          <View style={{ width: 180, height: 150 }}>
            <View style={{ position: 'absolute', left: 50, top: 20 }}><EmojiTile emoji="🧺" size={96} bg="mint" r={30} /></View>
            <View style={{ position: 'absolute', left: 10, top: 84, transform: [{ rotate: '-10deg' }] }}><EmojiTile emoji="🥛" size={52} bg="yellow" r={18} /></View>
            <View style={{ position: 'absolute', left: 130, top: 0, transform: [{ rotate: '12deg' }] }}><EmojiTile emoji="🧅" size={46} bg="card" r={16} /></View>
          </View>
        } />
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 10 }}>
          {canCopy && <SecondaryButton label="Copy last month’s list" onPress={onCopy} icon={<Copy size={20} strokeWidth={2.25} color={c.ink} />} />}
          <PrimaryButton label="Make your first list" center onPress={onNew} left={<Plus size={20} strokeWidth={2.75} color={c.onYellow} />} />
        </View>
      </View>
    );
  }
  const active = activeList(lists);
  const rest = lists.filter(l => l !== active);
  const check = (l: ListSummary) => selecting && deletable(l) ? (
    <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: selected.has(l.id) ? 0 : 2, borderColor: c.mute, backgroundColor: selected.has(l.id) ? c.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {selected.has(l.id) && <Check size={15} strokeWidth={3.5} color={c.onGreen} />}
    </View>
  ) : null;
  const askDelete = async (ids: string[]) => { if (await onDelete(ids)) setSelected(new Set()); };

  return (
    <View style={{ flex: 1 }}>
      {selecting ? (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton label="Cancel selection" onPress={() => setSelected(new Set())}><X size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
          <Txt v="section" size={24} style={{ flex: 1 }}>{selected.size} selected</Txt>
        </View>
      ) : <ScreenTitle>Lists</ScreenTitle>}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 12 }}>
        {active && (
          <SwipeToDelete radius={24} enabled={!selecting && deletable(active)} onDelete={async close => { await askDelete([active.id]); close(); }}>
            <Pressable onPress={() => press(active)} onLongPress={() => toggle(active)} style={{ backgroundColor: c.green, borderRadius: 24, padding: 18, gap: 12, opacity: selecting && !deletable(active) ? 0.5 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Pill label={`${active.shared ? '👪 ' : ''}${listTitle(active)}`} bg="onGreenSoft" fg="onGreen" style={{ flexShrink: 1 }} />
                {check(active) ?? <Pill label={active.status === 'shopping' ? 'Shopping' : 'Draft'} bg="yellow" fg="onYellow" w="700" />}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <Txt size={14} color="onGreen" style={{ opacity: 0.85 }}>{plural(active.itemCount, 'item')} · {active.checkedCount} picked</Txt>
                  <Txt v="num" size={36} color="onGreen">{active.estimatePaise ? formatINR(active.estimatePaise) : '—'} <Txt w="500" size={15} color="onGreen" style={{ opacity: 0.8 }}>est.</Txt></Txt>
                </View>
                <Txt size={24}>🛒</Txt>
              </View>
              <Progress pct={active.itemCount ? (active.checkedCount / active.itemCount) * 100 : 0} track="onGreenTrack" fill="yellow" h={10} />
            </Pressable>
          </SwipeToDelete>
        )}
        {rest.map(l => {
          const done = l.status === 'done';
          return (
            <SwipeToDelete key={l.id} radius={24} enabled={!selecting && deletable(l)} onDelete={async close => { await askDelete([l.id]); close(); }}>
              <Pressable onPress={() => press(l)} onLongPress={() => toggle(l)}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: selected.has(l.id) ? c.green : c.line, borderWidth: selected.has(l.id) ? 2 : 1.5 }}>
                  <EmojiTile emoji={done ? '🧺' : '📝'} size={52} bg={done ? 'mint' : 'chiliSoft'} r={16} />
                  <View style={{ flex: 1 }}>
                    <Txt v="meta">{l.shared ? '👪 ' : ''}{listTitle(l)}</Txt>
                    <Txt w="700" size={17}>{plural(l.itemCount, 'item')} · {done && l.paidPaise ? `paid ${formatINR(l.paidPaise)}` : (l.estimatePaise ? `est. ${formatINR(l.estimatePaise)}` : 'no prices yet')}</Txt>
                  </View>
                  {check(l) ?? (done ? <Pill label="Done ✓" bg="mint" fg="mintInk" w="700" size={12} /> : <Pill label="Draft" size={12} />)}
                </Card>
              </Pressable>
            </SwipeToDelete>
          );
        })}
        {!selecting && lists.length > 1 && <Txt v="meta" style={{ textAlign: 'center', marginTop: 4 }}>Long-press to select · swipe left to delete</Txt>}
      </ScrollView>
      {selecting ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
          <Pressable accessibilityRole="button" onPress={() => askDelete([...selected])} style={{ height: 60, borderRadius: 20, backgroundColor: c.chili, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Trash2 size={20} strokeWidth={2.25} color="#FFFFFF" />
            <Txt w="700" size={18} style={{ color: '#FFFFFF' }}>Delete {selected.size} {selected.size === 1 ? 'list' : 'lists'}</Txt>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
          <SecondaryButton label="New list" onPress={onNew} style={{ flex: 1 }} icon={<Plus size={20} strokeWidth={2.5} color={c.ink} />} />
          <PrimaryButton label="Copy last month’s list" height={58} size={17} center disabled={!canCopy} onPress={onCopy} style={{ flex: 2 }}
            left={<Copy size={20} strokeWidth={2.25} color={c.onYellow} />} />
        </View>
      )}
    </View>
  );
}

export interface ListDetailProps {
  list: ListDetail; onBack: () => void; onMore: () => void; onAdd: () => void; onStart: () => void;
  onToggle: (item: ListItem) => void; onQty: (item: ListItem, qty: number) => void;
  onDeleteItem: (item: ListItem, close: () => void) => void; onItem: (item: ListItem) => void;
}

export function ListDetailView({ list, onBack, onMore, onAdd, onStart, onToggle, onQty, onDeleteItem, onItem }: ListDetailProps) {
  const { c } = useTheme();
  const est = list.items.reduce((s, i) => s + i.qty * (i.lastPricePaise ?? 0), 0);
  const picked = list.items.filter(i => i.checked).length;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton label="Back" onPress={onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
          <Txt w="600" size={16} numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>{listTitle(list)}</Txt>
          <IconButton label="More" onPress={onMore}><EllipsisVertical size={22} strokeWidth={3} color={c.ink} /></IconButton>
        </View>
        <View style={{ backgroundColor: c.green, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Txt size={14} color="onGreen" style={{ opacity: 0.85 }}>Estimated total{list.shared ? '  ·  👪 Shared' : ''}</Txt>
              <Txt v="num" size={46} color="onGreen" style={{ letterSpacing: -0.9, lineHeight: 46 }}>{est || !list.items.length ? formatINR(est) : '—'}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt w="800" size={22} color="yellow">{picked}/{list.items.length}</Txt>
              <Txt size={13} color="onGreen" style={{ opacity: 0.85 }}>picked</Txt>
            </View>
          </View>
          <View style={{ marginTop: 12 }}><Progress pct={list.items.length ? (picked / list.items.length) * 100 : 0} track="onGreenTrack" fill="yellow" h={8} /></View>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
        {list.items.length === 0 && (
          <Txt size={16} color="mute" style={{ textAlign: 'center', marginTop: 24 }}>Nothing here yet. Tap “Add items” to pick from the catalog.</Txt>
        )}
        {groupByCategory(list.items).map(g => (
          <Card key={g.slug} pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <Txt w="700" size={14}>{g.label}</Txt>
              <Txt v="meta">{g.picked}/{g.items.length}</Txt>
            </View>
            {g.items.map(it => (
              <SwipeToDelete key={it.id} onDelete={close => onDeleteItem(it, close)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 72, paddingVertical: 6, backgroundColor: c.card }}>
                <Checkbox checked={it.checked} onPress={() => onToggle(it)} />
                <EmojiTile emoji={it.product.emoji} />
                <Pressable accessibilityRole="button" accessibilityHint="Shows price history" onPress={() => onItem(it)} style={{ flex: 1, gap: 2 }}>
                  <Txt w="700" size={16}>{it.product.name}{it.product.aliases[0] ? <Txt size={16} color="mute"> · {it.product.aliases[0]}</Txt> : null}</Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <Txt w="600" size={13}>{it.packSize}</Txt>
                    {it.brand && <Pill label={it.brand} bg="mint" fg="mintInk" size={12} style={{ paddingVertical: 1, paddingHorizontal: 8 }} />}
                    {it.lastPricePaise != null && <Txt v="meta">Last {formatINR(it.lastPricePaise)}</Txt>}
                  </View>
                </Pressable>
                <Stepper value={it.qty} onChange={q => onQty(it, q)} />
              </View>
              </SwipeToDelete>
            ))}
          </Card>
        ))}
      </ScrollView>
      <BottomBar>
        <SecondaryButton label="Add items" onPress={onAdd} style={{ flex: 1 }} icon={<Plus size={20} strokeWidth={2.5} color={c.ink} />} />
        <PrimaryButton label="Start shopping" height={58} size={17} center onPress={onStart} disabled={!list.items.length} style={{ flex: 1.5 }}
          right={<ArrowRight size={20} strokeWidth={2.5} color={c.onYellow} />} />
      </BottomBar>
    </View>
  );
}
