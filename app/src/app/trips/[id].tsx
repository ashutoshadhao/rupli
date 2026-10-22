import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type { Trip } from '../../api';
import { TripDetailView } from '../../screens/trips';
import { Screen } from '../../ui/layout';
import { Txt } from '../../ui/core';
import { useConfirm } from '../../ui/actions';
import { keys, useTrip, useWrite } from '../../query';

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const qc = useQueryClient();
  const write = useWrite({ invalidate: [keys.trips, ['spend'], keys.lists, keys.prices] });
  const [confirmEl, ask] = useConfirm();
  if (!trip.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>{trip.isError ? 'This trip was deleted.' : 'Loading…'}</Txt></Screen>;
  return (
    <Screen>
      <TripDetailView trip={trip.data} onBack={() => router.back()}
        onItem={it => router.push({ pathname: '/product/[id]', params: { id: it.productId, name: it.product?.name ?? 'Item' } })}
        onDelete={async () => {
          if (!(await ask({ title: 'Delete this trip?', body: 'The trip and its spend are removed from your history.', confirm: 'Delete', destructive: true }))) return;
          qc.setQueriesData<Trip[]>({ queryKey: keys.trips }, old => (Array.isArray(old) ? old.filter(t => t.id !== id) : old));
          write.mutate({ method: 'DELETE', path: `/v1/trips/${id}` });
          router.back();
        }} />
      {confirmEl}
    </Screen>
  );
}
