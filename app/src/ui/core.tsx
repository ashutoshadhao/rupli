import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Check, Minus, Plus } from 'lucide-react-native';
import { font, radius, useTheme, type Colors } from '../theme';

type Variant = 'hero' | 'title' | 'section' | 'item' | 'body' | 'meta' | 'chip' | 'num';
const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: font.wide, fontSize: 78, lineHeight: 74, letterSpacing: -2.3 },
  num: { fontFamily: font.wide, fontSize: 40, lineHeight: 40 },
  title: { fontFamily: font.extrabold, fontSize: 38, lineHeight: 40 },
  section: { fontFamily: font.extrabold, fontSize: 24, lineHeight: 28 },
  item: { fontFamily: font.bold, fontSize: 16, lineHeight: 19 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  meta: { fontFamily: font.regular, fontSize: 13, lineHeight: 17 },
  chip: { fontFamily: font.semibold, fontSize: 13, lineHeight: 17 },
};
const WEIGHT: Record<string, string> = { '400': font.regular, '500': font.medium, '600': font.semibold, '700': font.bold, '800': font.extrabold };

export function Txt({ v = 'body', color, w, size, style, children, numberOfLines }: {
  v?: Variant; color?: keyof Colors; w?: '400' | '500' | '600' | '700' | '800'; size?: number;
  style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number;
}) {
  const { c } = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[
      VARIANTS[v], { color: c[color ?? (v === 'meta' ? 'mute' : 'ink')], fontVariant: ['tabular-nums'] },
      w && { fontFamily: WEIGHT[w] }, size !== undefined && { fontSize: size, lineHeight: Math.round(size * 1.2) }, style,
    ]}>{children}</Text>
  );
}

// yellow CTA: 2dp edge border + hard 4dp offset shadow drawn as a block behind
export function PrimaryButton({ label, onPress, left, right, height = 60, disabled, style, center, size = 18 }: {
  label: string; onPress?: () => void; left?: ReactNode; right?: ReactNode; height?: number;
  disabled?: boolean; style?: StyleProp<ViewStyle>; center?: boolean; size?: number;
}) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
      style={[{ height: height + 4, opacity: disabled ? 0.5 : 1 }, style]}>
      {({ pressed }) => (
        <View style={{ flex: 1 }}>
          <View style={[StyleSheet.absoluteFill, { top: 4, borderRadius: radius.buttonLg, backgroundColor: c.edge }]} />
          <View style={{
            height, borderRadius: radius.buttonLg, backgroundColor: c.yellow, borderWidth: 2, borderColor: c.edge,
            flexDirection: 'row', alignItems: 'center', justifyContent: center ? 'center' : 'space-between', gap: 8, paddingHorizontal: center ? 10 : 20,
            transform: [{ translateY: pressed ? 3 : 0 }],
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: center ? 8 : 12, flexShrink: 1 }}>
              {left}
              <Txt w="700" size={size} color="onYellow" numberOfLines={1}>{label}</Txt>
            </View>
            {right}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, icon, height = 58, style }: {
  label: string; onPress?: () => void; icon?: ReactNode; height?: number; style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [{
      height, borderRadius: radius.button, backgroundColor: pressed ? c.soft : c.card, borderWidth: 1.5, borderColor: c.line,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12,
    }, style]}>
      {icon}
      <Txt w="600" size={16}>{label}</Txt>
    </Pressable>
  );
}

export function DashedAddButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{
      height: 48, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: c.line, alignItems: 'center', justifyContent: 'center',
    }}>
      <Txt w="600" size={15} color="green">{label}</Txt>
    </Pressable>
  );
}

// pill with background + text color tokens
export function Pill({ label, bg = 'soft', fg = 'ink', w = '600', size = 13, style }: {
  label: string; bg?: keyof Colors; fg?: keyof Colors; w?: '600' | '700' | '800'; size?: number; style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <View style={[{ backgroundColor: c[bg], borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }, style]}>
      <Txt w={w} size={size} color={fg}>{label}</Txt>
    </View>
  );
}

export function Chip({ label, selected, onPress, height = 48 }: { label: string; selected?: boolean; onPress?: () => void; height?: number }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{
      height, borderRadius: height / 2, paddingHorizontal: 18, justifyContent: 'center',
      borderWidth: selected ? 2 : 1.5, borderColor: selected ? c.ink : c.line, backgroundColor: selected ? c.ink : 'transparent',
    }}>
      <Txt w={selected ? '700' : '400'} size={15} color={selected ? 'bg' : 'ink'}>{label}</Txt>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 1, large }: { value: number; onChange: (n: number) => void; min?: number; large?: boolean }) {
  const { c } = useTheme();
  const s = large ? 48 : 40;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: s + 4, borderRadius: (s + 4) / 2, backgroundColor: c.soft, paddingHorizontal: 2 }}>
      <Pressable accessibilityLabel="Decrease" onPress={() => onChange(Math.max(min, value - 1))} hitSlop={4}
        style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
        <Minus size={16} strokeWidth={3} color={c.ink} />
      </Pressable>
      <Txt w="800" size={large ? 28 : 16} style={{ minWidth: large ? 56 : 28, textAlign: 'center' }}>{value}</Txt>
      <Pressable accessibilityLabel="Increase" onPress={() => onChange(value + 1)} hitSlop={4}
        style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={16} strokeWidth={3} color={c.onGreen} />
      </Pressable>
    </View>
  );
}

export function Checkbox({ checked, onPress }: { checked: boolean; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onPress}
      style={{ width: 32, height: 48, justifyContent: 'center' }}>
      {checked ? (
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={15} strokeWidth={3.5} color={c.onGreen} />
        </View>
      ) : <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.mute }} />}
    </Pressable>
  );
}

export function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onPress} hitSlop={8} style={{
      width: 52, height: 32, borderRadius: 16, padding: on ? 4 : 4, backgroundColor: on ? c.green : 'transparent',
      borderWidth: on ? 0 : 2, borderColor: c.mute, alignItems: on ? 'flex-end' : 'flex-start', justifyContent: 'center',
    }}>
      <View style={{ width: on ? 24 : 20, height: on ? 24 : 20, borderRadius: 12, backgroundColor: on ? c.onGreen : c.mute }} />
    </Pressable>
  );
}

export function Card({ children, style, pad = 16 }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.card, padding: pad, borderWidth: 1.5, borderColor: c.line }, style]}>{children}</View>;
}

export function EmojiTile({ emoji, size = 44, bg = 'soft', r = 14 }: { emoji: string; size?: number; bg?: keyof Colors; r?: number }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: c[bg], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: Math.round(size * 0.54) }}>{emoji}</Text>
    </View>
  );
}

export function Progress({ pct, track = 'soft', fill = 'green', h = 12 }: { pct: number; track?: keyof Colors; fill?: keyof Colors; h?: number }) {
  const { c } = useTheme();
  return (
    <View style={{ height: h, borderRadius: h / 2, backgroundColor: c[track], overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, borderRadius: h / 2, backgroundColor: c[fill] }} />
    </View>
  );
}

export function IconButton({ children, onPress, label, bg = 'card' }: { children: ReactNode; onPress?: () => void; label: string; bg?: keyof Colors }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c[bg], alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </Pressable>
  );
}

export const SOURCE_BADGE = { cart: '🛒 Cart', sms: '💬 SMS', manual: '✍️ Manual' } as const;
