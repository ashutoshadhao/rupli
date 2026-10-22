import { useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TxnDetailView } from '../../screens/spend';
import { Screen } from '../../ui/layout';
import { Txt } from '../../ui/core';
import { useCall, useCategories, useSpend } from '../../query';
import { useConfirm } from '../../ui/actions';

export default function TxnScreen() {
  const { id, month } = useLocalSearchParams<{ id: string; month: string }>();
  const spend = useSpend(month);
  const cats = useCategories();
  const call = useCall();
  const [busy, setBusy] = useState(false);
  const [confirmEl, ask] = useConfirm();
  const txn = spend.data?.transactions.find(t => t.id === id);
  if (!txn || !cats.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>Loading…</Txt></Screen>;
  return (
    <Screen>
      <TxnDetailView txn={txn} categories={cats.data} busy={busy} onBack={() => router.back()}
        onDelete={txn.source === 'cart' ? undefined : async () => {
          if (!(await ask({ title: 'Delete this expense?', body: `${txn.note ?? txn.merchant ?? txn.category.name} is removed from your spends.`, confirm: 'Delete', destructive: true }))) return;
          try { await call('DELETE', `/v1/transactions/${id}`, undefined, [['spend']]); router.back(); }
          catch (e) { Alert.alert('Could not delete', e instanceof Error ? e.message : ''); }
        }}
        onSave={async (categoryId, makeRule) => {
          setBusy(true);
          try {
            await call('PATCH', `/v1/transactions/${id}`, { categoryId, makeRule }, [['spend']]);
            router.back();
          } catch (e) { Alert.alert('Could not save', e instanceof Error ? e.message : ''); }
          finally { setBusy(false); }
        }} />
      {confirmEl}
    </Screen>
  );
}
