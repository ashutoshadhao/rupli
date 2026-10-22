import { Pressable, ScrollView, View } from 'react-native';
import { ArrowRight, ShoppingCart } from 'lucide-react-native';
import { formatINR } from '@rupli/shared';
import type { ListSummary, Trip } from '../api';
import { listTitle } from '../logic/lists';
import { dayMonth, monthName, monthShort } from '../logic/month';
import { useTheme } from '../theme';
import { Card, EmojiTile, Pill, PrimaryButton, Progress, Txt } from '../ui/core';
import { plural } from '../logic/text';
import { budgetStatus } from '../logic/spend';

export interface HomeProps {
  firstName: string; initials: string; month: string; prevMonth: string; totalPaise: number; prevTotalPaise: number;
  activeList: ListSummary | null; trips: Trip[]; budgetPaise: number | null; onBudget: () => void;
  onStart: () => void; onOpenList: (id: string) => void; onCompare: () => void; onSpend: () => void; onAvatar: () => void;
  onAllTrips: () => void; onOpenTrip: (id: string) => void; onNewList: () => void;
}

const tripMeta = (t: Trip) =>
  `${dayMonth(t.finishedAt ?? t.startedAt)} · ${plural(t.itemCount ?? 0, 'item')}`;

export function HomeView(p: HomeProps) {
  const { c } = useTheme();
  const diff = p.totalPaise - p.prevTotalPaise;
  const budget = budgetStatus(p.totalPaise, p.budgetPaise);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <View>
          <Txt size={14} color="mute">Namaste,</Txt>
          <Txt w="700" size={20} style={{ lineHeight: 22 }}>{p.firstName}</Txt>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={p.onAvatar}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.yellow, alignItems: 'center', justifyContent: 'center' }}>
          <Txt w="800" size={16} color="onYellow">{p.initials}</Txt>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 }}>
        <View style={{ backgroundColor: c.green, borderRadius: 28, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -18, top: -18, width: 120, height: 120, borderRadius: 60, backgroundColor: c.yellow, opacity: 0.22 }} />
          <Txt w="500" size={15} color="onGreen" style={{ opacity: 0.9 }}>{monthName(p.month)} grocery spend</Txt>
          <Txt v="hero" color="onGreen" style={{ marginTop: 8 }} numberOfLines={1}>{formatINR(p.totalPaise)}</Txt>
          {p.prevTotalPaise > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <Pill label={`${diff <= 0 ? '▼' : '▲'} ${formatINR(Math.abs(diff))} ${diff <= 0 ? 'less' : 'more'}`} bg="yellow" fg="onYellow" w="700" size={14} />
              <Txt size={14} color="onGreen" style={{ opacity: 0.85 }}>than {monthShort(p.prevMonth)} · {formatINR(p.prevTotalPaise)}</Txt>
            </View>
          )}
          {budget ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Change budget" onPress={p.onBudget} style={{ marginTop: 14, gap: 8 }}>
              <Progress pct={Math.min(budget.pct, 100)} track="onGreenTrack" fill={budget.level === 'ok' ? 'yellow' : 'chili'} h={10} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Txt w="600" size={14} color={budget.level === 'ok' ? 'onGreen' : 'yellow'}>
                  {budget.level === 'over' ? `⚠️ ${formatINR(-budget.leftPaise)} over budget` : budget.level === 'warn' ? `⚠️ ${budget.pct}% used · ${formatINR(budget.leftPaise)} left` : `${formatINR(budget.leftPaise)} left`}
                </Txt>
                <Txt size={13} color="onGreen" style={{ opacity: 0.85 }}>of {formatINR(p.budgetPaise!)}</Txt>
              </View>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={p.onBudget} hitSlop={8} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
              <Txt w="700" size={14} color="yellow">＋ Set a monthly budget</Txt>
            </Pressable>
          )}
        </View>

        {p.activeList && (
          <Pressable onPress={() => p.onOpenList(p.activeList!.id)}>
            <Card style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Pill label={listTitle(p.activeList)} style={{ flexShrink: 1 }} />
                <Txt size={14} color="mute">Est. <Txt w="700" size={14}>{p.activeList.estimatePaise ? formatINR(p.activeList.estimatePaise) : '—'}</Txt></Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Txt v="num">{p.activeList.checkedCount}</Txt>
                  <Txt w="600" size={17} color="mute">/{plural(p.activeList.itemCount, 'item')}</Txt>
                </View>
                <Txt w="700" size={15} color="green">Open list →</Txt>
              </View>
              <Progress pct={p.activeList.itemCount ? (p.activeList.checkedCount / p.activeList.itemCount) * 100 : 0} />
            </Card>
          </Pressable>
        )}

        {!p.activeList && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <EmojiTile emoji="📝" size={52} bg="chiliSoft" r={16} />
            <View style={{ flex: 1 }}>
              <Txt w="700" size={17}>Plan this month’s kirana</Txt>
              <Txt v="meta">Pick milk, atta, dal… in a few taps</Txt>
            </View>
            <Pressable accessibilityRole="button" onPress={p.onNewList} style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: c.green, justifyContent: 'center' }}>
              <Txt w="700" size={15} color="onGreen">Make a list</Txt>
            </Pressable>
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[{ e: '⚖️', t: 'Compare', s: 'Price per kg or L', bg: c.mint, on: p.onCompare }, { e: '📊', t: 'Spend', s: '6-month trend', bg: c.soft, on: p.onSpend }].map(q => (
            <Pressable key={q.t} accessibilityRole="button" onPress={q.on}
              style={{ flex: 1, backgroundColor: q.bg, borderRadius: 22, padding: 14, height: 96, justifyContent: 'space-between' }}>
              <Txt size={26}>{q.e}</Txt>
              <View><Txt w="700" size={17}>{q.t}</Txt><Txt v="meta">{q.s}</Txt></View>
            </Pressable>
          ))}
        </View>

        {p.trips.length > 0 && (
          <Card pad={0} style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, paddingBottom: 4 }}>
              <Txt w="700" size={15}>Recent trips</Txt>
              <Pressable accessibilityRole="button" onPress={p.onAllTrips} hitSlop={12}><Txt w="600" size={14} color="green">See all</Txt></Pressable>
            </View>
            {p.trips.map(t => (
              <Pressable key={t.id} onPress={() => p.onOpenTrip(t.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderTopWidth: 1, borderTopColor: c.line }}>
                <EmojiTile emoji="🛒" size={40} r={12} />
                <View style={{ flex: 1 }}>
                  <Txt w="600" size={15}>{t.store ?? 'Grocery trip'}</Txt>
                  <Txt v="meta">{tripMeta(t)}</Txt>
                </View>
                <Txt w="800" size={17}>{formatINR(t.totalPaise ?? 0)}</Txt>
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
        <PrimaryButton label="Start shopping" height={62} onPress={p.onStart}
          left={<ShoppingCart size={24} strokeWidth={2.25} color={c.onYellow} />}
          right={<ArrowRight size={22} strokeWidth={2.5} color={c.onYellow} />} />
      </View>
    </View>
  );
}
