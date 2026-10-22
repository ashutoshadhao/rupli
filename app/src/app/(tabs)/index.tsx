import { router } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useClerk, useUser } from '../../auth';
import { HomeView } from '../../screens/home';
import { Screen } from '../../ui/layout';
import { keys, queryClient, useCall, useLists, useRecentTrips, useSpend } from '../../query';
import { rupeesToPaise } from '../../logic/keypad';
import type { ListSummary } from '../../api';
import { withAlert } from '../../alert';
import { activeList, defaultListName, visibleLists } from '../../logic/lists';
import { ActionSheet, useConfirm, usePrompt } from '../../ui/actions';
import { monthKey, shiftMonth } from '../../logic/month';
import { useStartShopping } from '../../shopping';

export default function Home() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const month = monthKey(new Date());
  const spend = useSpend(month);
  const lists = useLists();
  const trips = useRecentTrips();
  const { start, sheet: storeSheet } = useStartShopping();
  const active = activeList(visibleLists(lists.data ?? []));
  const [menu, setMenu] = useState(false);
  const call = useCall();
  const [confirmEl, ask] = useConfirm();
  const [promptEl, prompt] = usePrompt();
  const budgetPaise = spend.data?.budgetPaise ?? null;
  const setBudget = withAlert('Could not save the budget', async () => {
    const v = await prompt({ title: 'Monthly grocery budget', body: 'Rupli warns you on Home once 80% is spent. Enter 0 to turn the budget off.',
      placeholder: '12000', prefix: '₹', keyboard: 'number-pad', confirm: 'Save budget', initial: budgetPaise ? String(budgetPaise / 100) : '' });
    if (v === null) return;
    await call('PUT', '/v1/me', { budgetPaise: Math.round(rupeesToPaise(v.replace(/[^\d.]/g, '')) ?? 0) || null }, [['spend']]);
  });
  const joinList = withAlert('Could not join', async () => {
    const code = await prompt({ title: 'Join a family list', body: 'Type the 6-letter code your family member shared from their list.', placeholder: 'ABC234', caps: true, confirm: 'Join list' });
    if (!code) return;
    const l = await call<ListSummary>('POST', '/v1/lists/join', { code }, [keys.lists]);
    router.push(`/list/${l.id}`);
  });
  const name = user?.firstName ?? user?.primaryEmailAddress?.emailAddress.split('@')[0] ?? 'there';
  const initials = ((user?.firstName?.[0] ?? name[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase();
  return (
    <Screen>
      <HomeView firstName={name} initials={initials} month={month} prevMonth={shiftMonth(month, -1)}
        totalPaise={spend.data?.totalPaise ?? 0} prevTotalPaise={spend.data?.prevTotalPaise ?? 0}
        activeList={active} trips={trips.data ?? []} budgetPaise={budgetPaise} onBudget={setBudget}
        onStart={() => start(active?.id)} onOpenList={id => router.push(`/list/${id}`)}
        onCompare={() => router.navigate('/compare')} onSpend={() => router.navigate('/spend')}
        onAvatar={() => setMenu(true)} onAllTrips={() => router.push('/trips')} onOpenTrip={id => router.push(`/trips/${id}`)}
        onNewList={withAlert('Could not create the list', async () => {
          const l = await call<ListSummary>('POST', '/v1/lists', { name: defaultListName(), month }, [keys.lists]);
          router.push(`/list/${l.id}/add`);
        })} />
      <ActionSheet visible={menu} onClose={() => setMenu(false)} title={name} subtitle={user?.primaryEmailAddress?.emailAddress}
        actions={[
          { label: 'Add expense', emoji: '✍️', onPress: () => router.push('/txn/new') },
          { label: 'All trips', emoji: '🧾', onPress: () => router.push('/trips') },
          { label: budgetPaise ? 'Change monthly budget' : 'Set monthly budget', emoji: '🎯', onPress: setBudget },
          { label: 'Join a family list', emoji: '👪', onPress: joinList },
          { label: 'Sign out', emoji: '👋', destructive: true, onPress: async () => {
            if (!(await ask({ title: 'Sign out?', body: 'Your lists and spends stay safe on your account.', confirm: 'Sign out' }))) return;
            // the next person on this phone must not see this account's cached lists or spends
            queryClient.clear();
            await AsyncStorage.removeItem('rupli-cache');
            await signOut();
          } },
        ]} />
      {confirmEl}
      {promptEl}
      {storeSheet}
    </Screen>
  );
}
