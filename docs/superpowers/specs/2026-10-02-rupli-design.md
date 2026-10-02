# Rupli — Design Spec

Date: 2026-10-02 · Status: approved (design approved 2026-10-02)

## 1. Intent

Rupli is an Android app for an Indian household that makes grocery shopping fast and
accurate, and grows into a full personal-finance tracker.

- **Who:** the owner first (sideloaded APK on their own phone); Play Store later.
- **Success looks like:**
  - Building a monthly kirana list takes a few taps, mostly no typing.
  - At the billing counter the cart total is already known, so a wrong bill is caught instantly.
  - Monthly grocery spend is visible without manual bookkeeping.
  - Bank/UPI SMS turn into categorised transactions automatically, without double counting
    cart trips.

**Name:** Rupli (from *rupee*). Checked against Play Store / web on 2026-10-02 — no app with
this name found. Domain and trademark not yet checked.

## 2. Scope

### v1
1. **Product catalog & picker** (§4.1)
2. **Lists**, including monthly lists and "copy last month" (§4.2)
3. **Cart mode** with running total and bill check (§4.3)
4. **Compare** price-per-unit (§4.4)
5. **Spend** dashboard (§4.5)
6. **SMS reader** for bank/UPI transactions, Android only (§4.6)
7. **App lock** with biometric/device PIN (`expo-local-authentication`)
8. **Auth** with Clerk (Google + email OTP)

### Later (data model leaves room, nothing built)
Bill/EMI reminders, account balances from SMS, budgets, shared family lists, Play Store release
(needs the SMS permission declaration).

### Explicitly out
Loan offers, ads, web app, iOS.

## 3. Process gate

1. This spec is reviewed and approved.
2. **The owner designs the frontend in Claude Design (claude.ai/design)** using
   `docs/design/claude-design-brief.md`, and approves the screens.
3. Implementation plan is written against the approved design.
4. Implementation.

**Step 2 is done.** The owner approved the Claude Design handoff in `docs/design/handoff/`
(`README.md` is the source of truth for tokens, components, screens and interactions;
`Rupli App v2.dc.html` is the visual reference with 21 screens, served via `.claude/launch.json` → `design`).
The frontend must match it pixel-accurately (high fidelity).

### Design implementation notes
- Theme tokens (light + dark) from the handoff README become one `app/src/theme.ts`, switched by
  the system color scheme.
- Font: Anek Latin from `@expo-google-fonts/anek-latin`; tabular numbers everywhere (`fontVariant: ['tabular-nums']`).
- Icons: `lucide-react-native`. Product icons: system emoji.
- Bottom sheets: `@gorhom/bottom-sheet`. Charts: the 6-month bars and the donut are simple
  `react-native-svg` drawings (no chart library).
- Screens from the handoff map to v1 features: 01–03 auth/lock, 04–06 SMS import, 07 Home,
  08–09 lists, 10–11 picker, 12–15 cart and bill check, 16 compare, 17–18 spend/transactions,
  19–21 empty states.
- Additions taken from the design: list status (draft / shopping / done), pausing a trip, an
  "Edit total" option on bill mismatch, and showing the user's first name on Home (from Clerk).

## 4. Features

### 4.1 Product catalog & picker (Indian household, almost no typing)
- Seed catalog of about 400 items in these categories: Dairy · Atta, Rice & Grains · Dal & Pulses · Oil &
  Ghee · Masala & Spices · Sabzi · Fruits · Bakery & Eggs · Snacks & Biscuits · Tea, Coffee &
  Beverages · Dry Fruits · Cleaning & Laundry · Personal Care · Pooja Items · Baby Care · Kitchen
  Supplies.
- Each product has: English name, aliases (Hindi/Marathi transliterations: *doodh, chawal,
  shakkar, jeera, haldi, kanda, aloo, sabun…*), category, emoji icon, base unit (kg / L / pcs),
  common pack sizes (e.g. milk 500 ml / 1 L / 6 L; atta 1 / 5 / 10 kg; eggs 6 / 12 / 30), optional
  common brands (Amul, Mother Dairy, Gokul, Aashirvaad, Fortune, Saffola, Tata…).
- Picker: category tabs → tile grid → tap tile → pack-size chips + optional brand chips + qty
  stepper → added. Search matches name and aliases.
- "Your usual" row: the products this user has bought most, ranked by how often and how recently.
- The user can add a custom product once; it then appears in the picker like any other.

### 4.2 Lists
- Create, rename, archive, reorder; items have product, pack size, brand, qty, checked flag.
- Optional `month` tag (e.g. 2026-10).
- **Copy list:** "Copy last month" (the latest list with the previous month tag) or copy any
  list. Copies items/sizes/qty, everything unchecked, stores `copied_from`.
- Each item shows **last paid price** (latest `trip_item` for the same product + pack size).

### 4.3 Cart mode
- Start a trip from a list or empty; optional store name.
- Moving an item to the cart asks for the actual price. The field is **filled in with the last paid
  price**; the user edits it if the price changed. Items not on the list can be added through the picker.
- Live running total + item count always visible.
- Price-rise flag when the price is above the last paid price ("₹12 more than last time").
- **Bill check:** enter bill total → match ✅ or difference ❌ ±₹X; list of items to recheck.
- Finish trip → creates a `transaction` (source `cart`, category Groceries, `source_ref` = trip id).

### 4.4 Compare
- 2+ options, each: label, quantity + unit (g/kg, ml/L, pcs), price.
- Normalise to price per base unit (₹/kg, ₹/L, ₹/pc), mark cheapest, show saving in ₹ and %
  versus each other option. Example: 1 L ₹165 → ₹165/L; 5 L ₹780 → ₹156/L → 5 L is 5.5% cheaper.
- Options with incompatible units (kg vs L) are refused with a clear message.
- Not saved (YAGNI). "Add winner to list" action.

### 4.5 Spend
- Current-month grocery total, trip history, monthly trend chart (last 6–12 months), category
  breakdown across all transactions (cart + SMS + manual).
- Manual transaction entry (amount, category, note, date).

### 4.6 SMS reader (Android, sideload only for now)
- Requires a custom dev build (not Expo Go) with a small native module/config plugin for
  `READ_SMS` + `RECEIVE_SMS`.
- **Backfill:** on opt-in, read inbox SMS from the last N months (default 6). **Live:** handle incoming
  SMS via a broadcast receiver.
- Filter to financial senders (DLT sender IDs like `XX-HDFCBK`, `XX-SBIUPI`, etc.) and keywords
  (debited, credited, UPI, spent, Rs., INR).
- Parser (in `shared/`, pure function): amount, direction (debit/credit), merchant / VPA,
  UPI reference / txn id, account or card last-4, bank, timestamp. Returns `null` for OTPs,
  promos, and failed or declined transactions.
- Categorisation: user rules first (`category_rules`: keyword → category), then default
  merchant rules (Zepto/Blinkit/BigBasket/DMart → Groceries; Swiggy/Zomato → Food; Uber/Ola/Rapido
  → Transport; etc.), else Uncategorised. Re-categorising a transaction offers "always do this".
- Only parsed fields leave the phone; the raw SMS body is never uploaded.
- **Duplicate prevention:**
  - Unique `(user_id, source, source_ref)`: the same UPI ref is never inserted twice.
  - Cart link: an SMS debit within ±30 min of a finished trip, with the amount equal to the bill
    total, is linked to that trip's transaction (`linked_transaction_id`) and excluded from totals
    instead of being counted twice.

## 5. Architecture

```
Android app (Expo SDK latest, React Native, TypeScript, expo-router)
  ├─ Clerk (@clerk/clerk-expo) — Google + email OTP
  ├─ TanStack Query, cache persisted to device; mutations queued & retried offline
  ├─ SMS native module (config plugin)
  └─ expo-local-authentication app lock
        │ HTTPS, Authorization: Bearer <Clerk session JWT>
        ▼
https://137-23-49-189.sslip.io  → Caddy (auto Let's Encrypt TLS)
        ▼
API: Node 22 + Hono, systemd service, on Oracle VM "hermes-arm" (A1.Flex 4 OCPU / 24 GB, Ubuntu 24.04)
  ├─ Clerk JWT verification on every route; user_id = token `sub`
  ├─ zod validation on all input (schemas shared with the app)
  └─ Drizzle ORM → PostgreSQL 18 @ localhost:5433, db `rupli`, role `rupli`
```

- Repo: npm workspaces — `app/`, `api/`, `shared/` (zod schemas, unit maths, SMS parser,
  category rules).
- Postgres is never exposed publicly. Connection string lives in `.env.vm` locally (gitignored)
  and in the API's environment file on the VM.
- No local-only storage of user data: Postgres is the source of truth; the device cache only lets
  the app keep working offline.

### Infrastructure state (as of 2026-10-02)
- Done: PostgreSQL 18 (PGDG) installed on port 5433, localhost-only, scram auth, tuned
  (shared_buffers 2 GB, effective_cache_size 8 GB, SSD costs, zstd WAL, pg_stat_statements);
  `rupli` db + role created. The pre-existing Hermes "hindsight" Postgres on 5432 is untouched.
- Pending (needs owner approval): nightly `pg_dumpall` cron with 14-day retention; opening
  80/443 in the OCI security list and iptables for Caddy.

## 6. Data model (money = integer paise, timestamps = timestamptz)

| Table | Key columns |
|---|---|
| `users` | `id` (Clerk user id, pk), `created_at` |
| `products` | `id`, `user_id` (null = global seed), `name`, `aliases text[]`, `category`, `emoji`, `base_unit` (kg/L/pcs), `pack_sizes jsonb`, `brands text[]` |
| `lists` | `id`, `user_id`, `name`, `month` (date, nullable), `status` (draft/shopping/done), `copied_from` (fk lists), `archived_at`, `created_at` |
| `list_items` | `id`, `list_id`, `product_id`, `pack_size`, `brand`, `qty`, `checked`, `position` |
| `trips` | `id`, `user_id`, `list_id` (nullable), `store`, `started_at`, `paused_at`, `finished_at`, `bill_total_paise` |
| `trip_items` | `id`, `trip_id`, `product_id`, `pack_size`, `brand`, `qty`, `price_paise`, `list_item_id` (nullable) |
| `accounts` | `id`, `user_id`, `bank`, `last4`, `type` (bank/card/wallet) |
| `categories` | `id`, `user_id` (null = default), `name`, `emoji` |
| `category_rules` | `id`, `user_id`, `pattern`, `category_id` |
| `transactions` | `id`, `user_id`, `amount_paise`, `direction` (debit/credit), `occurred_at`, `merchant`, `category_id`, `account_id`, `source` (manual/cart/sms), `source_ref`, `trip_id`, `linked_transaction_id`, `note`; unique (`user_id`,`source`,`source_ref`) |

Every query is scoped by `user_id` from the verified token; child rows (`list_items`,
`trip_items`) are reached only through a parent owned by the user.

## 7. Error handling
- API returns `{ error: { code, message } }` with proper HTTP status; never leaks stack traces.
- The app shows inline errors and keeps unsynced changes queued; never drops user input.
- SMS parse failure → skipped and counted (visible "N messages not understood" in settings).
- Amounts are always integer paise; parsing rejects anything ambiguous.

## 8. Testing
- **Vitest (shared):** unit conversion + compare, cart total and bill diff, SMS parser with
  about 30 real-format fixtures (SBI, HDFC, ICICI, Axis, Kotak, Paytm, PhonePe, GPay, including OTP,
  promo and failed-transaction negatives), categoriser, duplicate/link matcher.
- **API:** route tests against a throwaway test database on the VM Postgres, covering auth rejection and
  cross-user access denial.
- **Device:** APK built locally (if the Android SDK is available) or with EAS Build, sideloaded on the owner's
  phone.

## 9. Open items
- Domain/trademark check for "Rupli".
- Owner approval for backup cron and opening ports 80/443.
- Android SDK availability on the dev machine, which decides between a local build and EAS Build.
