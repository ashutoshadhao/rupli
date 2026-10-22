import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SpendView } from '../../screens/spend';
import { Screen } from '../../ui/layout';
import { Txt } from '../../ui/core';
import { ActionSheet, useConfirm } from '../../ui/actions';
import { keys, useRecurring, useSpend, useWrite } from '../../query';
import type { Recurring } from '../../api';
import { monthKey, shiftMonth } from '../../logic/month';
import { exportCsv, exportPdf } from '../../export';
import { withAlert } from '../../alert';

export default function SpendScreen() {
  const now = monthKey(new Date());
  const [month, setMonth] = useState(now);
  const spend = useSpend(month);
  const recurring = useRecurring();
  const qc = useQueryClient();
  const write = useWrite({ invalidate: [keys.recurring] });
  const [confirmEl, ask] = useConfirm();
  const [exporting, setExporting] = useState(false);
  return (
    <Screen>
      {spend.data ? (
        <SpendView month={month} spend={spend.data} canNext={month < now}
          onPrev={() => setMonth(m => shiftMonth(m, -1))} onNext={() => setMonth(m => shiftMonth(m, 1))}
          onOpen={t => router.push({ pathname: '/txn/[id]', params: { id: t.id, month } })}
          onAdd={() => router.push('/txn/new')}
          recurring={recurring.data ?? []} onExport={() => setExporting(true)}
          onStopRecurring={async (r, close) => {
            if (!(await ask({ title: `Stop ${r.name}?`, body: 'It won’t be added in coming months. Months already added stay.', confirm: 'Stop', destructive: true }))) return close();
            qc.setQueryData<Recurring[]>(keys.recurring, old => old?.filter(x => x.id !== r.id));
            write.mutate({ method: 'DELETE', path: `/v1/recurring/${r.id}` });
          }} />
      ) : <Txt color="mute" style={{ padding: 24 }}>{spend.isError ? 'Could not load spend.' : 'Loading…'}</Txt>}
      {spend.data && (
        <ActionSheet visible={exporting} onClose={() => setExporting(false)} title="Export this month" subtitle="Share or save the report"
          actions={[
            { label: 'PDF report', emoji: '📄', onPress: withAlert('Could not export', () => exportPdf(spend.data)) },
            { label: 'Spreadsheet (CSV)', emoji: '📊', onPress: withAlert('Could not export', () => exportCsv(spend.data)) },
          ]} />
      )}
      {confirmEl}
    </Screen>
  );
}
