import { useColorScheme } from 'react-native';

// tokens copied verbatim from docs/design/handoff/README.md
const light = {
  bg: '#FFF6E6', card: '#FFFFFF', soft: '#F6EBD5', ink: '#14211B', mute: '#5A675F', line: '#E8DBC1',
  green: '#0F5C3E', onGreen: '#FFF6E6', yellow: '#FFC531', onYellow: '#14211B',
  chili: '#E0401F', chiliSoft: '#FFE2D9', chiliInk: '#992810', mint: '#D9F1E2', mintInk: '#0F5C3E', edge: '#14211B',
  onGreenSoft: 'rgba(255,246,230,0.16)', onGreenTrack: 'rgba(255,246,230,0.2)', scrim: 'rgba(10,18,14,0.5)',
};
const dark: typeof light = {
  bg: '#0D1511', card: '#17221C', soft: '#1F2D26', ink: '#F4EDDF', mute: '#A4B0A8', line: '#2B3A31',
  green: '#17734E', onGreen: '#F4EDDF', yellow: '#FFC531', onYellow: '#14211B',
  chili: '#FF6B4E', chiliSoft: '#3B1E17', chiliInk: '#FFB5A4', mint: '#163A2A', mintInk: '#8FE0B0', edge: '#000000',
  onGreenSoft: 'rgba(244,237,223,0.16)', onGreenTrack: 'rgba(244,237,223,0.2)', scrim: 'rgba(10,18,14,0.5)',
};
export type Colors = typeof light;

export { chartColors } from './chartColors';

export const font = {
  regular: 'AnekLatin_400Regular', medium: 'AnekLatin_500Medium', semibold: 'AnekLatin_600SemiBold',
  bold: 'AnekLatin_700Bold', extrabold: 'AnekLatin_800ExtraBold',
  wide: 'AnekLatin-Wide800', wordmark: 'AnekLatin-Wordmark800',
} as const;

export const radius = { tile: 14, input: 14, button: 18, buttonLg: 20, card: 24, hero: 28, sheet: 32, pill: 999 } as const;
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24 } as const;

export function useTheme() {
  const c = useColorScheme() === 'dark' ? dark : light;
  return { c, dark: c === dark };
}
