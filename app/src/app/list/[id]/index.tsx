import { useEffect, useRef, useState } from 'react';
import { Linking, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ListDetail, ListSummary } from '../../../api';
import { ListDetailView } from '../../../screens/lists';
import { Screen } from '../../../ui/layout';
import { ActionSheet, useConfirm } from '../../../ui/actions';
import { keys, useCall, useList, useWrite } from '../../../query';
import { withAlert } from '../../../alert';
import { useStartShopping } from '../../../shopping';
import { Txt } from '../../../ui/core';
import { deletable, listTitle, shareText } from '../../../logic/lists';
import { plural } from '../../../logic/text';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useList(id);
  const qc = useQueryClient();
  const { start, sheet: storeSheet } = useStartShopping();
  const [menu, setMenu] = useState(false);
  const [confirmEl, ask] = useConfirm();
  const call = useCall();
  // optimistic: patch the cached list immediately, sync in the background (works offline)
  const write = useWrite({
    invalidate: [keys.list(id), keys.lists],
    optimistic: ({ body, path, method }) => qc.setQueryData<ListDetail>(keys.list(id), old => old && ({
      ...old,
      items: method === 'DELETE' ? old.items.filter(i => !path.endsWith(i.id)) : old.items.map(i => (path.endsWith(i.id) ? { ...i, ...(body as object) } : i)),
    })),
  });
  const removeList = (verb: 'DELETE' | 'PATCH') => {
    qc.setQueryData<ListSummary[]>(keys.lists, old => old?.filter(l => l.id !== id));
    write.mutate(verb === 'DELETE' ? { method: 'DELETE', path: `/v1/lists/${id}` } : { method: 'PATCH', path: `/v1/lists/${id}`, body: { archived: true } });
  };

  // a list left with nothing on it isn't kept
  const latest = useRef(list.data);
  useEffect(() => { latest.current = list.data; }, [list.data]);
  useEffect(() => () => {
    const l = latest.current;
    if (l && l.items.length === 0 && deletable(l) && l.owner !== false) removeList('DELETE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!list.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>{list.isError ? 'Could not load this list.' : 'Loading…'}</Txt></Screen>;
  const l = list.data;
  return (
    <Screen>
      <ListDetailView list={l}
        onBack={() => router.back()}
        onMore={() => setMenu(true)}
        onAdd={() => router.push(`/list/${id}/add`)}
        onStart={() => start(id)}
        onToggle={it => write.mutate({ method: 'PATCH', path: `/v1/lists/${id}/items/${it.id}`, body: { checked: !it.checked } })}
        onQty={(it, qty) => write.mutate({ method: 'PATCH', path: `/v1/lists/${id}/items/${it.id}`, body: { qty } })}
        onItem={it => router.push({ pathname: '/product/[id]', params: { id: it.productId, name: it.product.name } })}
        onDeleteItem={async (it, close) => {
          if (await ask({ title: `Remove ${it.product.name}?`, body: `${it.packSize} × ${it.qty} comes off this list.`, confirm: 'Remove', destructive: true })) {
            write.mutate({ method: 'DELETE', path: `/v1/lists/${id}/items/${it.id}` });
          } else close();
        }} />
      <ActionSheet visible={menu} onClose={() => setMenu(false)} title={listTitle(l)} subtitle={plural(l.items.length, 'item')}
        actions={[
          { label: 'Share on WhatsApp', emoji: '💬', onPress: () => {
            const text = shareText(l);
            Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`).catch(() => Share.share({ message: text }));
          } },
          ...(l.owner !== false ? [{ label: l.memberCount ? `Family · ${plural(l.memberCount, 'member')}` : 'Shop together with family', emoji: '👪',
            onPress: withAlert('Could not get a family code', async () => {
              const { code } = await call<{ code: string }>('POST', `/v1/lists/${id}/share`);
              if (await ask({ title: `Family code: ${code}`, body: 'On their phone: Rupli → tap the avatar on Home → “Join a family list” → type this code. You both edit the same list.', confirm: 'Send code' })) {
                await Share.share({ message: `Join my Rupli list “${listTitle(l)}”. Open Rupli → avatar → Join a family list → code ${code}` });
              }
            }) }] : [{ label: 'Leave this list', emoji: '🚪', destructive: true, onPress: async () => {
              if (!(await ask({ title: 'Leave this list?', body: 'It disappears from your Lists. The owner keeps it.', confirm: 'Leave', destructive: true }))) return;
              qc.setQueryData<ListSummary[]>(keys.lists, old => old?.filter(x => x.id !== id));
              write.mutate({ method: 'POST', path: `/v1/lists/${id}/leave` });
              router.back();
            } }]),
          ...(l.owner === false ? [] : [{ label: 'Archive list', emoji: '🗄️', onPress: async () => {
            if (await ask({ title: 'Archive this list?', body: 'It disappears from Lists. Its trips and spend stay.', confirm: 'Archive' })) { removeList('PATCH'); router.back(); }
          } }]),
          ...(deletable(l) && l.owner !== false ? [{ label: 'Delete list', emoji: '🗑️', destructive: true, onPress: async () => {
            if (await ask({ title: 'Delete this list?', body: 'Items on the list are removed. Finished trips and their spend stay in your history.', confirm: 'Delete', destructive: true })) { removeList('DELETE'); router.back(); }
          } }] : []),
        ]} />
      {confirmEl}
      {storeSheet}
    </Screen>
  );
}
