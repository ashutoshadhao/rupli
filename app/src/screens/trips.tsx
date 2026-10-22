import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { ChevronLeft, ChevronRight, Search, Trash2, X } from 'lucide-react-native';
import { cartTotal, formatINR } from '@rupli/shared';
import type { PricePoint, Trip, TripItem } from '../api';
import { cheapest } from '../logic/spend';
import { monthLabel, when } from '../logic/month';
import { font, useTheme } from '../theme';
import { Card, EmojiTile, IconButton, Pill, Txt } from '../ui/core';
import { SwipeToDelete } from '../ui/actions';
import { EmptyState } from './lists';
import { plural } from '../logic/text';

export type TripRow = Trip & { listName?: string | null };

export interface TripsProps {
  trips: TripRow[]; loading: boolean; month: string | null; store: string; canNext: boolean; hasMore: boolean;
  onBack: () => void; onMonth: (m: string | null) => void; onPrevMonth: () => void; onNextMonth: () => void;
  onStore: (s: string) => void; onOpen: (id: string) => void; onDelete: (t: TripRow, close: () => void) => void; onMore: () => void;
}

export function TripsView(p: TripsProps) {
  const { c } = useTheme();
  const total = p.trips.reduce((s, t) => s + (t.totalPaise ?? 0), 0);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
        <IconButton label="Back" onPress={p.onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        <Txt w="700" size={19}>All trips</Txt>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <View style={{ height: 50, borderRadius: 25, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
          <Search size={20} strokeWidth={2.5} color={c.mute} />
          <TextInput value={p.store} onChangeText={p.onStore} placeholder="Store, e.g. DMart" placeholderTextColor={c.mute} autoCorrect={false}
            style={{ flex: 1, fontSize: 16, fontFamily: font.regular, color: c.ink }} />
          {p.store ? <Pressable accessibilityLabel="Clear store filter" onPress={() => p.onStore('')} hitSlop={10}><X size={18} color={c.mute} /></Pressable> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
          <Pressable onPress={() => p.onMonth(null)} style={{ height: 44, borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: p.month ? c.card : c.ink, borderWidth: p.month ? 1.5 : 0, borderColor: c.line }}>
            <Txt w={p.month ? '500' : '700'} size={15} color={p.month ? 'ink' : 'bg'}>All time</Txt>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, backgroundColor: p.month ? c.ink : c.card, borderWidth: p.month ? 0 : 1.5, borderColor: c.line }}>
            <Pressable accessibilityLabel="Previous month" onPress={p.onPrevMonth} style={{ width: 40, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} strokeWidth={2.75} color={p.month ? c.bg : c.ink} />
            </Pressable>
            <Txt w="700" size={15} color={p.month ? 'bg' : 'ink'}>{p.month ? monthLabel(p.month) : 'By month'}</Txt>
            <Pressable accessibilityLabel="Next month" disabled={!p.canNext} onPress={p.onNextMonth} style={{ width: 40, height: '100%', alignItems: 'center', justifyContent: 'center', opacity: p.canNext ? 1 : 0.3 }}>
              <ChevronRight size={18} strokeWidth={2.75} color={p.month ? c.bg : c.ink} />
            </Pressable>
          </View>
        </ScrollView>
        {p.trips.length > 0 && (
          <Txt v="meta">{plural(p.trips.length, 'trip')}{p.hasMore ? '+' : ''} · {formatINR(total)}{p.hasMore ? ' so far' : ''}</Txt>
        )}
      </View>
      <FlatList data={p.trips} keyExtractor={t => t.id} contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={p.loading ? <Txt color="mute" style={{ textAlign: 'center', marginTop: 24 }}>Loading…</Txt>
          : <EmptyState art={<EmojiTile emoji="🧾" size={96} bg="mint" r={30} />} title="No trips here"
              body={p.store || p.month ? 'Try another month or store.' : 'Finished shopping trips show up here.'} />}
        ListFooterComponent={p.hasMore ? (
          <Pressable onPress={p.onMore} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}><Txt w="600" size={15} color="green">Load more</Txt></Pressable>
        ) : null}
        renderItem={({ item: t }) => (
          <SwipeToDelete radius={22} onDelete={close => p.onDelete(t, close)}>
            <Pressable onPress={() => p.onOpen(t.id)}>
              <Card style={{ borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <EmojiTile emoji="🛒" size={44} />
                <View style={{ flex: 1 }}>
                  <Txt w="700" size={16} numberOfLines={1}>{t.store ?? 'Grocery trip'}</Txt>
                  <Txt v="meta" numberOfLines={1}>{when(t.finishedAt ?? t.startedAt)} · {plural(t.itemCount ?? 0, 'item')}{t.listName ? ` · ${t.listName}` : ''}</Txt>
                </View>
                <Txt w="800" size={17}>{formatINR(t.totalPaise ?? 0)}</Txt>
              </Card>
            </Pressable>
          </SwipeToDelete>
        )} />
    </View>
  );
}

export function TripDetailView({ trip, onBack, onDelete, onItem }: { trip: Trip & { items: TripItem[] }; onBack: () => void; onDelete: () => void; onItem: (it: TripItem) => void }) {
  const { c } = useTheme();
  const cart = cartTotal(trip.items);
  const diff = (trip.billTotalPaise ?? cart) - cart;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <IconButton label="Back" onPress={onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        <IconButton label="Delete trip" onPress={onDelete}><Trash2 size={20} strokeWidth={2.25} color={c.chili} /></IconButton>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
        <View style={{ backgroundColor: c.green, borderRadius: 26, paddingVertical: 18, paddingHorizontal: 18 }}>
          <Txt w="600" size={14} color="onGreen" style={{ opacity: 0.85 }}>{trip.store ?? 'Grocery trip'} · {when(trip.finishedAt ?? trip.startedAt)}</Txt>
          <Txt v="hero" size={56} color="onGreen" style={{ lineHeight: 58, marginTop: 6 }}>{formatINR(trip.billTotalPaise ?? cart)}</Txt>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <Pill label={plural(trip.items.length, 'item')} bg="yellow" fg="onYellow" w="700" />
            {diff === 0
              ? <Pill label="✅ Bill matched the cart" bg="onGreenSoft" fg="onGreen" />
              : <Pill label={`Bill was ${formatINR(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than cart`} bg="onGreenSoft" fg="onGreen" />}
          </View>
        </View>
        <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
          <Txt w="700" size={15} style={{ paddingTop: 10, paddingBottom: 2 }}>Items</Txt>
          {trip.items.length === 0 && <Txt v="meta" style={{ paddingVertical: 12 }}>No items were added to the cart.</Txt>}
          {trip.items.map((it, i) => (
            <Pressable key={it.id} accessibilityHint="Shows price history" onPress={() => onItem(it)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
              <EmojiTile emoji={it.product?.emoji ?? '🛒'} size={40} r={12} bg="mint" />
              <View style={{ flex: 1 }}>
                <Txt w="600" size={15}>{it.product?.name ?? 'Item'}</Txt>
                <Txt v="meta">{it.packSize} × {it.qty}{it.brand ? ` · ${it.brand}` : ''} · {formatINR(it.pricePaise)} each</Txt>
              </View>
              <Txt w="800" size={16}>{formatINR(it.qty * it.pricePaise)}</Txt>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

export function PriceHistoryView({ name, rows, onBack }: { name: string; rows: PricePoint[]; onBack: () => void }) {
  const { c } = useTheme();
  const best = cheapest(rows);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
        <IconButton label="Back" onPress={onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        <Txt w="700" size={19} numberOfLines={1} style={{ flex: 1 }}>{name}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12, flexGrow: 1 }}>
        {!rows.length ? (
          <EmptyState art={<EmojiTile emoji="🏷️" size={96} bg="mint" r={30} />} title="No prices yet" body="Prices you enter in the cart show up here, with the store, so you know where it’s cheapest." />
        ) : (
          <>
            {best && (
              <View style={{ backgroundColor: c.green, borderRadius: 26, paddingVertical: 16, paddingHorizontal: 18 }}>
                <Txt w="600" size={14} color="onGreen" style={{ opacity: 0.85 }}>Cheapest you paid · {best.packSize}</Txt>
                <Txt v="hero" size={52} color="onGreen" style={{ lineHeight: 54, marginTop: 4 }}>{formatINR(best.pricePaise)}</Txt>
                <Txt w="600" size={15} color="yellow" style={{ marginTop: 4 }}>{best.store ?? 'Store not noted'} · {when(best.at)}</Txt>
              </View>
            )}
            <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
              <Txt w="700" size={15} style={{ paddingTop: 10, paddingBottom: 2 }}>Every time you bought it</Txt>
              {rows.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderTopWidth: 1, borderTopColor: c.line }}>
                  <View style={{ flex: 1 }}>
                    <Txt w="600" size={15}>{r.store ?? 'Grocery trip'}</Txt>
                    <Txt v="meta">{when(r.at)} · {r.packSize}{r.brand ? ` · ${r.brand}` : ''}</Txt>
                  </View>
                  <Txt w="800" size={16} color={r === best ? 'green' : 'ink'}>{formatINR(r.pricePaise)}</Txt>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}
