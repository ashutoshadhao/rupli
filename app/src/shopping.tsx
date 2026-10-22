import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Store } from 'lucide-react-native';
import type { ListSummary, Trip } from './api';
import { keys, useCall, useRecentTrips } from './query';
import { dayMonth, monthKey } from './logic/month';
import { withAlert } from './alert';
import { font, useTheme } from './theme';
import { Chip, PrimaryButton, SecondaryButton, Txt } from './ui/core';
import { Sheet } from './ui/layout';

const COMMON_STORES = ['DMart', 'Reliance Smart', 'Star Bazaar', 'More', 'Local kirana'];

function StoreSheet({ visible, stores, onPick, onClose }: { visible: boolean; stores: string[]; onPick: (s: string | null) => void; onClose: () => void }) {
  const { c } = useTheme();
  const [other, setOther] = useState('');
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ gap: 14, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Store size={24} strokeWidth={2.25} color={c.green} />
          <Txt v="section" size={22}>Where are you shopping?</Txt>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {stores.map(s => <Chip key={s} label={s} onPress={() => onPick(s)} />)}
        </View>
        <TextInput value={other} onChangeText={setOther} placeholder="Other store" placeholderTextColor={c.mute} maxLength={80}
          returnKeyType="go" onSubmitEditing={() => other.trim() && onPick(other.trim())}
          style={{ height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: 16, fontSize: 16, fontFamily: font.regular, color: c.ink }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SecondaryButton label="Skip" height={56} onPress={() => onPick(null)} style={{ flex: 1 }} />
          <PrimaryButton label="Start" height={56} center disabled={!other.trim()} onPress={() => onPick(other.trim())} style={{ flex: 1.4 }} />
        </View>
      </View>
    </Sheet>
  );
}

// resume the open trip, else ask the store and start one; a trip always has a list so "add item not on list" has somewhere to go
export function useStartShopping() {
  const call = useCall();
  const recent = useRecentTrips();
  const [pending, setPending] = useState<{ listId?: string } | null>(null);
  const stores = [...new Set([...(recent.data ?? []).map(t => t.store).filter((s): s is string => !!s), ...COMMON_STORES])].slice(0, 7);

  const begin = withAlert('Could not start shopping', async (listId: string | undefined, store: string | null) => {
    const id = listId ?? (await call<ListSummary>('POST', '/v1/lists', {
      name: `Quick trip · ${dayMonth(new Date().toISOString())}`, month: monthKey(new Date()),
    })).id;
    const trip = await call<Trip>('POST', '/v1/trips', { listId: id, ...(store && { store }) }, [keys.lists, keys.openTrip]);
    router.push(`/trip/${trip.id}`);
  });

  const start = withAlert('Could not start shopping', async (listId?: string) => {
    const open = await call<Trip | null>('GET', '/v1/trips/open');
    if (open) return router.push(`/trip/${open.id}`);
    setPending({ listId });
  });

  const sheet = (
    <StoreSheet visible={!!pending} stores={stores} onClose={() => setPending(null)}
      onPick={store => { const p = pending; setPending(null); if (p) begin(p.listId, store); }} />
  );
  return { start, sheet };
}
