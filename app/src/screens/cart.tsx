import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ArrowRight, Check, ChevronLeft, ChevronRight, EllipsisVertical, X } from 'lucide-react-native';
import { billCheck, cartTotal, formatINR, priceDelta } from '@rupli/shared';
import type { ListItem, Trip, TripItem } from '../api';
import { priceFromKeypad, pressKey, rupeesToPaise } from '../logic/keypad';
import { recheckItems, splitToPickInCart } from '../logic/cart';
import { useTheme } from '../theme';
import { Card, DashedAddButton, EmojiTile, IconButton, Pill, PrimaryButton, SecondaryButton, Txt } from '../ui/core';
import { BottomBar, Keypad, OfflineBanner, Sheet } from '../ui/layout';
import { SwipeToDelete, useConfirm } from '../ui/actions';
import { plural } from '../logic/text';

export type PriceTarget =
  | { kind: 'pick'; item: ListItem }
  | { kind: 'edit'; item: TripItem };

export interface CartProps {
  trip: Trip & { items: TripItem[] }; listItems: ListItem[]; offline: boolean;
  onPause: () => void; onAddUnlisted: () => void; onCounter: () => void;
  onAddToCart: (item: ListItem, pricePaise: number) => void;
  onEditPrice: (item: TripItem, pricePaise: number) => void; onRemove: (item: TripItem) => void;
  onDeleteListItem: (item: ListItem) => void;
}

const ProductName = ({ name, alias, size = 16 }: { name: string; alias?: string; size?: number }) => (
  <Txt w="700" size={size}>{name}{alias ? <Txt size={size} color="mute"> · {alias}</Txt> : null}</Txt>
);

export function CartView(p: CartProps) {
  const { c } = useTheme();
  const [target, setTarget] = useState<PriceTarget | null>(null);
  const [confirmEl, ask] = useConfirm();
  const swipeRemove = async (it: TripItem, close: () => void) => {
    if (await ask({ title: `Remove ${it.product?.name ?? 'item'} from cart?`, body: 'It goes back to “To pick” and leaves the running total.', confirm: 'Remove', destructive: true })) p.onRemove(it);
    else close();
  };
  const swipeDelete = async (it: ListItem, close: () => void) => {
    if (await ask({ title: `Remove ${it.product.name} from list?`, body: `${it.packSize} × ${it.qty} comes off this list.`, confirm: 'Remove', destructive: true })) p.onDeleteListItem(it);
    else close();
  };
  const { toPick, inCart } = splitToPickInCart(p.listItems, p.trip.items);
  const total = cartTotal(inCart);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: c.green, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.trip.pausedAt ? c.mute : c.yellow }} />
            <Txt w="600" size={14} color="onGreen">{p.trip.pausedAt ? 'Paused' : 'In store'}{p.trip.store ? ` · ${p.trip.store}` : ''}</Txt>
          </View>
          <IconButton label="Trip options" bg="onGreenSoft" onPress={p.onPause}>
            <EllipsisVertical size={20} strokeWidth={2.75} color={c.onGreen} />
          </IconButton>
        </View>
        <Txt v="hero" size={86} color="onGreen" style={{ lineHeight: 80, marginTop: 6 }} numberOfLines={1}>{formatINR(total)}</Txt>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pill label={`${inCart.length} in cart`} bg="yellow" fg="onYellow" w="700" size={14} />
          <Pill label={`${toPick.length} to pick`} bg="onGreenSoft" fg="onGreen" size={14} />
        </View>
      </View>
      {p.offline && <View style={{ marginHorizontal: 16, marginTop: 10 }}><OfflineBanner /></View>}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 10 }}>
        <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 2 }}>
            <Txt w="700" size={15}>To pick</Txt><Txt v="meta">{plural(toPick.length, 'item')}</Txt>
          </View>
          {toPick.map(it => (
            <SwipeToDelete key={it.id} onDelete={close => swipeDelete(it, close)}>
            <Pressable onPress={() => setTarget({ kind: 'pick', item: it })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, backgroundColor: c.card }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.mute }} />
              <EmojiTile emoji={it.product.emoji} size={42} r={13} />
              <View style={{ flex: 1 }}>
                <ProductName name={it.product.name} alias={it.product.aliases[0]} />
                <Txt v="meta">{it.packSize} × {it.qty}{it.brand ? ` · ${it.brand}` : ''}</Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {it.lastPricePaise != null && <Txt size={14} color="mute">{formatINR(it.lastPricePaise)}</Txt>}
                <ChevronRight size={18} strokeWidth={2.5} color={c.mute} />
              </View>
            </Pressable>
            </SwipeToDelete>
          ))}
          <View style={{ marginTop: 2, marginBottom: 10 }}><DashedAddButton label="+ Add item not on list" onPress={p.onAddUnlisted} /></View>
        </Card>
        {inCart.length > 0 && (
          <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 2 }}>
              <Txt w="700" size={15}>In cart</Txt><Txt v="meta">{plural(inCart.length, 'item')}</Txt>
            </View>
            {inCart.map(it => (
              <SwipeToDelete key={it.id} onDelete={close => swipeRemove(it, close)}>
              <Pressable onPress={() => setTarget({ kind: 'edit', item: it })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, backgroundColor: c.card }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={15} strokeWidth={3.5} color={c.onGreen} />
                </View>
                <EmojiTile emoji={it.product?.emoji ?? '🛒'} size={42} r={13} bg="mint" />
                <View style={{ flex: 1 }}>
                  <Txt w="600" size={15}>{it.product?.name ?? 'Item'}</Txt>
                  <Txt v="meta">{it.packSize} × {it.qty}</Txt>
                </View>
                <Txt w="800" size={17}>{formatINR(it.qty * it.pricePaise)}</Txt>
              </Pressable>
            </SwipeToDelete>
            ))}
          </Card>
        )}
      </ScrollView>
      <BottomBar>
        <PrimaryButton label="At the counter" height={62} onPress={p.onCounter} disabled={!inCart.length} style={{ flex: 1 }}
          right={<ArrowRight size={22} strokeWidth={2.5} color={c.onYellow} />} />
      </BottomBar>
      {confirmEl}
      {target && <PriceSheet target={target} onClose={() => setTarget(null)}
        onRemove={target.kind === 'edit' ? () => { p.onRemove(target.item); setTarget(null); } : undefined}
        onSave={paise => {
          if (target.kind === 'pick') p.onAddToCart(target.item, paise); else p.onEditPrice(target.item, paise);
          setTarget(null);
        }} />}
    </View>
  );
}

export function PriceSheet({ target, onClose, onSave, onRemove }: {
  target: PriceTarget; onClose: () => void; onSave: (pricePaise: number) => void; onRemove?: () => void;
}) {
  const { c } = useTheme();
  const it = target.item;
  const product = 'product' in it && it.product ? it.product : null;
  const last = target.kind === 'pick' ? target.item.lastPricePaise : target.item.pricePaise;
  // untouched keypad = exact last price (keeps ₹45.50); typing switches to whole rupees
  const [val, setVal] = useState<string | null>(null);
  const paise = priceFromKeypad(val, last);
  const delta = paise != null && target.kind === 'pick' ? priceDelta(paise, target.item.lastPricePaise) : null;
  return (
    <Sheet visible onClose={onClose}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <EmojiTile emoji={product?.emoji ?? '🛒'} size={52} r={16} />
        <View style={{ flex: 1 }}>
          <ProductName name={product?.name ?? 'Item'} alias={product?.aliases[0]} size={21} />
          <Txt size={14} color="mute">{it.packSize} × {it.qty} · {it.brand ?? 'any brand'}</Txt>
        </View>
        <IconButton label="Close" bg="soft" onPress={onClose}><X size={20} strokeWidth={2.5} color={c.ink} /></IconButton>
      </View>
      <View style={{ marginTop: 16, backgroundColor: c.soft, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 18 }}>
        <Txt w="600" size={14} color="mute">Price each</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt v="hero" size={76} style={{ lineHeight: 76 }}>{formatINR(paise ?? 0)}</Txt>
          <View style={{ width: 3, height: 58, borderRadius: 2, backgroundColor: c.green }} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6, minHeight: 32 }}>
          {delta?.kind === 'more' && <Pill label={`▲ ${formatINR(delta.diffPaise)} more than last time`} bg="chili" fg="card" w="700" size={14} />}
          {delta?.kind === 'less' && <Pill label={`▼ ${formatINR(delta.diffPaise)} less than last time`} bg="mint" fg="mintInk" w="700" size={14} />}
          {delta?.kind === 'same' && <Pill label="Same as last time" bg="card" w="700" size={14} />}
          {paise != null && <Txt size={14} color="mute">{it.qty} × {formatINR(paise)} = {formatINR(it.qty * paise)}</Txt>}
        </View>
      </View>
      <View style={{ marginTop: 16 }}><Keypad onKey={k => setVal(v => pressKey(v ?? (last != null ? String(Math.floor(last / 100)) : ''), k))} /></View>
      <View style={{ paddingTop: 12, paddingBottom: 4, gap: 6 }}>
        <PrimaryButton label={target.kind === 'pick' ? 'Add to cart' : 'Save price'} height={62} disabled={paise == null} onPress={() => paise && onSave(paise)}
          right={paise != null ? <Txt v="num" size={21} color="onYellow" style={{ lineHeight: 24 }}>{formatINR(it.qty * paise)}</Txt> : undefined} />
        {onRemove && (
          <Pressable onPress={onRemove} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Txt w="600" size={15} color="chili">Remove from cart</Txt>
          </Pressable>
        )}
      </View>
    </Sheet>
  );
}

export interface BillProps {
  monthName: string; items: TripItem[]; lastPaise: (productId: string, pack: string) => number | null;
  onBack: () => void; onEdit: (item: TripItem) => void; onAddMissed: () => void; onFinish: (billPaise: number) => void; busy?: boolean;
}

export function BillView(p: BillProps) {
  const { c } = useTheme();
  const cart = cartTotal(p.items);
  const [val, setVal] = useState('');
  const [checked, setChecked] = useState(false);
  const bill = rupeesToPaise(val);
  const result = bill != null ? billCheck(cart, bill) : null;
  const header = (
    <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
      <IconButton label="Back" onPress={p.onBack}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
      <Txt w="700" size={19}>At the counter</Txt>
    </View>
  );
  const billCard = (
    <Pressable onPress={() => setChecked(false)} style={{
      backgroundColor: c.card, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 2,
      borderColor: !checked ? c.line : result?.status === 'match' ? c.green : c.chili,
    }}>
      <Txt w="600" size={14} color="mute">Total on your bill</Txt>
      <Txt v="hero" size={64} style={{ lineHeight: 66, letterSpacing: -1.3 }}>{formatINR((bill ?? 0))}</Txt>
      <Txt size={14} color="mute">Your cart: {formatINR(cart)} · {plural(p.items.length, 'item')}</Txt>
    </Pressable>
  );

  if (!checked || !result) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>{billCard}</View>
        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 16 }}><Keypad onKey={k => setVal(v => pressKey(v, k, 6))} /></View>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
          <PrimaryButton label="Check bill" height={62} disabled={bill == null} onPress={() => setChecked(true)}
            right={<ArrowRight size={22} strokeWidth={2.5} color={c.onYellow} />} />
        </View>
      </View>
    );
  }

  const recheck = result.status === 'match' ? [] : recheckItems(p.items, p.lastPaise);
  return (
    <View style={{ flex: 1 }}>
      {header}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        {billCard}
        {result.status === 'match' ? (
          <View style={{ backgroundColor: c.mint, borderRadius: 28, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', gap: 8 }}>
            <Txt size={56} style={{ lineHeight: 60 }}>✅</Txt>
            <Txt w="800" size={30} color="mintInk" style={{ textAlign: 'center', lineHeight: 34 }}>Bill matches {formatINR(bill!)}</Txt>
            <Txt size={16} color="mintInk" style={{ opacity: 0.85, textAlign: 'center' }}>All {p.items.length} items accounted for. Added to {p.monthName} spend.</Txt>
          </View>
        ) : (
          <>
            <View style={{ backgroundColor: c.chiliSoft, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Txt size={40} style={{ lineHeight: 44 }}>❌</Txt>
              <Txt w="800" size={22} color="chiliInk" style={{ flex: 1, lineHeight: 26 }}>
                Bill is {formatINR(result.diffPaise)} {result.status === 'over' ? 'more' : 'less'} than your cart
              </Txt>
            </View>
            <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 22 }}>
              <Txt w="700" size={15} style={{ paddingTop: 10, paddingBottom: 2 }}>Recheck these</Txt>
              {recheck.map(({ item, reason, lastPaise }, i) => (
                <RecheckRow key={item.id} first={i === 0} emoji={item.product?.emoji ?? '🛒'}
                  title={reason === 'changed' ? `${item.product?.name ?? 'Item'} × ${item.qty}` : `${item.product?.name ?? 'Item'} ${item.packSize}`}
                  sub={reason === 'changed' ? `Price changed ${formatINR(lastPaise!)} → ${formatINR(item.pricePaise)}` : 'Weighed item, price can vary'}
                  action="Edit" onPress={() => p.onEdit(item)} />
              ))}
              {result.status === 'over' && (
                <RecheckRow first={!recheck.length} emoji="🧾" title="Missed an item?" sub={`Look for ${formatINR(result.diffPaise)} on the bill`} action="Add" onPress={p.onAddMissed} />
              )}
            </Card>
          </>
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
        {result.status !== 'match' && <SecondaryButton label="Edit total" height={62} onPress={() => setChecked(false)} style={{ flex: 1, borderRadius: 20 }} />}
        <PrimaryButton label="Finish trip" height={62} center={result.status !== 'match'} disabled={p.busy} onPress={() => p.onFinish(bill!)}
          style={{ flex: 1.6 }} right={<Check size={22} strokeWidth={2.75} color={c.onYellow} />} />
      </View>
    </View>
  );
}

function RecheckRow({ emoji, title, sub, action, onPress, first }: { emoji: string; title: string; sub: string; action: string; onPress: () => void; first?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, borderTopWidth: first ? 0 : 1, borderTopColor: c.line }}>
      <EmojiTile emoji={emoji} size={42} r={13} />
      <View style={{ flex: 1 }}><Txt w="700" size={15}>{title}</Txt><Txt v="meta">{sub}</Txt></View>
      <Pressable onPress={onPress} style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: c.line, justifyContent: 'center' }}>
        <Txt w="600" size={14}>{action}</Txt>
      </Pressable>
    </View>
  );
}

