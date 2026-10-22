import { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { BottomNav } from '../../ui/layout';
import { useOpenTrip } from '../../query';

export default function TabsLayout() {
  const open = useOpenTrip();
  const resumed = useRef(false);
  // reopen an unfinished trip after the app was killed mid-shop
  useEffect(() => {
    if (resumed.current || !open.isFetched) return;
    resumed.current = true;
    if (open.data) router.push(`/trip/${open.data.id}`);
  }, [open.isFetched, open.data]);
  return (
    <Tabs screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BottomNav active={state.routes[state.index]!.name} onPress={name => navigation.navigate(name)} />
      )}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="lists" />
      <Tabs.Screen name="compare" />
      <Tabs.Screen name="spend" />
    </Tabs>
  );
}
