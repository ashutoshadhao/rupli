import { useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BillView } from '../../../screens/cart';
import { Screen } from '../../../ui/layout';
import { keys, useOnline, useTrip, useWrite } from '../../../query';
import { ApiError } from '../../../api';
import { useLastPriceLookup } from '../../../lastPrice';
import { monthKey, monthName } from '../../../logic/month';
import { Txt } from '../../../ui/core';

export default function Bill() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const lastPrice = useLastPriceLookup();
  const online = useOnline();
  const finish = useWrite({ invalidate: [keys.openTrip, keys.trips, keys.lists, keys.prices, ['spend'], keys.usual] });
  const [busy, setBusy] = useState(false);
  if (!trip.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>Loading…</Txt></Screen>;
  return (
    <Screen>
      <BillView monthName={monthName(monthKey(new Date()))} items={trip.data.items} busy={busy}
        lastPaise={(p, pack) => lastPrice(p, pack)?.pricePaise ?? null}
        onBack={() => router.back()}
        onEdit={() => router.back()}
        onAddMissed={() => trip.data?.listId && router.push(`/list/${trip.data.listId}/add`)}
        onFinish={async billTotalPaise => {
          if (!online) Alert.alert('Finishing when you are back online', 'Your cart is saved. Rupli will finish the trip as soon as there is network.');
          setBusy(true);
          const done = () => { router.dismissAll(); router.replace('/'); };
          try {
            // queued behind any unsynced cart items, so the bill always lands after them
            await finish.mutateAsync({ method: 'POST', path: `/v1/trips/${id}/finish`, body: { billTotalPaise } });
            done();
          } catch (e) {
            if (e instanceof ApiError && e.code === 'trip_finished') return done(); // an earlier attempt got through
            Alert.alert('Could not finish the trip', e instanceof Error ? e.message : 'Try again.');
          } finally { setBusy(false); }
        }} />
    </Screen>
  );
}
