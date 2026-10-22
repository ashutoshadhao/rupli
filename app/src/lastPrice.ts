import { useMemo } from 'react';
import { useLastPrices } from './query';
import type { LastPrice } from './screens/picker';

export function useLastPriceLookup(): LastPrice {
  const { data } = useLastPrices();
  return useMemo(() => {
    const m = new Map((data ?? []).map(r => [`${r.productId}|${r.packSize}`, r]));
    return (id, pack) => m.get(`${id}|${pack}`) ?? null;
  }, [data]);
}
