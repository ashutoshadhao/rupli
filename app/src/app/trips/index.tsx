import { useDeferredValue, useState } from 'react';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../api';
import { TripsView, type TripRow } from '../../screens/trips';
import { Screen } from '../../ui/layout';
import { useConfirm } from '../../ui/actions';
import { keys, useWrite } from '../../query';
import { monthKey, shiftMonth } from '../../logic/month';

const PAGE = 30;

export default function AllTrips() {
  const api = useApi();
  const qc = useQueryClient();
  const now = monthKey(new Date());
  const [month, setMonth] = useState<string | null>(null);
  const [store, setStore] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const storeQ = useDeferredValue(store.trim());
  const params = new URLSearchParams({ limit: String(limit + 1), ...(month && { month }), ...(storeQ && { store: storeQ }) });
  const key = ['trips', 'all', month, storeQ, limit];
  const trips = useQuery({ queryKey: key, queryFn: () => api<TripRow[]>('GET', `/v1/trips?${params}`) });
  const write = useWrite({ invalidate: [keys.trips, ['spend'], keys.lists, keys.prices] });
  const [confirmEl, ask] = useConfirm();
  const rows = trips.data ?? [];
  return (
    <Screen>
      <TripsView trips={rows.slice(0, limit)} hasMore={rows.length > limit} loading={trips.isLoading}
        month={month} store={store} canNext={!!month && month < now}
        onBack={() => router.back()}
        onMonth={m => { setMonth(m); setLimit(PAGE); }}
        onPrevMonth={() => { setMonth(m => shiftMonth(m ?? shiftMonth(now, 1), -1)); setLimit(PAGE); }}
        onNextMonth={() => { setMonth(m => (m ? shiftMonth(m, 1) : now)); setLimit(PAGE); }}
        onStore={s => { setStore(s); setLimit(PAGE); }}
        onMore={() => setLimit(l => l + PAGE)}
        onOpen={id => router.push(`/trips/${id}`)}
        onDelete={async (t, close) => {
          if (!(await ask({ title: 'Delete this trip?', body: `${t.store ?? 'This trip'} and its spend are removed from your history.`, confirm: 'Delete', destructive: true }))) return close();
          qc.setQueryData<TripRow[]>(key, old => old?.filter(x => x.id !== t.id));
          write.mutate({ method: 'DELETE', path: `/v1/trips/${t.id}` });
        }} />
      {confirmEl}
    </Screen>
  );
}
