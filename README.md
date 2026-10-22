<div align="center">

# rupli●

**Grocery shopping and spend tracking for Indian households.**

Build your monthly kirana list in a few taps. Know the cart total before you reach the counter. Catch a wrong bill right away. See where your money went.

![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)

</div>

---

## Table of contents

- [Why Rupli](#why-rupli)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Deployment](#deployment)
- [Design](#design)
- [Roadmap](#roadmap)

---

## Why Rupli

The name comes from *rupee*. The app targets four everyday problems:

| Problem | What Rupli does |
|---|---|
| Typing out the monthly grocery list takes too long | A catalog of 264 Indian products with Hindi and Marathi aliases (*doodh, chawal, kanda, jeera…*), plus "Copy last month" |
| You find out the total only at the billing counter | Cart mode keeps a running total while you shop |
| Billing mistakes go unnoticed | Bill check compares the bill with your cart and lists the items to recheck |
| You don't know your monthly grocery spend | A spend dashboard with a 6-month trend, a category donut, a budget, and CSV/PDF export |

---

## Features

### 🛒 Product catalog and picker
- **264 seeded products** in 16 categories: Dairy, Atta & Rice, Dal, Oil & Ghee, Masala, Sabzi, Fruits, Bakery & Eggs, Snacks, Beverages, Dry Fruits, Cleaning, Personal Care, Pooja, Baby, Kitchen.
- Each product has an emoji icon, common pack sizes (e.g. milk 500 ml / 1 L, atta 1 / 5 / 10 kg) and popular brands (Amul, Aashirvaad, Fortune, Tata…).
- Search matches English names and regional aliases.
- A **"Your usual"** row ranks the products you buy, by how often and how recently.
- You can add your own products, and they appear in the picker like any other.

### 📝 Lists
- Lists can be tagged with a month, and each has a status: draft, shopping or done.
- **Copy last month** clones the previous month's list with every item unchecked.
- Every item shows its **last paid price**, and each list shows an estimated total.
- **Shared family lists:** the owner creates a 6-character invite code, and family members join with it.

### 🧾 Cart mode and bill check
- Start a trip from a list, or with an empty cart.
- When an item goes into the cart, the price keypad opens **pre-filled with the last paid price**.
- If an item costs more than last time, the app flags it, e.g. "₹12 more than last time".
- The running total and the in-cart / to-pick counts are always on screen.
- **Bill check:** enter the bill total and Rupli shows either ✅ match or ❌ ±₹X with a list of items to recheck.
- Pause a trip and come back to it later. If the app is killed mid-shop, it reopens on the unfinished trip.
- Finishing a trip records a Groceries transaction automatically.

### ⚖️ Compare
- Compare 2–4 pack options by price per unit (₹/kg, ₹/L, ₹/pc).
- The app marks the best value and shows the saving, e.g. *5 L at ₹780 is 5.5% cheaper than 1 L at ₹165*.
- Options with incompatible units, like kg vs L, are refused with a clear message.

### 📊 Spend
- Monthly grocery total and total spend, with ▲/▼ versus last month.
- 6-month bar chart and a category donut, both drawn with plain SVG.
- **Monthly grocery budget** with a progress bar on Home.
- **Manual expenses** and **recurring monthly bills** (rent, EMI, subscriptions…), which are added automatically on their due day.
- Recategorise any transaction, with an optional "always categorise this merchant as…" rule.
- **Export** a month as CSV or as a formatted PDF report.

### 📶 Works offline
- The TanStack Query cache is saved on the device, so screens still load without a network.
- Changes made offline are queued and sent when the connection returns. Nothing you type is lost in a store with bad signal.

---

## How it works

```mermaid
flowchart TD
    subgraph Phone["📱 Android app (Expo + React Native)"]
        UI[expo-router screens]
        Q[TanStack Query<br/>persisted cache + offline queue]
        C[Clerk<br/>Google / email OTP]
        UI --> Q
        UI --> C
    end

    subgraph Shared["📦 @rupli/shared"]
        S1[money · units · compare]
        S2[cart total · bill check]
        S3[catalog · zod schemas]
        S4[SMS parser · categoriser]
    end

    subgraph Server["☁️ Server"]
        CAD[Caddy<br/>auto HTTPS]
        API[Hono API on Node<br/>systemd service]
        DB[(PostgreSQL 18<br/>localhost only)]
        CAD --> API --> DB
    end

    Q -- "HTTPS + Bearer Clerk JWT" --> CAD
    UI -.uses.-> Shared
    API -.uses.-> Shared
```

- **One source of truth:** user data lives in Postgres. The cache on the device only makes the app work offline.
- **Shared logic:** the app and the API use the same zod schemas and maths from `shared/`, so the totals they compute always agree.
- **Money is always integer paise:** there is no floating-point arithmetic on money anywhere.
- **Every query is scoped to the signed-in user:** the user id comes from the verified Clerk token. Child rows such as list items and trip items are only reachable through a parent the user owns.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Mobile app** | Expo SDK 57, React Native 0.86, React 19, expo-router, TypeScript |
| **State and data** | TanStack Query + AsyncStorage persister, NetInfo |
| **Auth** | Clerk (`@clerk/expo` on the app, `@clerk/backend` on the API) |
| **UI** | Anek Latin font, lucide icons, react-native-svg charts, light and dark themes |
| **API** | Node, Hono, zod validation |
| **Database** | PostgreSQL 18 with Drizzle ORM and drizzle-kit migrations |
| **Hosting** | Linux VM, systemd, Caddy (automatic Let's Encrypt TLS) |
| **App delivery** | EAS Build / EAS Update (Android) |
| **Tests** | Vitest across all three workspaces |

---

## Repository layout

Rupli is an **npm workspaces** monorepo:

```
rupli/
├── app/                    # 📱 Expo Android app
│   └── src/
│       ├── app/            #    expo-router routes: (tabs), list, trip, txn, product, sign-in…
│       ├── screens/        #    screen components (home, lists, picker, cart, compare, spend, trips)
│       ├── ui/             #    design-system components (buttons, chips, sheets, keypad, nav)
│       ├── logic/          #    pure, unit-tested view logic (cart, keypad, lists, spend, sync…)
│       ├── api.ts          #    typed API client
│       ├── query.tsx       #    QueryClient, offline persistence, hooks
│       ├── theme.ts        #    colour, spacing and type tokens from the design handoff
│       └── export.ts       #    CSV / PDF export
│
├── api/                    # ⚙️ Hono REST API
│   ├── src/
│   │   ├── routes/         #    products, categories, lists, trips, transactions, spend, me, recurring
│   │   ├── lib/            #    auth, errors, last prices, recurring bills, months
│   │   ├── db/             #    Drizzle schema and client
│   │   ├── server.ts       #    production entry (Clerk JWT verification)
│   │   ├── dev-server.ts   #    local e2e entry (accepts the token "dev", CORS for web)
│   │   ├── migrate.ts      #    runs migrations and seeds the catalog
│   │   └── seed.ts
│   ├── drizzle/            #    SQL migrations
│   └── test/               #    route tests against a throwaway Postgres database
│
├── shared/                 # 📦 Code used by both the app and the API
│   └── src/
│       ├── money.ts        #    paise ↔ ₹ formatting (formatINR)
│       ├── units.ts        #    pack-size parsing, per-unit compare
│       ├── cart.ts         #    cart total, bill check, price delta
│       ├── catalog.ts      #    264-product seed catalog and search
│       ├── schemas.ts      #    zod request schemas
│       └── sms/            #    bank/UPI SMS parser, categoriser, duplicate matcher
│
├── deploy/                 # 🚀 systemd unit, Caddyfile, deploy script
└── docs/                   # 📚 design spec, implementation plans, design handoff
```

---

## Getting started

### Prerequisites
- **Node.js 22+** and npm
- **PostgreSQL** (any recent version; production runs 18)
- A **Clerk** application (for Google and email-code sign-in)
- Optional: an Android phone with **Expo Go**, or an emulator

### 1. Install

```bash
git clone https://github.com/ashutoshadhao/rupli.git
cd rupli
npm install
```

### 2. Set up the database

```bash
createdb rupli
export DATABASE_URL=postgres://user:pass@localhost:5432/rupli
cd api && npm run migrate        # creates the tables and seeds categories and the product catalog
```

### 3. Run the API

**With Clerk (like production):**
```bash
cd api
DATABASE_URL=... CLERK_SECRET_KEY=sk_test_... npm start      # → http://127.0.0.1:8787
curl http://127.0.0.1:8787/health                             # {"ok":true}
```

**Without Clerk (local end-to-end testing):** the dev server accepts the bearer token `dev` as the user `user_dev`. It only connects to a database whose name contains `rupli_e2e`.
```bash
cd api
E2E_DATABASE_URL=postgres://.../rupli_e2e npx tsx src/dev-server.ts   # → http://localhost:8788
```

### 4. Run the app

```bash
cd app
# with real auth
EXPO_PUBLIC_API_URL=http://<your-ip>:8787 EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... npx expo start

# or with dev auth against the e2e API, in the browser
EXPO_PUBLIC_DEV_AUTH=1 EXPO_PUBLIC_API_URL=http://localhost:8788 npx expo start --web
```

Press `a` to open it on Android, or `w` for the web preview. The web preview is useful for checking screens against the design.

> 💡 Two dev-only routes help with UI work: `/dev/ds` shows the design-system sheet and `/dev/screens` shows every screen with sample data.

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | API | Postgres connection string (production and migrations) |
| `CLERK_SECRET_KEY` | API | Verifies Clerk session JWTs |
| `PORT` | API | Listen port, default `8787` |
| `TEST_DATABASE_URL` | API tests | Throwaway database for Vitest route tests (`api/.env.test`) |
| `E2E_DATABASE_URL` | API dev server | Must contain `rupli_e2e` (`api/.env.e2e`) |
| `EXPO_PUBLIC_API_URL` | App | API base URL |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | App | Clerk publishable key |
| `EXPO_PUBLIC_DEV_AUTH` | App | Set to `1` to skip Clerk in dev builds and use the `dev` token |

`.env*` files are gitignored. Never commit real keys.

---

## Testing

```bash
npm test                     # every workspace
npm test -w shared           # money, units, cart, catalog, SMS parser, categoriser
npm test -w api              # route tests (needs TEST_DATABASE_URL)
npm test -w app              # pure view logic: keypad, cart, lists, picker, spend, sync…
npm run typecheck -w api     # also -w shared, -w app
```

The API tests run against a real Postgres database, not mocks. They cover auth rejection, cross-user access denial, list sharing, trips, transactions, spend and deletes.

---

## API reference

Every `/v1/*` route needs `Authorization: Bearer <Clerk session JWT>`. Errors always have the form `{ "error": { "code": "...", "message": "..." } }` with a matching HTTP status. Stack traces are never returned.

<details>
<summary><b>Show all endpoints</b></summary>

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check (no auth) |
| **Products** |||
| `GET` | `/v1/products` | Seed catalog plus your custom products |
| `GET` | `/v1/products/usual` | Your most-bought products |
| `GET` | `/v1/products/:id/prices` | Your price history for a product |
| `POST` | `/v1/products` | Add a custom product |
| `GET` | `/v1/categories` | Default categories plus yours |
| `GET` | `/v1/prices/last` | Last paid price for each product and pack size |
| **Lists** |||
| `GET` | `/v1/lists` | Your lists and shared lists, with estimates |
| `POST` | `/v1/lists` | Create a list |
| `GET` / `PATCH` / `DELETE` | `/v1/lists/:id` | Read, rename or change status, delete |
| `POST` | `/v1/lists/:id/copy` | Copy a list (e.g. last month's) |
| `POST` | `/v1/lists/:id/share` | Get the 6-character invite code |
| `POST` | `/v1/lists/join` | Join a list with a code |
| `POST` | `/v1/lists/:id/leave` | Leave a shared list |
| `POST` | `/v1/lists/:id/items` | Add an item |
| `PATCH` / `DELETE` | `/v1/lists/:id/items/:itemId` | Update or remove an item |
| **Trips (cart mode)** |||
| `POST` | `/v1/trips` | Start a trip |
| `GET` | `/v1/trips` | Finished trips |
| `GET` | `/v1/trips/open` | Latest unfinished trip, or `null` |
| `GET` / `DELETE` | `/v1/trips/:id` | Read or delete a trip (also deletes its cart transaction) |
| `POST` | `/v1/trips/:id/items` | Put an item in the cart |
| `PATCH` / `DELETE` | `/v1/trips/:id/items/:itemId` | Edit or remove a cart item |
| `POST` | `/v1/trips/:id/pause` | Pause or resume |
| `POST` | `/v1/trips/:id/finish` | Finish the trip and create a Groceries transaction |
| **Money** |||
| `POST` | `/v1/transactions` | Manual expense |
| `PATCH` / `DELETE` | `/v1/transactions/:id` | Recategorise (optionally create a rule) or delete |
| `POST` | `/v1/transactions/sms-batch` | Bulk import of parsed SMS (deduped by UPI ref) |
| `GET` | `/v1/spend?month=YYYY-MM` | Month totals, 6-month series, breakdown, transactions |
| `GET` / `PUT` | `/v1/me` | Read or set the monthly grocery budget |
| `GET` / `POST` | `/v1/recurring` | List or add monthly recurring bills |
| `DELETE` | `/v1/recurring/:id` | Remove a recurring bill |

</details>

---

## Data model

Money is stored as **integer paise**, and timestamps are `timestamptz`.

```mermaid
erDiagram
    users ||--o{ lists : owns
    users ||--o{ trips : makes
    users ||--o{ transactions : has
    users ||--o{ recurring_expenses : has
    lists ||--o{ list_items : contains
    lists ||--o{ list_members : "shared with"
    trips ||--o{ trip_items : contains
    trips ||--o| transactions : "finish creates"
    products ||--o{ list_items : ""
    products ||--o{ trip_items : ""
    categories ||--o{ transactions : ""
    categories ||--o{ category_rules : ""
```

| Table | Purpose |
|---|---|
| `users` | Clerk user id, monthly budget |
| `products` | Seed catalog (`user_id` null) and custom products: aliases, emoji, pack sizes, brands |
| `lists` / `list_items` / `list_members` | Lists with month and status, items with pack, brand, qty and checked state, family members |
| `trips` / `trip_items` | Shopping trips with paid prices, bill total, paused and finished times |
| `transactions` | Every spend (`manual` / `cart` / `sms`), unique on `(user_id, source, source_ref)` so nothing is counted twice |
| `categories` / `category_rules` | Spend categories and "always categorise X as Y" rules |
| `recurring_expenses` | Monthly bills, turned into transactions on their due day |
| `accounts` | Bank, card or wallet (reserved for future use) |

---

## Deployment

The API runs on a Linux VM behind Caddy:

```
Internet ──HTTPS──▶ Caddy (auto TLS) ──▶ 127.0.0.1:8787 rupli-api (systemd) ──▶ Postgres (localhost only)
```

`deploy/deploy.sh` does the whole release:
1. Rsyncs the server code (`api/`, `shared/`, root manifests) to `/opt/rupli`.
2. Runs `npm ci --omit=dev` for the API workspaces.
3. Runs migrations and seeds the catalog using `/etc/rupli/api.env`.
4. Installs `deploy/rupli-api.service` and `deploy/Caddyfile`, then restarts the service and reloads Caddy.
5. Checks `/health`.

```bash
./deploy/deploy.sh
```

> Before using the script, edit `KEY` and `VM` at the top of `deploy/deploy.sh` for your own server. The systemd unit runs as the hardened, unprivileged `rupli-api` user (`ProtectSystem=strict`, `NoNewPrivileges`).

**Mobile:** builds go through EAS. `npm run update -w app` publishes an over-the-air update to the `preview` channel.

---

## Design

The UI follows a high-fidelity design handoff, and the app is built to match it pixel for pixel:

- `docs/design/handoff/README.md`: the source of truth for tokens, components, screens and interactions.
- `docs/design/handoff/Rupli App v2.dc.html`: visual reference for 21 screens. To view it locally, run `python3 -m http.server 4173 -d docs/design/handoff`.
- `docs/superpowers/specs/2026-10-02-rupli-design.md`: the product and architecture spec.
- `docs/superpowers/plans/`: step-by-step plans for the backend, the app and SMS import.

Design rules: brand green `#0F5C3E` with yellow CTAs, the Anek Latin font, tabular numbers everywhere, tap targets of at least 48 dp, and light and dark modes that follow the system setting.

---

## Roadmap

- [x] Catalog, picker, lists, copy last month
- [x] Cart mode with bill check, pause and resume
- [x] Price-per-unit compare
- [x] Spend dashboard, budget, recurring bills, CSV/PDF export
- [x] Shared family lists
- [x] Offline-first sync
- [ ] Bank/UPI SMS auto-import (parser and API are ready; the on-device reader was paused because of Android SMS-permission friction)
- [ ] App lock (biometric / device PIN)
- [ ] Bill and EMI reminders, account balances
- [ ] Play Store release

---

<div align="center">
Made in India 🇮🇳 for the monthly kirana run.
</div>
