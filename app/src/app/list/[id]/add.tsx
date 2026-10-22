import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import type { ListDetail, Product } from '../../../api';
import { PickerView } from '../../../screens/picker';
import type { Pick } from '../../../logic/picker';
import { Screen } from '../../../ui/layout';
import { keys, useCall, useList, useProducts, useUsual, useWrite } from '../../../query';
import { useLastPriceLookup } from '../../../lastPrice';
import { monthShort } from '../../../logic/month';

export default function AddToList() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  const list = useList(id);
  const products = useProducts();
  const usual = useUsual();
  const lastPrice = useLastPriceLookup();
  const qc = useQueryClient();
  const call = useCall();
  // queued like cart writes: works offline (e.g. "Add item not on list" in a basement store)
  const write = useWrite({ invalidate: [keys.list(id), keys.lists, keys.usual] });
  // reads the caches at call time: it also runs on unmount, when render-time values are stale
  const save = (picks: Pick[]) => {
    const existing = qc.getQueryData<ListDetail>(keys.list(id))?.items ?? [];
    const catalog = qc.getQueryData<Product[]>(keys.products) ?? [];
    for (const p of picks) {
      const same = existing.find(i => i.productId === p.productId && i.packSize === p.packSize);
      if (same) {
        const patch = { qty: same.qty + p.qty, brand: p.brand };
        qc.setQueryData<ListDetail>(keys.list(id), old => old && { ...old, items: old.items.map(i => (i.id === same.id ? { ...i, ...patch } : i)) });
        write.mutate({ method: 'PATCH', path: `/v1/lists/${id}/items/${same.id}`, body: patch });
      } else {
        const prod = catalog.find(x => x.id === p.productId);
        const item = { ...p, id: Crypto.randomUUID() };
        const last = lastPrice(p.productId, p.packSize);
        qc.setQueryData<ListDetail>(keys.list(id), old => old && prod ? {
          ...old, items: [...old.items, {
            ...item, listId: id, checked: false, position: old.items.length, lastPricePaise: last?.pricePaise ?? null, lastBrand: last?.brand ?? null,
            product: { id: prod.id, name: prod.name, aliases: prod.aliases, emoji: prod.emoji, category: prod.category },
          }],
        } : old);
        write.mutate({ method: 'POST', path: `/v1/lists/${id}/items`, body: item });
      }
    }
  };
  const title = list.data?.month ? `Add to ${monthShort(list.data.month)} list` : 'Add to list';
  return (
    <Screen edges={['top', 'bottom']}>
      <PickerView title={title} products={products.data ?? []} usualIds={usual.data ?? []} lastPrice={lastPrice} initialQuery={q}
        onClose={() => router.back()}
        onCreate={async draft => {
          const p = await call<Product>('POST', '/v1/products', draft);
          // so the tile and the optimistic list row can find it before the catalog refetches
          qc.setQueryData<Product[]>(keys.products, old => [...(old ?? []), p]);
          return p;
        }}
        onDone={picks => { save(picks); router.back(); }}
        onLeave={save} />
    </Screen>
  );
}
