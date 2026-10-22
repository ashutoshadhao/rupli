import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ListsView } from '../../screens/lists';
import { Screen } from '../../ui/layout';
import { useConfirm } from '../../ui/actions';
import { keys, useCall, useLists, useWrite } from '../../query';
import type { ListSummary } from '../../api';
import { copyName, defaultListName, previousMonthList } from '../../logic/lists';
import { monthKey } from '../../logic/month';
import { withAlert } from '../../alert';

export default function Lists() {
  const lists = useLists();
  const call = useCall();
  const qc = useQueryClient();
  const write = useWrite({ invalidate: [keys.lists] });
  const [confirmEl, ask] = useConfirm();
  const prev = previousMonthList(lists.data ?? []);
  const month = monthKey(new Date());
  const open = (l: ListSummary) => router.push(`/list/${l.id}`);
  return (
    <Screen>
      <ListsView lists={lists.data ?? []} canCopy={!!prev}
        onOpen={id => router.push(`/list/${id}`)}
        onNew={withAlert('Could not create the list', async () => open(await call<ListSummary>('POST', '/v1/lists', { name: defaultListName(), month }, [keys.lists])))}
        onCopy={withAlert('Could not copy the list', async () => { if (prev) open(await call<ListSummary>('POST', `/v1/lists/${prev.id}/copy`, { name: copyName(prev.name, month), month }, [keys.lists])); })}
        onDelete={async ids => {
          const ok = await ask({
            title: ids.length === 1 ? 'Delete this list?' : `Delete ${ids.length} lists?`,
            body: 'Items on the list are removed. Finished trips and their spend stay in your history.',
            confirm: 'Delete', destructive: true,
          });
          if (!ok) return false;
          qc.setQueryData<ListSummary[]>(keys.lists, old => old?.filter(l => !ids.includes(l.id)));
          for (const id of ids) write.mutate({ method: 'DELETE', path: `/v1/lists/${id}` });
          return true;
        }} />
      {confirmEl}
    </Screen>
  );
}
