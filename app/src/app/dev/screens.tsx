import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, BottomNav } from '../../ui/layout';
import { Chip } from '../../ui/core';
import { HomeView } from '../../screens/home';
import { ListsView, ListDetailView } from '../../screens/lists';
import { SAMPLE } from '../../screens/sample';
import { PickerView } from '../../screens/picker';
import { BillView, CartView } from '../../screens/cart';
import { CompareView } from '../../screens/compare';
import { SpendView, TxnDetailView } from '../../screens/spend';
import { PriceHistoryView, TripDetailView, TripsView } from '../../screens/trips';

const noop = () => {};
// lets browser tests observe swipe-to-delete in the gallery
const record = (x: string) => { const g = globalThis as { __swiped?: string[] }; g.__swiped = [...(g.__swiped ?? []), x]; };
const SCREENS: Record<string, { tab?: string; el: () => React.ReactElement }> = {
  home: { tab: 'index', el: () => <HomeView {...SAMPLE.home} onStart={noop} onOpenList={noop} onCompare={noop} onSpend={noop} onAvatar={noop} onAllTrips={noop} onOpenTrip={noop} onNewList={noop} budgetPaise={1000000} onBudget={noop} /> },
  lists: { tab: 'lists', el: () => <ListsView lists={SAMPLE.lists} canCopy onOpen={noop} onNew={noop} onCopy={noop} onDelete={async ids => { ids.forEach(record); return true; }} /> },
  'lists-empty': { tab: 'lists', el: () => <ListsView lists={[]} canCopy={false} onOpen={noop} onNew={noop} onCopy={noop} onDelete={async () => true} /> },
  picker: { el: () => <PickerView title="Add to Oct list" products={SAMPLE.products} usualIds={SAMPLE.usual} lastPrice={SAMPLE.lastPrice} onClose={noop} onDone={noop} /> },
  cart: { el: () => <CartDemo /> },
  bill: { el: () => <BillView monthName="October" items={SAMPLE.trip.items} lastPaise={(p) => (p === 'p3' ? 16500 : null)} onBack={noop} onEdit={noop} onAddMissed={noop} onFinish={noop} /> },
  compare: { tab: 'compare', el: () => <CompareView onAddWinner={noop} /> },
  spend: { tab: 'spend', el: () => <SpendView month="2026-10" spend={SAMPLE.spend} canNext={false} onPrev={noop} onNext={noop} onOpen={noop} onAdd={noop} /> },
  'spend-empty': { tab: 'spend', el: () => <SpendView month="2026-10" spend={{ ...SAMPLE.spend, totalPaise: 0, allPaise: 0, transactions: [] }} canNext={false} onPrev={noop} onNext={noop} onOpen={noop} onAdd={noop} /> },
  txn: { el: () => <TxnDetailView txn={SAMPLE.spend.transactions[0]!} categories={SAMPLE.categories} onBack={noop} onSave={noop} /> },
  trips: { el: () => <TripsView trips={SAMPLE.trips.map(t => ({ ...t, listName: 'Sep 2026 · Monthly Kirana' }))} loading={false} month="2026-09" store="" canNext hasMore={false}
    onBack={noop} onMonth={noop} onPrevMonth={noop} onNextMonth={noop} onStore={noop} onOpen={noop} onDelete={(t, close) => { record(t.store ?? t.id); close(); }} onMore={noop} /> },
  'trip-detail': { el: () => <TripDetailView trip={{ ...SAMPLE.trip, finishedAt: '2026-09-28T12:00:00Z', billTotalPaise: 164200 }} onBack={noop} onDelete={noop} onItem={noop} /> },
  'price-history': { el: () => <PriceHistoryView name="Sunflower oil" onBack={noop} rows={[
    { packSize: '5 L', pricePaise: 78000, brand: 'Fortune', store: 'DMart', at: '2026-09-28T12:00:00Z' },
    { packSize: '5 L', pricePaise: 74500, brand: 'Fortune', store: 'Reliance Smart', at: '2026-08-26T12:00:00Z' },
    { packSize: '5 L', pricePaise: 81000, brand: 'Saffola', store: 'Local kirana', at: '2026-07-24T12:00:00Z' },
  ]} /> },
  'list-detail': { el: () => <ListDetailView list={SAMPLE.listDetail} onBack={noop} onMore={noop} onAdd={noop} onStart={noop} onToggle={noop} onQty={noop} onItem={noop} onDeleteItem={(it, close) => { (globalThis as { __swiped?: string[] }).__swiped = [...((globalThis as { __swiped?: string[] }).__swiped ?? []), it.product.name]; close(); }} /> },
};

// stateful so swipe-to-delete visibly removes rows and moves the total
function CartDemo() {
  const [trip, setTrip] = useState(SAMPLE.trip);
  const [items, setItems] = useState(SAMPLE.listDetail.items);
  return <CartView trip={trip} listItems={items} offline onPause={noop} onAddUnlisted={noop} onCounter={noop} onAddToCart={noop} onEditPrice={noop}
    onRemove={it => setTrip(t => ({ ...t, items: t.items.filter(x => x.id !== it.id) }))}
    onDeleteListItem={it => setItems(xs => xs.filter(x => x.id !== it.id))} />;
}

// dev gallery: /dev/screens?s=home
export default function Gallery() {
  const params = useLocalSearchParams<{ s?: string }>();
  const [s, setS] = useState(params.s ?? 'home');
  const cur = SCREENS[s] ?? SCREENS.home!;
  return (
    <Screen>
      <View style={{ height: 56 }}>
        <ScrollView horizontal contentContainerStyle={{ gap: 6, padding: 6 }}>
          {Object.keys(SCREENS).map(k => <Chip key={k} label={k} height={44} selected={k === s} onPress={() => setS(k)} />)}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>{cur.el()}</View>
      {cur.tab && <BottomNav active={cur.tab} onPress={noop} />}
    </Screen>
  );
}
