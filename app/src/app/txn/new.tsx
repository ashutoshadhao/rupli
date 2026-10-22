import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { NewExpenseView } from '../../screens/spend';
import { Screen } from '../../ui/layout';
import { Txt } from '../../ui/core';
import { keys, useCall, useCategories } from '../../query';
import { monthKey } from '../../logic/month';

export default function NewExpense() {
  const cats = useCategories();
  const call = useCall();
  const [busy, setBusy] = useState(false);
  if (!cats.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>Loading…</Txt></Screen>;
  return (
    <Screen>
      <NewExpenseView categories={cats.data} busy={busy} onBack={() => router.back()}
        onSave={async ({ amountPaise, categoryId, note, date, repeat }) => {
          setBusy(true);
          try {
            // a monthly bill is added by the server each month (this month's too, once its day has come)
            if (repeat) await call('POST', '/v1/recurring', {
              name: note.trim() || cats.data!.find(x => x.id === categoryId)!.name, amountPaise, categoryId, dayOfMonth: date.getDate(), startMonth: monthKey(date),
            }, [['spend'], keys.recurring]);
            else await call('POST', '/v1/transactions', {
              amountPaise, categoryId, direction: 'debit', occurredAt: date.toISOString(), ...(note.trim() && { note: note.trim() }),
            }, [['spend']]);
            router.back();
          } catch (e) { Alert.alert('Could not save', e instanceof Error ? e.message : ''); }
          finally { setBusy(false); }
        }} />
    </Screen>
  );
}
