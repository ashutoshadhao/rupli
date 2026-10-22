# Rupli Plan 2: Android App (Expo)

> Executed natively (superpowers:executing-plans). **No git operations** (owner's instruction): skip every commit step and track progress in the ledger only.

**Goal:** The Rupli Android app with every v1 screen from the approved Claude Design handoff (screens 01–03 and 07–21), wired to the Plan 1 API, so the owner can sideload and use it.

**Architecture:** An Expo SDK 57 app in the `app/` workspace, using expo-router (file-based routes). It reuses `@rupli/shared` for maths, schemas and the catalog. `@clerk/expo` handles sign-in. TanStack Query talks to the API, with its cache persisted to AsyncStorage so the app keeps working offline. Changes queue and replay when the network returns. During development, react-native-web renders the same screens in the browser pane for pixel checks against the handoff.

**Tech Stack:** Expo 57, expo-router, TypeScript, @clerk/expo, @tanstack/react-query + persist-client, @react-native-async-storage/async-storage, @expo-google-fonts/anek-latin, lucide-react-native + react-native-svg, expo-local-authentication, @react-native-community/netinfo, Vitest for pure view logic.

**Spec:** `docs/superpowers/specs/2026-10-02-rupli-design.md` · **Design (source of truth):** `docs/design/handoff/README.md` + `Rupli App v2.dc.html`

## Global Constraints
- Every colour, radius, size and spacing comes from the handoff tokens, via `app/src/theme.ts` only. No hex values inside screens.
- Font: Anek Latin. Every number uses `fontVariant: ['tabular-nums']`.
- Money is shown with `formatINR` from `@rupli/shared`, and the client never does float maths on paise.
- Minimum tap target 48 dp. Primary CTAs sit in the bottom third.
- Light and dark mode follow the system setting; yellow CTAs stay yellow in both.
- Copy is taken word for word from the handoff.
- SMS screens 04–06 belong to **Plan 3** and are not built here.
- Env: `EXPO_PUBLIC_API_URL` (default `https://137-23-49-189.sslip.io`) and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, kept in `app/.env` (gitignored).

## Review Focus
1. **Offline in the store:** with the network off in cart mode, adding items and prices still works, the offline banner shows, and nothing is lost when the app comes back online.
2. **Price keypad:** at most 5 digits; C and ⌫ on an empty value; the opening value is the last paid price; 0 is never accepted as a price.
3. **Copy last month:** with no list from last month, the button is hidden or disabled, never a crash.
4. **Compare inputs:** empty or zero fields never show ₹NaN or ₹Infinity.
5. **Paused trip:** after killing and relaunching the app mid-trip, it reopens in the open trip (needs `GET /v1/trips/open`).

---

### Task 1: API: open-trip endpoint
`GET /v1/trips/open` returns the latest unfinished trip with its items, or `null`.
- Test: no open trip → `null`; after starting a trip → that trip; once finished → `null`; another user's trip → `null`.
- Files: `api/src/routes/trips.ts` (register **before** `/:id`), `api/test/trips.test.ts`.

### Task 2: App scaffold, theme, fonts, base components
**Files:** `app/` (create-expo-app, default template trimmed), `app/src/theme.ts`, `app/src/ui/*.tsx`, `app/app/dev/ds.tsx`, `app/src/logic/keypad.ts` + `app/test/keypad.test.ts`
- Theme: the light and dark token sets copied verbatim from the README, plus radii, spacing, type scale and chart colours. `useTheme()` reads `useColorScheme()`.
- Components, built to the README specs:
  - `Txt` (variants: hero, title, section, item, body, meta, chip)
  - `PrimaryButton` (yellow, 2 dp edge border, hard 4 dp offset shadow, label left with icon right)
  - `SecondaryButton`, `DashedAddButton`
  - `Chip`, `CategoryTab`, `PackCard`
  - `Stepper` (normal and large), `Checkbox`, `Toggle`
  - `Card`, `HeroCard`, `EmojiTile`, `ListRow`
  - `Sheet` (RN `Modal`, 32 top radius, handle, scrim), `Keypad`
  - `BottomNav` (4 tabs, yellow pill), `OfflineBanner`, `SourceBadge`
- `keypad.ts`: pure `pressKey(value: string, key: '0'..'9'|'C'|'⌫', maxDigits = 5): string`. Tests: digits append, max 5, C clears, ⌫ deletes, ⌫ on empty stays empty, leading zeros dropped ('0' then '5' → '5').
- Verify: `npx expo start --web`, then `/dev/ds` in the browser pane next to the handoff design-system sheet. The colours, type and component shapes must match.

### Task 3: Data layer + auth + app lock (screens 01, 02, 03)
**Files:** `app/src/api.ts`, `app/src/query.ts`, `app/app/_layout.tsx`, `app/app/(auth)/sign-in.tsx`, `app/app/(auth)/otp.tsx`, `app/src/lock.tsx`
- `api.ts`: `useApi()` returns typed fetchers for every Plan 1 route. Each request is `fetch(API_URL + path)` with the `Authorization: Bearer ${await getToken()}` header. An error body is thrown as an `ApiError{status, code, message}`.
- `query.ts`: QueryClient plus `PersistQueryClientProvider` (AsyncStorage persister, 7-day maxAge). Mutations get `networkMode: 'offlineFirst'`, NetInfo is wired to `onlineManager`, and paused mutations are resumed on launch with `resumePausedMutations`.
- Sign-in (01): green top panel with the scattered rotated emoji tiles, the wordmark and the pitch copy. "Continue with Google" (Clerk `useSSO` with the `oauth_google` strategy), an email field, and "Send OTP" (Clerk `signIn.create({ identifier, strategy: 'email_code' })`, falling back to sign-up when the account doesn't exist).
- OTP (02): 6 boxes, resend countdown from 0:24, Verify button disabled until all 6 digits are in.
- App lock (03): on app foreground after more than 30 s in the background, show the blurred app behind a fingerprint sheet (`expo-local-authentication`), with "Use PIN instead" (`disableDeviceFallback: false`).
- Routing: signed out → `(auth)`; signed in → `(tabs)`.

### Task 4: Home, Lists, List detail, Lists empty (07, 08, 09, 19)
**Files:** `app/app/(tabs)/_layout.tsx` (custom `BottomNav` tab bar), `(tabs)/index.tsx`, `(tabs)/lists.tsx`, `app/app/list/[id].tsx`, `app/src/logic/lists.ts` + test
- Home:
  - Greeting with the Clerk first name and initials avatar.
  - Hero card: this month's spend from `GET /spend`, with the ▼/▲ chip compared with last month.
  - Active list card: name, estimate, done/total count, progress bar.
  - Compare and Spend quick tiles.
  - Recent trips (`GET /trips?limit=3`).
  - Sticky "Start shopping", which starts a trip from the active list.
- Lists:
  - The list in "shopping" status is the green card; draft and done lists are white cards with a status pill.
  - "Copy last month's list" copies the latest list whose month is the previous calendar month; it's disabled when there is none.
  - "New list" names the list "<Mon YYYY> · Monthly Kirana" by default.
- List detail: items grouped by product category (one card each, with an x/y count), checkbox and stepper updated optimistically, live estimate.
- `logic/lists.ts`: `previousMonthList(lists, today)`, `groupByCategory(items)`, `defaultListName(date)`, with tests.

### Task 5: Product picker + pack sheet (10, 11)
**Files:** `app/app/list/[id]/add.tsx`, `app/src/logic/picker.ts` + test
- Search uses `searchProducts` on cached products. The "Your usual" row comes from `/products/usual`. There are 16 category tabs and a 3-column tile grid; selected tiles get a green border and a count badge.
- Pack sheet: pack-size cards (each shows the last price when known), brand chips plus "Any", stepper, and "Add to list ₹X" (price × qty, or no price when unknown).
- Sticky ink bar: "N items selected · est. ₹X" with a Done button. Done posts the selections to `/lists/:id/items`.
- `picker.ts`: a selection reducer (add, update, remove) and `selectionEstimate`, with tests.

### Task 6: Cart mode, price keypad, bill check (12, 13, 14, 15)
**Files:** `app/app/trip/[id].tsx`, `app/app/trip/[id]/bill.tsx`, `app/src/logic/cart.ts` + test
- Cart header: "In store · {store}", pause toggle, running total from `cartTotal`, "N in cart" and "M to pick" pills. The offline banner shows when NetInfo reports offline.
- Tapping a "To pick" row opens the price sheet. The keypad (`pressKey`) opens with the last paid price filled in, and the chip comes from `priceDelta`. "Add to cart ₹X" posts to `/trips/:id/items` (an optimistic update).
- "Add item not on list" opens the picker in trip mode.
- Bill: a keypad for the bill total. `billCheck` decides between the match and mismatch states. The mismatch "Recheck these" list shows items whose price changed versus the last price, weighed items (kg units), and a "Missed an item? look for ₹X" row. "Finish trip" posts `/trips/:id/finish` and returns Home.
- On launch, if `GET /trips/open` returns a trip, route straight to it.
- `logic/cart.ts`: `splitToPickInCart(listItems, tripItems)` and `recheckItems(tripItems, lastPrices)`, with tests.

### Task 7: Compare (16, 21)
**Files:** `app/app/(tabs)/compare.tsx`
- 2–4 option cards (letter, name, qty, g/kg/ml/L/pcs segment, ₹ price), local state only, results from `compare()`. Best value gets the badge and the saving line ("saves ₹9/L · 5.5%"), plus per-unit bars.
- "Add winner to list" opens the picker search filled with the winner's name.
- The empty state (21) shows until an option is started.

### Task 8: Spend + transaction detail + add expense (17, 18, 20)
**Files:** `app/app/(tabs)/spend.tsx`, `app/app/txn/[id].tsx`, `app/app/txn/new.tsx`, `app/src/logic/spend.ts` + test
- Month switcher. The green card shows the total, the % chip and 6 SVG bars (the current month in yellow). The donut is `react-native-svg` arcs grouped as Dairy / Atta & Rice / Sabzi & Fruits / Oil & Ghee / Cleaning / Other. The transaction list has source badges. "+ Add expense" is a floating pill.
- Transaction detail: a 3×2 category grid plus "More". The "Always categorise {merchant} as {category}" toggle sends a PATCH with `makeRule`.
- Add expense: keypad amount, category grid, optional note, date (today by default).
- `logic/spend.ts`: `groupDonut(byProductCategory)` and `pctChange(cur, prev)`, with tests (prev = 0 gives null and no "Infinity%").

### Task 9: Android APK
- `app.json`: name Rupli, package `app.rupli`, icon and splash from the brand colours.
- Build: EAS Build (`eas build -p android --profile preview` → APK). This needs the owner's free Expo account login. The alternative is installing the Android SDK command-line tools locally and running `npx expo run:android --variant release`. **Ask the owner which before starting.**
