# Handoff: Rupli — grocery shopping & spend tracking (Android)

## Overview
Rupli is a grocery list, in-store cart and spend tracker for Indian households. It's aimed at Gen Z and young millennials who do the family's monthly kirana shopping. This bundle covers 21 screens across onboarding, lists, the product picker, in-store cart mode, bill check, compare, spend and empty states, plus a design-system sheet.

## About the design files
The files here are **design references built in HTML**. They're prototypes that show the intended look and behaviour, not production code to ship. Recreate them in the target codebase using its existing framework and patterns. If there isn't a codebase yet, pick a suitable stack: Jetpack Compose (native Android) or React Native/Expo both fit, and Compose with Material 3 matches the nav and sheet patterns most closely.

To view the files, open `Rupli App v2.dc.html` in a browser, keeping `support.js` and `RupliNav2.dc.html` alongside it. Every screen is a 390×844 frame on one canvas. Each screen root carries `data-screen-label="NN Name"`.

## Fidelity
**High-fidelity.** Colors, type, radii, spacing, copy and interactions are final. Recreate them pixel-accurately.

## Global layout
- Frame: 390×844 dp. Status bar 36 dp. Android gesture bar 20 dp at the bottom.
- Screen side margin: **16 dp** for content. Headers and status bar use 20–24 dp.
- Primary CTA always sits in the bottom third (thumb zone), above the bottom nav where there is one.
- Min tap target: **48 dp**. Primary buttons are 58–62 dp tall.
- All money is formatted Indian-style: `₹1,25,000` (`toLocaleString('en-IN')`). No decimals unless needed.
- Item names are in English with a muted Hindi/Marathi alias: `Milk · doodh`.
- Product icons are emoji (🥛 🌾 🫘 🧅 🧺 🥚 …). No photography.

## Design tokens

### Colors — light
| Token | Hex | Use |
|---|---|---|
| bg | #FFF6E6 | Cream app ground |
| card | #FFFFFF | Cards, sheets, nav |
| soft | #F6EBD5 | Emoji tiles, steppers, keypad keys, input fills |
| ink | #14211B | Text, selected chips, CTA edge |
| mute | #5A675F | Secondary text (≈5:1 on bg) |
| line | #E8DBC1 | 1.5 dp card borders, dividers |
| green | #0F5C3E | Brand: hero cards, selected tiles/packs, checkboxes, + button |
| on-green | #FFF6E6 | Text on green |
| yellow | #FFC531 | Primary CTA fill, active nav pill, highlights on green |
| on-yellow | #14211B | Text on yellow |
| chili | #E0401F | "Paid more" warning chip, mismatch border |
| chili-soft | #FFE2D9 | Offline banner, mismatch panel |
| chili-ink | #992810 | Text on chili-soft |
| mint | #D9F1E2 | In-cart tiles, done tags, brand chips, success panel |
| mint-ink | #0F5C3E | Text on mint |
| edge | #14211B | CTA border + hard shadow |

### Colors — dark
bg #0D1511 · card #17221C · soft #1F2D26 · ink #F4EDDF · mute #A4B0A8 · line #2B3A31 · green #17734E · on-green #F4EDDF · yellow #FFC531 (unchanged) · chili #FF6B4E · chili-soft #3B1E17 · chili-ink #FFB5A4 · mint #163A2A · mint-ink #8FE0B0 · edge #000000

Chart/donut category colors: Dairy #0F5C3E, Atta & Rice #FFC531, Sabzi & Fruits #5FBF8A, Oil & Ghee #E0401F, Cleaning #F29E7E, Other #B9AE98.

### Typography
Font: **Anek Latin** (Google Fonts, variable: wdth 75–125, wght 300–800). Use tabular figures (`font-variant-numeric: tabular-nums` / `fontFeatureSettings "tnum"`) everywhere.
| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero numeral | 56–124 | 800 | width 112%, letter-spacing −0.02 to −0.03em, line-height 0.9 |
| Wordmark | 68–96 | 800 | width 125%, "rupli" + yellow ● |
| Screen title | 34–38 | 800 | line-height 1 |
| Section/sheet title | 21–28 | 800 | |
| Item name | 15–17 | 700 | alias inline at 400, mute color |
| Body | 15–17 | 400–500 | |
| Meta | 12–14 | 400–600 | mute |
| Chip/badge | 12–14 | 600–800 | |

### Radii
Emoji tile 12–16 · input/segment 14 · button 18–20 · card 22–24 · hero card 26–28 · sheet top 32 · pills/chips 999 · frame 28.

### Shadows / borders
- Primary CTA: 2 dp `edge` border + `0 4dp 0 edge` hard offset shadow (no blur).
- Cards: 1.5 dp `line` border, no shadow.
- Sticky bottom bars: `0 -8dp 24dp rgba(20,33,27,.08)`.
- Sheets: 50% scrim `rgba(10,18,14,.5)`.

### Spacing
4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 32. Gap between cards: 10–12. Card padding: 14–18.

## Components
- **Primary button**: yellow, ink text 18–19/700, edge border + hard shadow, label left and arrow/check icon right (`space-between`), 60–62 tall.
- **Secondary button**: card fill, 1.5 line border, 16/600, 56–62 tall.
- **Dashed add button**: 2 dp dashed line border, green text, "+ Add item not on list".
- **Chip (brand)**: 48 tall pill, 1.5 line border. Selected: ink fill, bg text, 700.
- **Category tab**: 44 tall pill, horizontal scroll. Active: ink fill.
- **Pack-size card**: 64 tall, radius 18, label 18/700 + price 13. Selected: green fill.
- **Stepper**: 44 tall pill on `soft`; − is a 40 dp white circle, + is a 40 dp green circle; qty 16/800 between. The large sheet variant uses 48 dp buttons and a 28 numeral.
- **Checkbox**: 26 dp circle. Off: 2 dp mute ring. On: green fill + white check.
- **Toggle**: 52×32 pill. On: green track, knob right.
- **List row**: grid `32 | 44 | 1fr | auto`, min-height 72: checkbox, emoji tile (44, radius 14, soft), name + alias / pack + brand chip (mint pill) + "Last ₹68", stepper.
- **Bottom nav** (`RupliNav2`): 76 tall, card bg, 1.5 line top border, 4 equal cells (Home · Lists · Compare · Spend), icon above label centered. Active: a 60×32 yellow pill behind the icon, label 13/700. Inactive: mute, 13/500.
- **Bottom sheet**: card bg, 32 top radius, 40×4 handle, 20 side padding.
- **Numeric keypad**: 3×4 grid, gap 8, keys 60 tall, radius 18, soft fill, 28/700. Keys are 1–9, C, 0, ⌫.
- **Offline banner**: chili-soft pill (radius 16) with a wifi-off icon and "**Offline:** changes will sync".
- **Source badges**: soft pills `🛒 Cart`, `💬 SMS`, `✍️ Manual`.
- Icons: Lucide (round caps), stroke 2–2.75.

## Screens
01 **Sign in**: green top panel (bottom radius 32) with scattered rotated emoji tiles and a ₹ chili tile, the wordmark, and the pitch "The monthly kirana, listed, shopped and tracked with one hand." Below it: Continue with Google (secondary), "or" divider, email input (56, radius 18), Send OTP (primary), terms line.
02 **Email OTP**: back button, 📬 mint tile, "Check your email", six 64-tall boxes (filled = green border, active = ink border + yellow 4 dp ring), "Resend code in 0:24", Verify (disabled at 50%), "Use a different email".
03 **App lock**: the app blurred (10 px) behind a bottom sheet with a 104 dp yellow fingerprint circle (with a 10 dp yellow halo at 30%), "Unlock Rupli", "Touch the fingerprint sensor", Use PIN instead.
04 **SMS explain**: step dots, Skip. Title, then a sample SMS bubble → arrow → parsed card (Zepto ₹486, HDFC ••1234). Three points: reads debit alerts / raw SMS never leave the phone / skips OTPs. Allow SMS access (primary), Not now.
05 **SMS permission**: Android system dialog over a scrim. "Allow Rupli to send and view SMS messages?" with Allow (green pill) and Don't allow.
06 **SMS progress**: green panel with "Reading last 6 months…", a live counter (yellow, 124) up to 342, "transactions found", a yellow progress bar and the month label. Category tally card below. "Running on this phone. Raw SMS stay here." and Continue in background.
07 **Home**: "Namaste, Aarti" + AK avatar. Green hero: "October grocery spend" ₹8,420, chip "▼ ₹685 less" + "than Sep · ₹9,105". List card: "Oct 2026 · Monthly Kirana", est ₹6,850, 12/40 items, progress 30%, "Open list →". Two quick tiles: Compare (mint) and Spend (soft). Recent trips card. Primary "Start shopping" in a sticky bottom area, then the nav.
08 **Lists**: active list as a green card (Shopping badge, ₹6,850 est., progress). Draft and done lists as white cards with an emoji tile and status pill. Bottom: New list (secondary) + Copy last month's list (primary, 2:1).
09 **List detail**: header back / title / more. Green summary card: estimated total (live), picked count in yellow, progress. Items grouped in one white card per category with an "x/y" picked count. Sticky bottom: Add items (secondary) + Start shopping (primary).
10 **Product picker**: search pill with a green 2 dp border ("Search milk, doodh, dahi…"). "Your usual" horizontal row (selected tiles are green with a yellow qty badge). Category tabs: Dairy, Atta & Rice, Dal, Oil & Ghee, Masala, Sabzi, Fruits, Bakery & Eggs, Snacks, Beverages, Dry Fruits, Cleaning, Personal Care, Pooja, Baby, Kitchen. 3-column tile grid (112 tall, emoji 34, name, alias; selected = 2.5 dp green border + count badge). Sticky ink bar: "6 items selected · est. ₹3,198" + yellow Done.
11 **Pack sheet**: 🥛 Milk · doodh, "Last paid ₹68 · Amul 1 L · 28 Sep". Pack size cards 500 ml ₹34 / 1 L ₹68 / 6 L ₹396. Brand chips Amul / Mother Dairy / Gokul / Any. Quantity stepper. "Add to list" with the live total (price × qty).
12 **Cart mode**: green sticky header: "In store · DMart, Kothrud", pause button, total ₹2,348 (86), pills "18 in cart" (yellow) and "22 to pick". Offline banner (optional). "To pick" card (rows open the price sheet; last price + chevron on the right; dashed "Add item not on list"). "In cart" card (green check, mint tile, price paid). Primary "At the counter".
13 **Price keypad**: sheet over the dimmed cart. 🫘 Toor Dal · arhar, "1 kg × 2 · any brand". Soft display panel: "Price each" with a live price (76) and a green caret. Chip: chili "▲ ₹12 more than last time" when higher, mint "▼ ₹X less…" when lower, neutral "Same as last time" when equal. Line "2 × ₹177 = ₹354". Keypad. "Add to cart ₹354".
14 **Bill match**: bill total card (green border) ₹2,348, "Your cart: ₹2,348 · 18 items". Mint panel with ✅ "Bill matches ₹2,348". Finish trip.
15 **Bill mismatch**: bill ₹2,371 (chili border). Chili-soft panel ❌ "Bill is ₹23 more than your cart". "Recheck these" card: Toor Dal × 2 (price changed ₹165 → ₹177), Onion 2 kg (weighed item), Missed an item? (look for ₹23) with Edit/Add pills. Edit total + Finish trip.
16 **Compare**: "+ Option" pill (up to 4 options). Option cards: letter circle, editable name, qty input, unit segment g/kg/ml/L/pcs, ₹ price input. The cheapest card gets a 2.5 dp green border and a yellow "⭐ Best value" badge. Green result card: winner name, "saves ₹9/L · 5.5%" in yellow, a per-unit bar per option (best = yellow bar). Primary "Add winner to list". Nav.
17 **Spend**: month selector pill ‹ Oct 2026 ›. Green card: ₹8,420, "▼ 7.5%" chip, "₹685 less than Sep", 6-month bars May–Oct (current = yellow). Donut card (conic, 104 dp) + legend. Transactions card with source badges. Floating yellow "+ Add expense" pill above the nav.
18 **Transaction detail**: 🛵 mint tile, ₹486, Zepto, "Yesterday, 7:42 pm", "💬 From SMS" badge. Details card: Account HDFC Bank ••1234, UPI ref 427519830042. Category grid 3×2 (Groceries, Food delivery, Household, Health, Pooja, Fuel; selected = green). Toggle row "Always categorise Zepto as {category}". Save.
19–21 **Empty states** for Lists ("No lists yet" → Make your first list), Spend ("No spends in October yet" → Add expense / Import SMS) and Compare ("Which pack is cheaper?" → Start comparing). Each has a centered emoji illustration, title 28/800, body 17 mute, and the nav.

## Interactions & behaviour
- **List detail**: the checkbox toggles picked. The stepper changes qty (min 1). The header estimate and picked count recompute live: `est = Σ(lastPrice × qty) + rest of list`.
- **Pack sheet**: single-select pack and brand. qty ± (min 1). CTA total = pack price × qty.
- **Price keypad**: digits append (max 5), C clears, ⌫ deletes. It opens prefilled with the last paid price. The chip compares the new price to the last price. CTA = price × qty.
- **Compare**: per-unit price = price ÷ quantity, after converting g→kg and ml→L ÷1000; pcs gives per piece. Best = lowest per-unit. Saving = second-best − best, in ₹ and as a % of second-best, to 1 decimal. Needs ≥2 valid options.
- **Bill check**: if the bill equals the cart total, show the match state. If not, show the difference, and list items whose price changed, weighed items and a "missed item" prompt.
- **Transaction**: picking a category updates the toggle label. The toggle creates a merchant → category rule.
- **SMS import**: the count animates up as messages are parsed on the device. Only parsed fields are stored.
- **Offline**: show the banner under the cart header and queue changes for sync.
- Pressed states: keypad key → `line` fill. Inactive nav → ink on hover/press.
- **Dark mode**: swap to the dark token set. Yellow CTAs stay yellow.

## State (suggested)
`lists[]`, `activeList{items[{id, name, alias, emoji, category, pack, brand, lastPrice, qty, picked}]}`, `cart{toPick[], inCart[{itemId, pricePaid}], total}`, `picker{selected[], query, category}`, `compareOptions[{name, qty, unit, price}]`, `spend{month, total, prevTotal, byCategory[], transactions[{amount, merchant, account, upiRef, source: cart|sms|manual, category}]}`, `merchantRules{merchant: category}`, `smsImport{status, count, month}`, `isOffline`, `theme`.

## Sample data
List "Oct 2026 · Monthly Kirana": Milk 1 L × 30 (Amul, ₹68), Aashirvaad Atta 10 kg (₹485), Toor Dal 1 kg × 2 (₹165), Fortune Sunflower Oil 5 L (₹780), Tata Salt 1 kg (₹28), Onion 2 kg (₹60), Surf Excel 1 kg (₹140), Eggs 30 (₹210). Spend ₹8,420 vs ₹9,105. Compare: Fortune 1 L ₹165, Fortune 5 L ₹780, Saffola 1 L ₹199.

## Assets
No image assets. Product icons are system emoji. UI icons are Lucide (lucide.dev). The font is Anek Latin from Google Fonts. The Google "G" in the prototype is a placeholder; use the official Google sign-in asset.

## Files
- `Rupli App v2.dc.html`: all screens + the design-system sheet (inline styles; the logic class at the bottom holds the sample data and interaction logic).
- `RupliNav2.dc.html`: the bottom nav component (prop `active`: home | lists | compare | spend).
- `support.js`: the runtime needed to open the HTML files in a browser.
