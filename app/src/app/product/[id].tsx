import { router, useLocalSearchParams } from 'expo-router';
import { PriceHistoryView } from '../../screens/trips';
import { Screen } from '../../ui/layout';
import { Txt } from '../../ui/core';
import { usePriceHistory } from '../../query';

export default function PriceHistory() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const prices = usePriceHistory(id);
  if (!prices.data) return <Screen><Txt color="mute" style={{ padding: 24 }}>{prices.isError ? 'Could not load prices.' : 'Loading…'}</Txt></Screen>;
  return <Screen><PriceHistoryView name={name ?? 'Price history'} rows={prices.data} onBack={() => router.back()} /></Screen>;
}
