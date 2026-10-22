import { useCallback, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { QueryClient, onlineManager, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { isOnline, WRITE_OPTIONS } from './logic/sync';
import { useApi, type Category, type ListDetail, type ListSummary, type PricePoint, type Product, type Recurring, type Spend, type Trip, type TripItem } from './api';

onlineManager.setEventListener(setOnline => NetInfo.addEventListener(s => setOnline(isOnline(s))));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 7 * 24 * 3600_000, staleTime: 30_000, networkMode: 'offlineFirst', retry: 2 },
    mutations: { ...WRITE_OPTIONS, mutationKey: undefined },
  },
});
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'rupli-cache' });

// paused (offline) mutations survive an app restart when their mutationFn is registered by key
function MutationDefaults() {
  const api = useApi();
  useEffect(() => {
    queryClient.setMutationDefaults(['api'], { ...WRITE_OPTIONS, mutationFn: ({ method, path, body }: Req) => api(method, path, body) });
  }, [api]);
  return null;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 7 * 24 * 3600_000 }}
      onSuccess={() => queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())}>
      <MutationDefaults />
      {children}
    </PersistQueryClientProvider>
  );
}

export const useOnline = () => isOnline(useNetInfo());

type Req = { method: string; path: string; body?: unknown };

function useGet<T>(key: QueryKey, path: string | null) {
  const api = useApi();
  return useQuery<T>({ queryKey: key, queryFn: () => api<T>('GET', path!), enabled: path !== null });
}

// every write goes through the ['api'] mutation key so it can be replayed after a restart
export function useWrite<T = unknown>(opts: { invalidate?: QueryKey[]; optimistic?: (req: Req) => void } = {}) {
  const qc = useQueryClient();
  const keys = opts.invalidate ?? [];
  return useMutation<T, Error, Req>({
    ...WRITE_OPTIONS, mutationKey: [...WRITE_OPTIONS.mutationKey],
    // stop an in-flight refetch from overwriting the optimistic change
    onMutate: async req => { await Promise.all(keys.map(k => qc.cancelQueries({ queryKey: k }))); opts.optimistic?.(req); },
    // refetch only once the queue drains, so a half-synced server state never replaces the screen
    onSettled: () => qc.isMutating({ mutationKey: ['api'] }) <= 1
      ? Promise.all(keys.map(k => qc.invalidateQueries({ queryKey: k }))) : undefined,
  });
}

export const keys = {
  lists: ['lists'] as const, list: (id: string) => ['list', id] as const, products: ['products'] as const,
  usual: ['usual'] as const, categories: ['categories'] as const, spend: (m: string) => ['spend', m] as const,
  trips: ['trips'] as const, recurring: ['recurring'] as const, history: (id: string) => ['history', id] as const, prices: ['prices'] as const, openTrip: ['trip', 'open'] as const, trip: (id: string) => ['trip', id] as const,
};

export const useLists = () => useGet<ListSummary[]>(keys.lists, '/v1/lists');
export const useList = (id: string | null) => useGet<ListDetail>(keys.list(id ?? ''), id ? `/v1/lists/${id}` : null);
export const useProducts = () => useGet<Product[]>(keys.products, '/v1/products');
export const useUsual = () => useGet<string[]>(keys.usual, '/v1/products/usual');
export const useCategories = () => useGet<Category[]>(keys.categories, '/v1/categories');
export const useSpend = (month: string) => useGet<Spend>(keys.spend(month), `/v1/spend?month=${month}`);
export const useRecentTrips = () => useGet<Trip[]>(keys.trips, '/v1/trips?limit=3');
export const useOpenTrip = () => useGet<(Trip & { items: TripItem[] }) | null>(keys.openTrip, '/v1/trips/open');
export interface LastPriceRow { productId: string; packSize: string; pricePaise: number; brand: string | null; at: string }
export const useLastPrices = () => useGet<LastPriceRow[]>(keys.prices, '/v1/prices/last');
export const useRecurring = () => useGet<Recurring[]>(keys.recurring, '/v1/recurring');
export const usePriceHistory = (productId: string) => useGet<PricePoint[]>(keys.history(productId), `/v1/products/${productId}/prices`);
export const useTrip = (id: string) => useGet<Trip & { items: TripItem[] }>(keys.trip(id), `/v1/trips/${id}`);

// awaitable call for flows that need the server's answer (create list, start trip, finish)
export function useCall() {
  const api = useApi();
  const qc = useQueryClient();
  return useCallback(async <T,>(method: string, path: string, body?: unknown, invalidate: QueryKey[] = []) => {
    const r = await api<T>(method, path, body);
    await Promise.all(invalidate.map(k => qc.invalidateQueries({ queryKey: k })));
    return r;
  }, [api, qc]);
}
