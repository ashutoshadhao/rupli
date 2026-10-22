import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import type { ListDetail, Trip, TripItem } from '../../../api';
import { CartView } from '../../../screens/cart';
import { Screen } from '../../../ui/layout';
import { keys, useList, useOnline, useTrip, useWrite } from '../../../query';
import { Txt } from '../../../ui/core';
import { ActionSheet, useConfirm } from '../../../ui/actions';

type T = Trip & { items: TripItem[] };

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(id);
  const listId = trip.data?.listId ?? '';
  const list = useList(listId || null);
  const online = useOnline();
  const qc = useQueryClient();
  const patchTrip = (fn: (t: T) => T) => qc.setQueryData<T>(keys.trip(id), old => old && fn(old));
  // all cart writes are optimistic so the running total updates instantly, even offline
  const write = useWrite({ invalidate: [keys.trip(id), keys.list(listId), keys.openTrip] });
  const cancel = useWrite({ invalidate: [keys.openTrip, keys.lists, keys.list(listId), keys.trips] });
  const [menu, setMenu] = useState(false);
  const [confirmEl, ask] = useConfirm();

  if (!trip.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>{trip.isError ? 'Could not load this trip.' : 'Loading…'}</Txt></Screen>;
  return (
    <Screen>
      <CartView trip={trip.data} listItems={list.data?.items ?? []} offline={!online} onPause={() => setMenu(true)}
        onAddUnlisted={() => router.push(`/list/${listId}/add`)}
        onCounter={() => router.push(`/trip/${id}/bill`)}
        onAddToCart={(it, pricePaise) => {
          const body = { id: Crypto.randomUUID(), productId: it.productId, packSize: it.packSize, brand: it.brand, qty: it.qty, pricePaise, listItemId: it.id };
          patchTrip(t => ({ ...t, items: [...t.items, { ...body, tripId: id, product: it.product }] }));
          write.mutate({ method: 'POST', path: `/v1/trips/${id}/items`, body });
          write.mutate({ method: 'PATCH', path: `/v1/lists/${listId}/items/${it.id}`, body: { checked: true } });
        }}
        onEditPrice={(it, pricePaise) => {
          patchTrip(t => ({ ...t, items: t.items.map(x => (x.id === it.id ? { ...x, pricePaise } : x)) }));
          write.mutate({ method: 'PATCH', path: `/v1/trips/${id}/items/${it.id}`, body: { pricePaise } });
        }}
        onDeleteListItem={it => {
          qc.setQueryData<ListDetail>(keys.list(listId), old => old && { ...old, items: old.items.filter(x => x.id !== it.id) });
          write.mutate({ method: 'DELETE', path: `/v1/lists/${listId}/items/${it.id}` });
        }}
        onRemove={it => {
          patchTrip(t => ({ ...t, items: t.items.filter(x => x.id !== it.id) }));
          write.mutate({ method: 'DELETE', path: `/v1/trips/${id}/items/${it.id}` });
          if (it.listItemId) write.mutate({ method: 'PATCH', path: `/v1/lists/${listId}/items/${it.listItemId}`, body: { checked: false } });
        }} />
      <ActionSheet visible={menu} onClose={() => setMenu(false)} title={trip.data.store ?? 'Shopping trip'}
        subtitle={`${trip.data.items.length} in cart`}
        actions={[
          { label: trip.data.pausedAt ? 'Resume trip' : 'Pause trip', emoji: trip.data.pausedAt ? '▶️' : '⏸️', onPress: () => {
          const paused = !trip.data!.pausedAt;
          patchTrip(t => ({ ...t, pausedAt: paused ? new Date().toISOString() : null }));
          write.mutate({ method: 'POST', path: `/v1/trips/${id}/pause`, body: { paused } });
          } },
          { label: 'Cancel trip', emoji: '🗑️', destructive: true, onPress: async () => {
            if (!(await ask({ title: 'Cancel this trip?', body: 'The cart is cleared and nothing is added to your spend. Your list stays.', confirm: 'Cancel trip', destructive: true }))) return;
            qc.setQueryData(keys.openTrip, null);
            cancel.mutate({ method: 'DELETE', path: `/v1/trips/${id}` });
            router.replace('/');
          } },
        ]} />
      {confirmEl}
    </Screen>
  );
}
