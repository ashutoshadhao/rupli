import { router } from 'expo-router';
import { CompareView } from '../../screens/compare';
import { Screen } from '../../ui/layout';
import { searchProducts } from '@rupli/shared';
import { keys, useCall, useLists, useProducts } from '../../query';
import type { ListSummary } from '../../api';
import { activeList, defaultListName } from '../../logic/lists';
import { monthKey } from '../../logic/month';
import { withAlert } from '../../alert';

export default function Compare() {
  const lists = useLists();
  const call = useCall();
  const products = useProducts();
  return (
    <Screen>
      <CompareView onAddWinner={withAlert('Could not open a list', async (name: string) => {
        const target = activeList(lists.data ?? [])
          ?? await call<ListSummary>('POST', '/v1/lists', { name: defaultListName(), month: monthKey(new Date()) }, [keys.lists]);
        // "Fortune Sunflower 5 L" → first word that finds a product ("Sunflower"), else the whole name
        const q = name.split(/\s+/).find(w => w.length > 2 && searchProducts(w, products.data ?? []).length > 0) ?? name;
        router.push({ pathname: '/list/[id]/add', params: { id: target.id, q } });
      })} />
    </Screen>
  );
}
