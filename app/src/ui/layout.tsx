import type { ReactNode } from 'react';
import { Modal, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Delete, WifiOff } from 'lucide-react-native';
import type { Key } from '../logic/keypad';
import { radius, useTheme } from '../theme';
import { Txt } from './core';

export function Screen({ children, edges = ['top'], style }: {
  children: ReactNode; edges?: ('top' | 'bottom')[]; style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: c.bg }, style]}>{children}</SafeAreaView>;
}

// sticky bottom bar with the soft upward shadow from the handoff
export function BottomBar({ children, shadow = true }: { children: ReactNode; shadow?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, backgroundColor: c.bg, flexDirection: 'row', gap: 10 },
      shadow && { boxShadow: '0 -8px 24px rgba(20,33,27,0.08)' }]}>
      {children}
    </View>
  );
}

export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: c.scrim }} />
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.card, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 20 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginTop: 10, marginBottom: 14 }} />
        {children}
      </SafeAreaView>
    </Modal>
  );
}

const KEYS: Key[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
export function Keypad({ onKey }: { onKey: (k: Key) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {KEYS.map(k => (
        <Pressable key={k} accessibilityLabel={k === '⌫' ? 'Delete' : k === 'C' ? 'Clear' : k} onPress={() => onKey(k)}
          style={({ pressed }) => ({ width: '31.8%', height: 60, borderRadius: 18, backgroundColor: pressed ? c.line : c.soft, alignItems: 'center', justifyContent: 'center' })}>
          {k === '⌫' ? <Delete size={26} color={c.ink} /> : <Txt w="700" size={28}>{k}</Txt>}
        </Pressable>
      ))}
    </View>
  );
}

export function OfflineBanner() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.chiliSoft }}>
      <WifiOff size={18} color={c.chiliInk} />
      <Txt size={14} color="chiliInk"><Txt w="700" size={14} color="chiliInk">Offline:</Txt> changes will sync</Txt>
    </View>
  );
}

// paths copied from RupliNav2.dc.html
export const NAV_TABS = [
  { key: 'index', label: 'Home', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { key: 'lists', label: 'Lists', d: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01' },
  { key: 'compare', label: 'Compare', d: 'M12 3v18M7 21h10M4 7h16M6 7l-3 8c1.5 1.3 4.5 1.3 6 0zM18 7l-3 8c1.5 1.3 4.5 1.3 6 0z' },
  { key: 'spend', label: 'Spend', d: 'M21 12A9 9 0 1 1 12 3v9zM15 3.5A9 9 0 0 1 20.5 9H15z' },
] as const;

export function BottomNav({ active, onPress }: { active: string; onPress: (key: string) => void }) {
  const { c } = useTheme();
  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.card, borderTopWidth: 1.5, borderTopColor: c.line }}>
      <View style={{ height: 76, flexDirection: 'row', paddingHorizontal: 6 }}>
        {NAV_TABS.map(t => {
          const on = t.key === active;
          return (
            <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label}
              onPress={() => onPress(t.key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <View style={{ width: 60, height: 32, borderRadius: 16, backgroundColor: on ? c.yellow : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={on ? c.onYellow : c.mute} strokeWidth={on ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d={t.d} />
                </Svg>
              </View>
              <Txt size={13} w={on ? '700' : '500'} color={on ? 'ink' : 'mute'}>{t.label}</Txt>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
