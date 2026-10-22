import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ArrowRight, Plus } from 'lucide-react-native';
import { formatINR } from '@rupli/shared';
import { useTheme } from '../../theme';
import { Card, Checkbox, Chip, DashedAddButton, EmojiTile, Pill, PrimaryButton, SecondaryButton, Stepper, Toggle, Txt } from '../../ui/core';
import { BottomNav, Keypad, OfflineBanner, Screen } from '../../ui/layout';
import { pressKey } from '../../logic/keypad';

// design-system sheet, for side-by-side checks with the handoff
export default function DesignSystem() {
  const { c } = useTheme();
  const [qty, setQty] = useState(2);
  const [on, setOn] = useState(true);
  const [chk, setChk] = useState(true);
  const [val, setVal] = useState('177');
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Txt style={{ fontFamily: 'AnekLatin-Wordmark800', fontSize: 68, lineHeight: 72, color: c.green }}>rupli<Txt style={{ color: c.yellow, fontSize: 68 }}>●</Txt></Txt>
        <Card style={{ gap: 10 }}>
          <Txt v="hero" size={60}>{formatINR(12500000)}</Txt>
          <Txt v="title" size={34}>Monthly Kirana</Txt>
          <Txt size={17}><Txt w="700" size={17}>Toor Dal</Txt> <Txt color="mute" size={17}>· arhar</Txt></Txt>
        </Card>
        <Card style={{ gap: 12 }}>
          <PrimaryButton label="Start shopping" right={<ArrowRight size={22} strokeWidth={2.5} color={c.onYellow} />} />
          <SecondaryButton label="New list" icon={<Plus size={20} strokeWidth={2.5} color={c.ink} />} />
          <DashedAddButton label="+ Add item not on list" />
        </Card>
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Chip label="Gokul" /><Chip label="Amul" selected /><Chip label="Dairy" selected height={44} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pill label="▲ ₹12 more than last time" bg="chili" fg="card" w="700" size={14} />
            <Pill label="⭐ Best value" bg="yellow" fg="onYellow" w="800" size={12} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill label="🛒 Cart" size={12} /><Pill label="💬 SMS" size={12} /><Pill label="✍️ Manual" size={12} /><Pill label="Amul" bg="mint" fg="mintInk" size={12} />
          </View>
        </Card>
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Stepper value={qty} onChange={setQty} />
            <Checkbox checked={false} /><Checkbox checked={chk} onPress={() => setChk(!chk)} />
            <Toggle on={on} onPress={() => setOn(!on)} />
            <EmojiTile emoji="🥛" />
          </View>
          <Txt v="num">₹{val || '0'}</Txt>
          <Keypad onKey={k => setVal(v => pressKey(v, k))} />
          <OfflineBanner />
        </Card>
      </ScrollView>
      <BottomNav active="lists" onPress={() => {}} />
    </Screen>
  );
}
