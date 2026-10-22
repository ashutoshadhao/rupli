import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Pressable, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import { font, useTheme } from '../theme';
import { PrimaryButton, SecondaryButton, Txt } from './core';
import { Sheet } from './layout';

export interface Action { label: string; emoji?: string; destructive?: boolean; onPress: () => void }

// design-language replacement for Alert.alert menus
export function ActionSheet({ visible, title, subtitle, actions, onClose }: {
  visible: boolean; title: string; subtitle?: string; actions: Action[]; onClose: () => void;
}) {
  const { c } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ gap: 10, paddingBottom: 12 }}>
        <View style={{ marginBottom: 4 }}>
          <Txt v="section" size={21} numberOfLines={1}>{title}</Txt>
          {subtitle ? <Txt v="meta" style={{ marginTop: 2 }}>{subtitle}</Txt> : null}
        </View>
        {actions.map(a => (
          <Pressable key={a.label} accessibilityRole="button" onPress={() => { onClose(); a.onPress(); }} style={({ pressed }) => ({
            minHeight: 56, borderRadius: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: pressed ? c.line : a.destructive ? c.chiliSoft : c.soft,
          })}>
            {a.emoji ? <Txt size={20}>{a.emoji}</Txt> : null}
            <Txt w="700" size={16} color={a.destructive ? 'chiliInk' : 'ink'}>{a.label}</Txt>
          </Pressable>
        ))}
        <SecondaryButton label="Cancel" height={52} onPress={onClose} />
      </View>
    </Sheet>
  );
}

interface Ask { title: string; body?: string; confirm: string; destructive?: boolean }

// const [confirmEl, ask] = useConfirm(); …  if (await ask({ title: 'Delete list?', confirm: 'Delete' })) …
export function useConfirm(): [ReactNode, (q: Ask) => Promise<boolean>] {
  const { c } = useTheme();
  const [q, setQ] = useState<Ask | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});
  const ask = useCallback((next: Ask) => new Promise<boolean>(res => { resolver.current = res; setQ(next); }), []);
  const done = (v: boolean) => { setQ(null); resolver.current(v); };
  const el = (
    <Sheet visible={!!q} onClose={() => done(false)}>
      {q && (
        <View style={{ gap: 14, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {q.destructive && (
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.chiliSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} strokeWidth={2.25} color={c.chiliInk} />
              </View>
            )}
            <Txt v="section" size={24} style={{ flex: 1 }}>{q.title}</Txt>
          </View>
          {q.body ? <Txt size={16} color="mute" style={{ lineHeight: 22 }}>{q.body}</Txt> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <SecondaryButton label="Cancel" height={56} onPress={() => done(false)} style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" onPress={() => done(true)} style={({ pressed }) => ({
              flex: 1.4, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
              backgroundColor: q.destructive ? c.chili : c.yellow, opacity: pressed ? 0.85 : 1,
              borderWidth: q.destructive ? 0 : 2, borderColor: c.edge,
            })}>
              <Txt w="700" size={17} style={{ color: q.destructive ? '#FFFFFF' : c.onYellow }}>{q.confirm}</Txt>
            </Pressable>
          </View>
        </View>
      )}
    </Sheet>
  );
  return [el, ask];
}

interface PromptQ { title: string; body?: string; placeholder: string; confirm: string; initial?: string; keyboard?: KeyboardTypeOptions; caps?: boolean; prefix?: string }

// const [promptEl, prompt] = usePrompt(); const v = await prompt({ … }) → trimmed text, or null on cancel
export function usePrompt(): [ReactNode, (q: PromptQ) => Promise<string | null>] {
  const { c } = useTheme();
  const [q, setQ] = useState<PromptQ | null>(null);
  const [val, setVal] = useState('');
  const resolver = useRef<(v: string | null) => void>(() => {});
  const prompt = useCallback((next: PromptQ) => new Promise<string | null>(res => { resolver.current = res; setVal(next.initial ?? ''); setQ(next); }), []);
  const done = (v: string | null) => { setQ(null); resolver.current(v); };
  const el = (
    <Sheet visible={!!q} onClose={() => done(null)}>
      {q && (
        <View style={{ gap: 14, paddingBottom: 12 }}>
          <Txt v="section" size={24}>{q.title}</Txt>
          {q.body ? <Txt size={16} color="mute" style={{ lineHeight: 22 }}>{q.body}</Txt> : null}
          <View style={{ height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {q.prefix ? <Txt w="700" size={20}>{q.prefix}</Txt> : null}
            <TextInput autoFocus value={val} onChangeText={t => setVal(q.caps ? t.toUpperCase() : t)} placeholder={q.placeholder} placeholderTextColor={c.mute} keyboardType={q.keyboard}
              autoCapitalize={q.caps ? 'characters' : 'none'} autoCorrect={false} maxLength={12} returnKeyType="done" onSubmitEditing={() => val.trim() && done(val.trim())}
              style={{ flex: 1, height: '100%', fontSize: 20, fontFamily: font.semibold, color: c.ink }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <SecondaryButton label="Cancel" height={56} onPress={() => done(null)} style={{ flex: 1 }} />
            <PrimaryButton label={q.confirm} height={56} size={17} center disabled={!val.trim()} onPress={() => done(val.trim())} style={{ flex: 1.4 }} />
          </View>
        </View>
      )}
    </Sheet>
  );
  return [el, prompt];
}

const PANEL = 96;

// swipe left to reveal Delete; the row asks before deleting and slides back on "Cancel".
// Fixed-width panel (no layout measuring), so it behaves the same on Android and web.
export function SwipeToDelete({ children, onDelete, enabled = true, radius = 0 }: {
  children: ReactNode; onDelete: (close: () => void) => void; enabled?: boolean; radius?: number;
}) {
  const { c } = useTheme();
  const tx = useSharedValue(0);
  const close = () => { tx.value = withTiming(0, { duration: 180 }); };
  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-14, 14])  // horizontal intent only…
    .failOffsetY([-12, 12])    // …so vertical scrolling still wins
    .onUpdate(e => { tx.value = Math.max(-PANEL * 1.4, Math.min(0, e.translationX)); })
    .onEnd(e => {
      if (tx.value < -PANEL * 0.6 || e.velocityX < -900) {
        tx.value = withTiming(-PANEL, { duration: 160 });
        runOnJS(onDelete)(close);
      } else {
        tx.value = withTiming(0, { duration: 160 });
      }
    });
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const panelStyle = useAnimatedStyle(() => ({ opacity: tx.value < -2 ? 1 : 0 }));
  if (!enabled) return <>{children}</>;
  return (
    <View style={{ overflow: 'hidden', borderRadius: radius }}>
      <Animated.View style={[{ position: 'absolute', right: 0, top: 0, bottom: 0, width: PANEL, backgroundColor: c.chili, alignItems: 'center', justifyContent: 'center', gap: 2 }, panelStyle]}>
        <Trash2 size={22} strokeWidth={2.25} color="#FFFFFF" />
        <Txt w="700" size={13} style={{ color: '#FFFFFF' }}>Delete</Txt>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
