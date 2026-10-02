# Rupli Plan 1: Shared Logic, API & VM Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tested `shared/` package (money, units/compare, cart/bill check, SMS parser, categoriser, catalog, API schemas) and a deployed `api/` (Hono + Drizzle + Postgres 18) at `https://137-23-49-189.sslip.io`.

**Architecture:** npm workspaces repo. `shared/` is plain TypeScript consumed as source by `api/` now and by `app/` in Plan 2. The API runs on the Oracle VM next to Postgres (localhost:5433) behind Caddy. Clerk JWTs are verified on every `/v1/*` route.

**Tech Stack:** Node 22, TypeScript, Vitest, zod, Hono + @hono/node-server, drizzle-orm + drizzle-kit + postgres (postgres.js), @clerk/backend, tsx, Caddy, systemd.

**Spec:** `docs/superpowers/specs/2026-10-02-rupli-design.md` · **Design:** `docs/design/handoff/README.md`

**Follow-ups:** Plan 2 covers the Expo app screens (21 screens from the handoff). Plan 3 covers the native SMS module and the import flow.

## Global Constraints
- Money is always integer **paise** (`bigint`, mode number). No floats are stored.
- Displayed money uses the Indian format `₹1,25,000` (`toLocaleString('en-IN')`), with no decimals unless needed.
- Timezone for month boundaries: **Asia/Kolkata**.
- Every `/v1/*` query is scoped by `userId` from the verified token. Another user's ids return **404**, never 403.
- Error body: `{ "error": { "code": string, "message": string } }`. Never leak stack traces.
- The raw SMS body never reaches the API; only parsed fields do.
- Postgres stays on localhost only. The API listens on `127.0.0.1:8787`. Only Caddy is public.
- VM: `ubuntu@137.23.49.189`, key `~/Downloads/ssh-key-2026-09-04.key`. **Do not touch** the Hermes Postgres on 5432 or the `ollama`/`hermes` services.
- Opening ports 80/443 and adding cron jobs **require the owner's confirmation in chat** before running.

## Review Focus
1. **Cross-user access:** user B requests user A's list/trip/transaction id → 404 (Task 7, 8, 9 tests).
2. **SMS amount formats:** `Rs500`, `Rs.1,25,000.00`, `INR 780.00`, `debited by 250.0` → exact paise (Task 4 test).
3. **SMS batch re-sent after a network retry** → no duplicate transactions; the second call reports duplicates (Task 9 test).
4. **Compare with empty/zero qty or price** → that option is ignored, never `Infinity`/`NaN` (Task 2 test).
5. **Finishing a trip twice** → 409, and only one cart transaction exists (Task 8 test).

---

## File Structure
```
package.json                 workspaces: shared, api
tsconfig.base.json
shared/src/index.ts          re-exports
shared/src/money.ts          parseRupeesToPaise, formatINR
shared/src/units.ts          Unit, parsePack, toBase, packsBaseUnit, compare
shared/src/cart.ts           cartTotal, billCheck, priceDelta, estimateTotal
shared/src/sms/parse.ts      parseSms, bankFromSender
shared/src/sms/categorize.ts DEFAULT_CATEGORIES, DEFAULT_RULES, matchRule, defaultCategorySlug
shared/src/sms/dedupe.ts     smsFallbackRef, findCartMatch
shared/src/catalog.ts        PRODUCT_CATEGORIES, CATALOG, searchProducts
shared/src/schemas.ts        zod request schemas
shared/test/*.test.ts
api/src/db/schema.ts, client.ts
api/src/lib/http.ts (ApiError, body, idParam, onError), auth.ts, env.ts, prices.ts, months.ts
api/src/routes/products.ts, lists.ts, trips.ts, transactions.ts, spend.ts
api/src/app.ts (createApp), server.ts, migrate.ts, seed.ts
api/test/global-setup.ts, helpers.ts, *.test.ts
deploy/rupli-api.service, deploy/Caddyfile, deploy/deploy.sh
```

---

### Task 1: Repo scaffold + money utils

**Files:** Create `package.json`, `tsconfig.base.json`, `shared/package.json`, `shared/tsconfig.json`, `shared/src/money.ts`, `shared/src/index.ts`, `shared/test/money.test.ts`

**Produces:** `parseRupeesToPaise(s: string): number | null`, `formatINR(paise: number): string`

- [ ] **Step 1: Scaffold**
```bash
cd ~/Personal-Project/shoping && git init
```
`package.json`:
```json
{ "name": "rupli", "private": true, "workspaces": ["shared", "api"],
  "scripts": { "test": "npm test --workspaces --if-present" } }
```
`tsconfig.base.json`:
```json
{ "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
  "strict": true, "noUncheckedIndexedAccess": true, "skipLibCheck": true, "noEmit": true, "types": ["node"] } }
```
`shared/package.json`:
```json
{ "name": "@rupli/shared", "private": true, "type": "module",
  "main": "src/index.ts", "types": "src/index.ts",
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit -p ." } }
```
`shared/tsconfig.json`: `{ "extends": "../tsconfig.base.json", "include": ["src", "test"] }`
```bash
npm i -w shared zod && npm i -D -w shared vitest typescript @types/node
```

- [ ] **Step 2: Failing test** `shared/test/money.test.ts`
```ts
import { describe, it, expect } from 'vitest';
import { parseRupeesToPaise, formatINR } from '../src/money';

describe('parseRupeesToPaise', () => {
  it.each([
    ['486.00', 48600], ['1,250.00', 125000], ['1,25,000.00', 12500000],
    ['250.0', 25000], ['500', 50000], ['0.5', 50],
  ])('%s → %i', (s, p) => expect(parseRupeesToPaise(s)).toBe(p));
  it.each(['', 'abc', '1.234', '-5'])('rejects %s', s => expect(parseRupeesToPaise(s)).toBeNull());
});

describe('formatINR', () => {
  it('formats Indian style', () => {
    expect(formatINR(12500000)).toBe('₹1,25,000');
    expect(formatINR(6850)).toBe('₹68.50');
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-2300)).toBe('-₹23');
  });
});
```
- [ ] **Step 3:** `npm test -w shared` → FAIL (module not found)
- [ ] **Step 4: Implement** `shared/src/money.ts`
```ts
export function parseRupeesToPaise(s: string): number | null {
  const m = /^\s*([\d,]+)(?:\.(\d{1,2}))?\s*$/.exec(s);
  if (!m || !/\d/.test(m[1]!)) return null;
  const whole = Number(m[1]!.replace(/,/g, ''));
  if (!Number.isSafeInteger(whole)) return null;
  return whole * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

export function formatINR(paise: number): string {
  const r = Math.abs(paise) / 100;
  const s = r.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 });
  return (paise < 0 ? '-' : '') + '₹' + s;
}
```
`shared/src/index.ts`: `export * from './money';` (append one export line per new module in later tasks)
- [ ] **Step 5:** `npm test -w shared` → PASS
- [ ] **Step 6:** `git add -A && git commit -m "feat(shared): repo scaffold + money utils"` (`.gitignore` already covers `.env*` and `node_modules/`)

---

### Task 2: Units & Compare

**Files:** `shared/src/units.ts`, `shared/test/units.test.ts`

**Produces:**
```ts
type Unit = 'g'|'kg'|'ml'|'L'|'pcs'; type BaseUnit = 'kg'|'L'|'pcs';
parsePack(label: string): { qty: number; unit: Unit } | null   // "500 ml", "1 L", "12 pcs"
toBase(qty: number, unit: Unit): { qty: number; unit: BaseUnit }
packsBaseUnit(labels: string[]): BaseUnit | null              // null if any invalid or mixed
interface CompareOption { name: string; qty: number; unit: Unit; pricePaise: number }
interface CompareResult { perUnitPaise: (number|null)[]; baseUnit: BaseUnit|null; bestIndex: number|null;
  savingPerUnitPaise: number|null; savingPct: number|null; error: null|'need_two'|'mixed_units' }
compare(options: CompareOption[]): CompareResult
```

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest';
import { parsePack, toBase, packsBaseUnit, compare } from '../src/units';

it('parses packs', () => {
  expect(parsePack('500 ml')).toEqual({ qty: 500, unit: 'ml' });
  expect(parsePack('1 l')).toEqual({ qty: 1, unit: 'L' });
  expect(parsePack('12 pc')).toEqual({ qty: 12, unit: 'pcs' });
  expect(parsePack('big')).toBeNull();
});
it('converts to base', () => expect(toBase(250, 'g')).toEqual({ qty: 0.25, unit: 'kg' }));
it('packsBaseUnit', () => {
  expect(packsBaseUnit(['500 ml', '1 L'])).toBe('L');
  expect(packsBaseUnit(['500 g', '1 L'])).toBeNull();
});
describe('compare', () => {
  it('design example: 5 L saves ₹9/L · 5.5%', () => {
    const r = compare([
      { name: 'Fortune 1 L', qty: 1, unit: 'L', pricePaise: 16500 },
      { name: 'Fortune 5 L', qty: 5, unit: 'L', pricePaise: 78000 },
      { name: 'Saffola 1 L', qty: 1, unit: 'L', pricePaise: 19900 },
    ]);
    expect(r).toMatchObject({ bestIndex: 1, baseUnit: 'L', savingPerUnitPaise: 900, savingPct: 5.5, error: null });
    expect(r.perUnitPaise).toEqual([16500, 15600, 19900]);
  });
  it('mixes g and kg', () => {
    const r = compare([{ name: 'a', qty: 500, unit: 'g', pricePaise: 6000 }, { name: 'b', qty: 1, unit: 'kg', pricePaise: 11000 }]);
    expect(r.bestIndex).toBe(1);
  });
  it('ignores zero/empty options (no Infinity/NaN)', () => {
    const r = compare([{ name: 'a', qty: 0, unit: 'L', pricePaise: 100 }, { name: 'b', qty: 1, unit: 'L', pricePaise: 0 }, { name: 'c', qty: 1, unit: 'L', pricePaise: 100 }]);
    expect(r).toMatchObject({ error: 'need_two', bestIndex: null });
    expect(r.perUnitPaise).toEqual([null, null, 100]);
  });
  it('refuses mixed units', () => {
    expect(compare([{ name: 'a', qty: 1, unit: 'kg', pricePaise: 1 }, { name: 'b', qty: 1, unit: 'L', pricePaise: 1 }]).error).toBe('mixed_units');
  });
});
```
- [ ] **Step 2:** run → FAIL
- [ ] **Step 3: Implement**
```ts
export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'pcs';
export type BaseUnit = 'kg' | 'L' | 'pcs';
const TO_BASE: Record<Unit, [BaseUnit, number]> = { g: ['kg', 0.001], kg: ['kg', 1], ml: ['L', 0.001], L: ['L', 1], pcs: ['pcs', 1] };
const ALIAS: Record<string, Unit> = { g: 'g', kg: 'kg', ml: 'ml', l: 'L', pcs: 'pcs', pc: 'pcs' };

export function parsePack(label: string) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*([a-z]+)\s*$/i.exec(label);
  const unit = m && ALIAS[m[2]!.toLowerCase()];
  return m && unit ? { qty: Number(m[1]), unit } : null;
}
export function toBase(qty: number, unit: Unit) {
  const [base, f] = TO_BASE[unit];
  return { qty: qty * f, unit: base };
}
export function packsBaseUnit(labels: string[]): BaseUnit | null {
  const units = labels.map(l => { const p = parsePack(l); return p && TO_BASE[p.unit][0]; });
  return units.length && units.every(u => u && u === units[0]) ? units[0]! : null;
}

export interface CompareOption { name: string; qty: number; unit: Unit; pricePaise: number }
export interface CompareResult {
  perUnitPaise: (number | null)[]; baseUnit: BaseUnit | null; bestIndex: number | null;
  savingPerUnitPaise: number | null; savingPct: number | null; error: null | 'need_two' | 'mixed_units';
}
export function compare(options: CompareOption[]): CompareResult {
  const ok = (o: CompareOption) => o.qty > 0 && o.pricePaise > 0 && Number.isFinite(o.qty) && Number.isFinite(o.pricePaise);
  const perUnitPaise = options.map(o => (ok(o) ? Math.round(o.pricePaise / toBase(o.qty, o.unit).qty) : null));
  const valid = options.map((o, i) => [o, i] as const).filter(([o]) => ok(o));
  const none = { perUnitPaise, baseUnit: null, bestIndex: null, savingPerUnitPaise: null, savingPct: null };
  const bases = new Set(valid.map(([o]) => TO_BASE[o.unit][0]));
  if (bases.size > 1) return { ...none, error: 'mixed_units' };
  if (valid.length < 2) return { ...none, error: 'need_two' };
  const ranked = valid.map(([, i]) => i).sort((a, b) => perUnitPaise[a]! - perUnitPaise[b]!);
  const best = perUnitPaise[ranked[0]!]!, second = perUnitPaise[ranked[1]!]!;
  return {
    perUnitPaise, baseUnit: [...bases][0]!, bestIndex: ranked[0]!, error: null,
    savingPerUnitPaise: second - best, savingPct: Math.round(((second - best) / second) * 1000) / 10,
  };
}
```
- [ ] **Step 4:** run → PASS · export from index · **Step 5:** commit `feat(shared): units + compare`

---

### Task 3: Cart & bill check

**Files:** `shared/src/cart.ts`, `shared/test/cart.test.ts`

**Produces:**
```ts
cartTotal(lines: { qty: number; pricePaise: number }[]): number
billCheck(cartPaise: number, billPaise: number): { status: 'match' } | { status: 'over'|'under'; diffPaise: number }
priceDelta(newPaise: number, lastPaise: number | null): { kind: 'none'|'same' } | { kind: 'more'|'less'; diffPaise: number }
estimateTotal(items: { qty: number; lastPricePaise: number | null }[]): number
```
- [ ] **Step 1: Failing test**
```ts
import { it, expect } from 'vitest';
import { cartTotal, billCheck, priceDelta, estimateTotal } from '../src/cart';
it('totals', () => expect(cartTotal([{ qty: 2, pricePaise: 17700 }, { qty: 1, pricePaise: 6000 }])).toBe(41400));
it('bill check', () => {
  expect(billCheck(234800, 234800)).toEqual({ status: 'match' });
  expect(billCheck(234800, 237100)).toEqual({ status: 'over', diffPaise: 2300 });
  expect(billCheck(234800, 234000)).toEqual({ status: 'under', diffPaise: 800 });
});
it('price delta', () => {
  expect(priceDelta(17700, 16500)).toEqual({ kind: 'more', diffPaise: 1200 });
  expect(priceDelta(16000, 16500)).toEqual({ kind: 'less', diffPaise: 500 });
  expect(priceDelta(16500, 16500)).toEqual({ kind: 'same' });
  expect(priceDelta(16500, null)).toEqual({ kind: 'none' });
});
it('estimate skips unknown prices', () => expect(estimateTotal([{ qty: 30, lastPricePaise: 6800 }, { qty: 1, lastPricePaise: null }])).toBe(204000));
```
- [ ] **Step 2:** FAIL · **Step 3: Implement**
```ts
export const cartTotal = (lines: { qty: number; pricePaise: number }[]) => lines.reduce((s, l) => s + l.qty * l.pricePaise, 0);
export function billCheck(cartPaise: number, billPaise: number) {
  const d = billPaise - cartPaise;
  return d === 0 ? ({ status: 'match' } as const) : ({ status: d > 0 ? 'over' : 'under', diffPaise: Math.abs(d) } as const);
}
export function priceDelta(newPaise: number, lastPaise: number | null) {
  if (lastPaise == null) return { kind: 'none' } as const;
  const d = newPaise - lastPaise;
  return d === 0 ? ({ kind: 'same' } as const) : ({ kind: d > 0 ? 'more' : 'less', diffPaise: Math.abs(d) } as const);
}
export const estimateTotal = (items: { qty: number; lastPricePaise: number | null }[]) =>
  items.reduce((s, i) => s + i.qty * (i.lastPricePaise ?? 0), 0);
```
- [ ] **Step 4:** PASS · export · **Step 5:** commit `feat(shared): cart + bill check`

---

### Task 4: SMS parser

**Files:** `shared/src/sms/parse.ts`, `shared/test/sms-parse.test.ts`

**Produces:**
```ts
interface ParsedSms { amountPaise: number; direction: 'debit'|'credit'; merchant: string|null; ref: string|null; last4: string|null; bank: string|null }
bankFromSender(sender: string): string | null     // "AX-HDFCBK-S" → "HDFC Bank"
parseSms(sender: string, body: string): ParsedSms | null
```
The rules: reject OTP/failed/declined messages. The first direction keyword in the body wins. A message must have a last4 **or** a ref, which drops promos. The date comes from the SMS timestamp on the phone, not from the text.

- [ ] **Step 1: Failing test** (fixtures follow real Indian bank formats)
```ts
import { it, expect } from 'vitest';
import { parseSms } from '../src/sms/parse';

const cases: [string, string, object | null][] = [
  ['AX-HDFCBK', 'Sent Rs.486.00\nFrom HDFC Bank A/C *1234\nTo ZEPTO MARKETPLACE PRIVATE LIMITED\nOn 01/10/26\nRef 427519830042\nNot You?\nCall 18002586161/SMS BLOCK UPI to 7308080808',
    { amountPaise: 48600, direction: 'debit', merchant: 'ZEPTO MARKETPLACE', ref: '427519830042', last4: '1234', bank: 'HDFC Bank' }],
  ['VM-SBIUPI', 'Dear UPI user A/C X5678 debited by 250.0 on date 30Sep26 trf to SWIGGY Refno 427398765432. If not u? call 1800111109. -SBI',
    { amountPaise: 25000, direction: 'debit', merchant: 'SWIGGY', ref: '427398765432', last4: '5678', bank: 'SBI' }],
  ['JD-ICICIB', 'ICICI Bank Acct XX901 debited for Rs 1,250.00 on 28-Sep-26; DMART AVENUE credited. UPI:427312345678. Call 18002662 for dispute. SMS BLOCK 901 to 9215676766.',
    { amountPaise: 125000, direction: 'debit', merchant: 'DMART AVENUE', ref: '427312345678', last4: '901', bank: 'ICICI Bank' }],
  ['AD-AXISBK-S', 'INR 780.00 debited\nA/c no. XX4321\n29-09-26, 18:22:11\nUPI/P2M/427398761234/BIGBASKET\nNot you? SMS BLOCKUPI Cust ID to 919951860002\nAxis Bank',
    { amountPaise: 78000, direction: 'debit', merchant: 'BIGBASKET', ref: '427398761234', last4: '4321', bank: 'Axis Bank' }],
  ['BZ-KOTAKB', 'Sent Rs.120.00 from Kotak Bank AC X7788 to rapido@ybl on 27-09-26.UPI Ref 427298765123. Not you, https://kotak.com/KBANKT/Fraud',
    { amountPaise: 12000, direction: 'debit', merchant: 'rapido@ybl', ref: '427298765123', last4: '7788', bank: 'Kotak Bank' }],
  ['AX-HDFCBK', 'Rs.2,348.00 spent on HDFC Bank Card x9012 at DMART on 2026-09-30:19:05:22.Not You? To Block+Reissue Call 18002586161/SMS BLOCK CC 9012 to 7308080808',
    { amountPaise: 234800, direction: 'debit', merchant: 'DMART', ref: null, last4: '9012', bank: 'HDFC Bank' }],
  ['JM-PAYTMB', 'Paid Rs.199 to Blinkit from Paytm Payments Bank a/c 123456. UPI Ref: 427411112222. Download Paytm',
    { amountPaise: 19900, direction: 'debit', merchant: 'Blinkit', ref: '427411112222', last4: null, bank: 'Paytm Payments Bank' }],
  ['AX-HDFCBK', 'Rs.1,25,000.00 credited to HDFC Bank A/c XX1234 on 01-10-26 by a/c linked to VPA aarti@okicici (UPI Ref No 427512340000).',
    { amountPaise: 12500000, direction: 'credit', merchant: 'aarti@okicici', ref: '427512340000', last4: '1234', bank: 'HDFC Bank' }],
  ['VM-SBIUPI', 'Dear SBI UPI User, ur A/cX5678 credited by Rs500 on 29Sep26 by (Ref no 427288881111)',
    { amountPaise: 50000, direction: 'credit', merchant: null, ref: '427288881111', last4: '5678', bank: 'SBI' }],
  ['AX-HDFCBK', '123456 is your OTP for txn of Rs.486.00 at ZEPTO on HDFC Bank card x9012. Valid for 10 mins. Do not share', null],
  ['AX-PHONPE', 'Get Rs.500 cashback on your first UPI payment! Download now', null],
  ['AX-HDFCBK', 'Your UPI transaction of Rs.300.00 to swiggy@icici has failed. Amount if debited will be refunded', null],
  ['AX-HDFCBK', 'Transaction of Rs.5,000.00 on your HDFC Bank card x9012 was declined due to insufficient balance', null],
  ['AX-AIRTEL', 'Recharge with Rs.299 and get credited 2GB extra data!', null],
];
it.each(cases)('%s: %s', (sender, body, expected) => expect(parseSms(sender, body)).toEqual(expected));
```
- [ ] **Step 2:** FAIL · **Step 3: Implement**
```ts
import { parseRupeesToPaise } from '../money';

export interface ParsedSms { amountPaise: number; direction: 'debit' | 'credit'; merchant: string | null; ref: string | null; last4: string | null; bank: string | null }

const BANKS: Record<string, string> = {
  HDFCBK: 'HDFC Bank', SBIUPI: 'SBI', SBIINB: 'SBI', ATMSBI: 'SBI', CBSSBI: 'SBI', ICICIB: 'ICICI Bank', ICICIT: 'ICICI Bank',
  AXISBK: 'Axis Bank', KOTAKB: 'Kotak Bank', PAYTMB: 'Paytm Payments Bank', YESBNK: 'Yes Bank', IDFCFB: 'IDFC First Bank',
  BOBTXN: 'Bank of Baroda', PNBSMS: 'PNB', CANBNK: 'Canara Bank', UNIONB: 'Union Bank', INDUSB: 'IndusInd Bank', FEDBNK: 'Federal Bank', AUBANK: 'AU Bank',
};
export function bankFromSender(sender: string) {
  const parts = sender.toUpperCase().split('-');
  return BANKS[(parts.length > 1 ? parts[1] : parts[0])!] ?? null;
}

const REJECT = /\b(otp|one[- ]time password|verification code|failed|declined|unsuccessful|reversed)\b/i;
const DIRECTION = /\b(debited|spent|sent|paid|withdrawn|credited|received|deposited)\b/i;
const AMOUNTS = [/(?:\b(?:rs|inr)\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i, /\b(?:debited|credited)\s+(?:by|for|with)\s+([\d,]+(?:\.\d{1,2})?)/i];
const REFS = [/upi\/p2[am]\/(\d{9,12})/i, /\b(?:ref(?:erence)?\.?\s*(?:no\.?|number)?|refno|rrn|upi)\s*[:.]?\s*(\d{9,12})\b/i];
const LAST4 = /\b(?:a\/c|acct|ac|account|card)(?:\s*no\.?)?\s*[x*]+\s*(\d{3,6})/i;
const END = String.raw`(?=\s+(?:on|from|ref|via|using)\b|\n|\.\s|\.?$)`;
const DEBIT_SPECIFIC = [/upi\/p2[am]\/\d+\/([^/\n]+)/i, /;\s*([^;.\n]+?)\s+credited/i, /\btrf to\s+(.+?)\s+ref/i];
const DEBIT_GENERIC = [new RegExp(String.raw`\bto\s+(.+?)` + END, 'i'), new RegExp(String.raw`\bat\s+(.+?)` + END, 'i')];
const CREDIT = [/\bvpa\s+([\w.\-]+@[\w.]+)/i, new RegExp(String.raw`\bfrom\s+(.+?)` + END, 'i')];

const firstMatch = (res: RegExp[], s: string) => { for (const r of res) { const m = r.exec(s); if (m) return m[1]!; } return null; };
const clean = (m: string | null) => m?.trim().replace(/\s+(private limited|pvt\.? ltd\.?|limited|ltd\.?)$/i, '').trim() || null;

function merchant(body: string, direction: 'debit' | 'credit') {
  if (direction === 'credit') return clean(firstMatch(CREDIT, body));
  const specific = firstMatch(DEBIT_SPECIFIC, body);
  if (specific) return clean(specific);
  // earliest "to …"/"at …" wins, so trailing "To Block" / "BLOCK UPI to 7308…" lose
  const hits = DEBIT_GENERIC.map(r => r.exec(body)).filter((m): m is RegExpExecArray => !!m).sort((a, b) => a.index - b.index);
  return clean(hits[0]?.[1] ?? null);
}

export function parseSms(sender: string, body: string): ParsedSms | null {
  if (REJECT.test(body)) return null;
  const dir = DIRECTION.exec(body)?.[1]?.toLowerCase();
  if (!dir) return null;
  const direction = ['credited', 'received', 'deposited'].includes(dir) ? 'credit' : 'debit';
  const raw = firstMatch(AMOUNTS, body);
  const amountPaise = raw ? parseRupeesToPaise(raw) : null;
  if (!amountPaise) return null;
  const ref = firstMatch(REFS, body);
  const last4 = LAST4.exec(body)?.[1]?.slice(-4) ?? null;
  if (!ref && !last4) return null;
  return { amountPaise, direction, merchant: merchant(body, direction), ref, last4, bank: bankFromSender(sender) };
}
```
- [ ] **Step 4:** run → PASS. If a fixture fails, fix the regex; **never edit the expected values**. Export from index.
- [ ] **Step 5:** commit `feat(shared): SMS parser`

---

### Task 5: Categoriser + duplicate matcher

**Files:** `shared/src/sms/categorize.ts`, `shared/src/sms/dedupe.ts`, `shared/test/categorize.test.ts`

**Produces:**
```ts
type CategorySlug = 'groceries'|'food'|'household'|'health'|'pooja'|'fuel'|'transport'|'shopping'|'bills'|'rent'|'entertainment'|'transfers'|'income'|'uncategorised'
DEFAULT_CATEGORIES: { slug: CategorySlug; name: string; emoji: string }[]
matchRule<K>(merchant: string|null, rules: { pattern: string; key: K }[]): K | null   // whole-word, case-insensitive, first wins
defaultCategorySlug(merchant: string|null, direction: 'debit'|'credit'): CategorySlug
smsFallbackRef(p: { bank: string|null; last4: string|null; amountPaise: number; occurredAt: string }): string
findCartMatch(sms: { amountPaise: number; occurredAt: Date }, carts: { id: string; amountPaise: number; occurredAt: Date }[], windowMin?: number): string | null
```
- [ ] **Step 1: Failing test**
```ts
import { it, expect } from 'vitest';
import { matchRule, defaultCategorySlug } from '../src/sms/categorize';
import { findCartMatch, smsFallbackRef } from '../src/sms/dedupe';

it('defaults', () => {
  expect(defaultCategorySlug('ZEPTO MARKETPLACE', 'debit')).toBe('groceries');
  expect(defaultCategorySlug('Swiggy Instamart', 'debit')).toBe('groceries');
  expect(defaultCategorySlug('SWIGGY', 'debit')).toBe('food');
  expect(defaultCategorySlug('rapido@ybl', 'debit')).toBe('transport');
  expect(defaultCategorySlug('Motorola Store', 'debit')).toBe('uncategorised'); // "ola" must not match
  expect(defaultCategorySlug('aarti@okicici', 'credit')).toBe('income');
  expect(defaultCategorySlug(null, 'debit')).toBe('uncategorised');
});
it('user rules first', () => expect(matchRule('ZEPTO', [{ pattern: 'zepto', key: 'c1' }])).toBe('c1'));
it('regex chars in pattern are literal', () => expect(matchRule('a+b store', [{ pattern: 'a+b', key: 1 }])).toBe(1));
it('cart match: same amount, closest within 30 min', () => {
  const at = new Date('2026-10-01T12:00:00Z');
  const carts = [
    { id: 'far', amountPaise: 234800, occurredAt: new Date('2026-10-01T12:45:00Z') },
    { id: 'near', amountPaise: 234800, occurredAt: new Date('2026-10-01T12:10:00Z') },
    { id: 'other', amountPaise: 1000, occurredAt: at },
  ];
  expect(findCartMatch({ amountPaise: 234800, occurredAt: at }, carts)).toBe('near');
  expect(findCartMatch({ amountPaise: 5, occurredAt: at }, carts)).toBeNull();
});
it('fallback ref is deterministic', () =>
  expect(smsFallbackRef({ bank: 'HDFC Bank', last4: '9012', amountPaise: 234800, occurredAt: '2026-09-30T13:35:22.000Z' }))
    .toBe('HDFC Bank:9012:234800:2026-09-30T13:35:22.000Z'));
```
- [ ] **Step 2:** FAIL · **Step 3: Implement**

`categorize.ts`:
```ts
export const DEFAULT_CATEGORIES = [
  { slug: 'groceries', name: 'Groceries', emoji: '🛒' }, { slug: 'food', name: 'Food delivery', emoji: '🛵' },
  { slug: 'household', name: 'Household', emoji: '🏠' }, { slug: 'health', name: 'Health', emoji: '💊' },
  { slug: 'pooja', name: 'Pooja', emoji: '🪔' }, { slug: 'fuel', name: 'Fuel', emoji: '⛽' },
  { slug: 'transport', name: 'Transport', emoji: '🚕' }, { slug: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { slug: 'bills', name: 'Bills & Recharge', emoji: '📱' }, { slug: 'rent', name: 'Rent', emoji: '🏘️' },
  { slug: 'entertainment', name: 'Entertainment', emoji: '🎬' }, { slug: 'transfers', name: 'Transfers', emoji: '🔁' },
  { slug: 'income', name: 'Income', emoji: '💰' }, { slug: 'uncategorised', name: 'Uncategorised', emoji: '❔' },
] as const;
export type CategorySlug = (typeof DEFAULT_CATEGORIES)[number]['slug'];

// order matters: more specific first (instamart before swiggy)
export const DEFAULT_RULES: { pattern: string; key: CategorySlug }[] = ([
  ['instamart', 'groceries'], ['zepto', 'groceries'], ['blinkit', 'groceries'], ['bigbasket', 'groceries'], ['dmart', 'groceries'],
  ['jiomart', 'groceries'], ['reliance fresh', 'groceries'], ['reliance smart', 'groceries'], ['more retail', 'groceries'], ['star bazaar', 'groceries'],
  ['swiggy', 'food'], ['zomato', 'food'], ['eatsure', 'food'], ['dominos', 'food'],
  ['uber', 'transport'], ['ola', 'transport'], ['rapido', 'transport'], ['irctc', 'transport'], ['redbus', 'transport'],
  ['indian oil', 'fuel'], ['iocl', 'fuel'], ['hpcl', 'fuel'], ['bpcl', 'fuel'], ['bharat petroleum', 'fuel'],
  ['apollo', 'health'], ['pharmeasy', 'health'], ['netmeds', 'health'], ['1mg', 'health'],
  ['amazon', 'shopping'], ['flipkart', 'shopping'], ['myntra', 'shopping'], ['meesho', 'shopping'], ['ajio', 'shopping'],
  ['airtel', 'bills'], ['jio', 'bills'], ['vodafone', 'bills'], ['vi', 'bills'], ['bescom', 'bills'], ['msedcl', 'bills'], ['mahadiscom', 'bills'], ['tata power', 'bills'],
  ['netflix', 'entertainment'], ['hotstar', 'entertainment'], ['bookmyshow', 'entertainment'], ['spotify', 'entertainment'],
] as const).map(([pattern, key]) => ({ pattern, key }));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function matchRule<K>(merchant: string | null, rules: { pattern: string; key: K }[]): K | null {
  if (!merchant) return null;
  for (const r of rules) if (new RegExp(`(^|[^a-z0-9])${esc(r.pattern)}($|[^a-z0-9])`, 'i').test(merchant)) return r.key;
  return null;
}
export function defaultCategorySlug(merchant: string | null, direction: 'debit' | 'credit'): CategorySlug {
  return matchRule(merchant, DEFAULT_RULES) ?? (direction === 'credit' ? 'income' : 'uncategorised');
}
```
(Custom boundaries are used instead of `\b`, so patterns like `a+b` and `1mg` work.)

`dedupe.ts`:
```ts
export const smsFallbackRef = (p: { bank: string | null; last4: string | null; amountPaise: number; occurredAt: string }) =>
  `${p.bank ?? '?'}:${p.last4 ?? '?'}:${p.amountPaise}:${p.occurredAt}`;

export function findCartMatch(sms: { amountPaise: number; occurredAt: Date }, carts: { id: string; amountPaise: number; occurredAt: Date }[], windowMin = 30) {
  const dist = (d: Date) => Math.abs(d.getTime() - sms.occurredAt.getTime());
  const hits = carts.filter(c => c.amountPaise === sms.amountPaise && dist(c.occurredAt) <= windowMin * 60_000).sort((a, b) => dist(a.occurredAt) - dist(b.occurredAt));
  return hits[0]?.id ?? null;
}
```
- [ ] **Step 4:** PASS · export both · **Step 5:** commit `feat(shared): categoriser + duplicate matcher`

---

### Task 6: Product catalog + search + API schemas

**Files:** `shared/src/catalog.ts`, `shared/src/schemas.ts`, `shared/test/catalog.test.ts`

**Produces:**
```ts
PRODUCT_CATEGORIES: { slug: string; label: string }[]   // 16, labels = design tab labels
interface CatalogProduct { slug: string; name: string; aliases: string[]; category: string; emoji: string; baseUnit: BaseUnit; packSizes: string[]; brands: string[] }
CATALOG: CatalogProduct[]
searchProducts<T extends { name: string; aliases: string[] }>(q: string, items: T[]): T[]
// schemas.ts (zod): Month, CreateList, UpdateList, CopyList, AddListItem, UpdateListItem, CreateProduct,
// StartTrip, AddTripItem, UpdateTripItem, FinishTrip, ManualTxn, UpdateTxn, SmsBatch
```
- [ ] **Step 1: Failing test**
```ts
import { it, expect } from 'vitest';
import { CATALOG, PRODUCT_CATEGORIES, searchProducts } from '../src/catalog';
import { packsBaseUnit } from '../src/units';
import { SmsBatch, AddTripItem } from '../src/schemas';

it('catalog is well-formed', () => {
  expect(CATALOG.length).toBeGreaterThanOrEqual(250);
  expect(new Set(CATALOG.map(p => p.slug)).size).toBe(CATALOG.length);
  for (const p of CATALOG) {
    expect(packsBaseUnit(p.packSizes), p.slug).toBe(p.baseUnit);
    expect(PRODUCT_CATEGORIES.some(c => c.slug === p.category), p.slug).toBe(true);
  }
  for (const c of PRODUCT_CATEGORIES) expect(CATALOG.filter(p => p.category === c.slug).length, c.slug).toBeGreaterThanOrEqual(8);
});
it('search by alias', () => {
  expect(searchProducts('doodh', CATALOG)[0]?.slug).toBe('milk');
  expect(searchProducts('kanda', CATALOG)[0]?.slug).toBe('onion');
  expect(searchProducts('Aloo', CATALOG)[0]?.slug).toBe('potato');
  expect(searchProducts('  ', CATALOG)).toEqual([]);
});
it('schemas', () => {
  expect(AddTripItem.safeParse({ productId: crypto.randomUUID(), packSize: '1 L', brand: null, qty: 1, pricePaise: 0 }).success).toBe(false);
  expect(SmsBatch.safeParse({ items: [] }).success).toBe(true);
});
```
- [ ] **Step 2:** FAIL · **Step 3: Implement**

`catalog.ts` structure (helper keeps entries one line each):
```ts
import { packsBaseUnit, type BaseUnit } from './units';
export const PRODUCT_CATEGORIES = [
  { slug: 'dairy', label: 'Dairy' }, { slug: 'atta-rice', label: 'Atta & Rice' }, { slug: 'dal', label: 'Dal' },
  { slug: 'oil-ghee', label: 'Oil & Ghee' }, { slug: 'masala', label: 'Masala' }, { slug: 'sabzi', label: 'Sabzi' },
  { slug: 'fruits', label: 'Fruits' }, { slug: 'bakery-eggs', label: 'Bakery & Eggs' }, { slug: 'snacks', label: 'Snacks' },
  { slug: 'beverages', label: 'Beverages' }, { slug: 'dry-fruits', label: 'Dry Fruits' }, { slug: 'cleaning', label: 'Cleaning' },
  { slug: 'personal-care', label: 'Personal Care' }, { slug: 'pooja', label: 'Pooja' }, { slug: 'baby', label: 'Baby' }, { slug: 'kitchen', label: 'Kitchen' },
] as const;
export interface CatalogProduct { slug: string; name: string; aliases: string[]; category: string; emoji: string; baseUnit: BaseUnit; packSizes: string[]; brands: string[] }
const p = (category: string, slug: string, name: string, aliases: string, emoji: string, packs: string, brands = ''): CatalogProduct => {
  const packSizes = packs.split(',').map(s => s.trim());
  return { slug, name, category, emoji, packSizes, aliases: aliases ? aliases.split('|') : [],
    brands: brands ? brands.split('|') : [], baseUnit: packsBaseUnit(packSizes)! };
};
export const CATALOG: CatalogProduct[] = [
  p('dairy', 'milk', 'Milk', 'doodh|dudh', '🥛', '500 ml,1 L,6 L', 'Amul|Mother Dairy|Gokul|Chitale|Nandini'),
  p('dairy', 'curd', 'Curd', 'dahi', '🥣', '200 g,400 g,1 kg', 'Amul|Mother Dairy|Gokul|Chitale'),
  p('dairy', 'paneer', 'Paneer', 'panir', '🧀', '200 g,500 g,1 kg', 'Amul|Mother Dairy|Gokul'),
  p('dairy', 'butter', 'Butter', 'makkhan|loni', '🧈', '100 g,500 g', 'Amul|Mother Dairy|Britannia'),
  p('sabzi', 'onion', 'Onion', 'pyaz|kanda', '🧅', '500 g,1 kg,2 kg,5 kg'),
  p('sabzi', 'potato', 'Potato', 'aloo|batata', '🥔', '500 g,1 kg,2 kg,5 kg'),
  // … ≥250 entries in total, ≥8 per category, covering every category in PRODUCT_CATEGORIES.
  // Required to include the design sample items: milk, atta (Aashirvaad 10 kg), toor-dal, sunflower-oil
  // (Fortune 1 L/5 L), salt (Tata), onion, detergent (Surf Excel 1 kg), eggs (6/12/30 pcs).
  // Aliases: Hindi + Marathi transliterations (cheeni|shakkar|sakhar, haldi|halad, jeera|jire, chawal|tandul, sabun …).
  // Weighed produce uses g/kg packs; liquids ml/L; counted items pcs. One unit family per product.
];
export function searchProducts<T extends { name: string; aliases: string[] }>(q: string, items: T[]): T[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const score = (t: T) => {
    const words = [t.name, ...t.aliases].map(w => w.toLowerCase());
    if (words.some(w => w === s)) return 0;
    if (words.some(w => w.startsWith(s))) return 1;
    if (words.some(w => w.includes(s))) return 2;
    return -1;
  };
  return items.map(t => [t, score(t)] as const).filter(([, sc]) => sc >= 0).sort((a, b) => a[1] - b[1]).map(([t]) => t);
}
```
> The catalog rows are data: write them all out (about 16 categories × 16 items). The test above enforces the shape.

`schemas.ts`:
```ts
import { z } from 'zod';
export const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const id = z.string().uuid();
const name = z.string().trim().min(1).max(80);
const paise = z.number().int().positive().max(100_000_000_00);
const qty = z.number().int().min(1).max(999);
export const CreateList = z.object({ name, month: Month.optional() });
export const UpdateList = z.object({ name: name.optional(), month: Month.nullable().optional(), status: z.enum(['draft', 'shopping', 'done']).optional(), archived: z.boolean().optional() });
export const CopyList = z.object({ name, month: Month.optional() });
export const AddListItem = z.object({ productId: id, packSize: z.string().min(1).max(20), brand: z.string().max(40).nullable(), qty });
export const UpdateListItem = z.object({ packSize: z.string().min(1).max(20).optional(), brand: z.string().max(40).nullable().optional(), qty: qty.optional(), checked: z.boolean().optional(), position: z.number().int().min(0).optional() });
export const CreateProduct = z.object({ name, aliases: z.array(z.string().max(40)).max(10).default([]), category: z.string(), emoji: z.string().min(1).max(8), packSizes: z.array(z.string()).min(1).max(8), brands: z.array(z.string().max(40)).max(10).default([]) });
export const StartTrip = z.object({ listId: id.optional(), store: z.string().trim().max(80).optional() });
export const AddTripItem = z.object({ productId: id, packSize: z.string().min(1).max(20), brand: z.string().max(40).nullable(), qty, pricePaise: paise, listItemId: id.optional() });
export const UpdateTripItem = z.object({ qty: qty.optional(), pricePaise: paise.optional() });
export const FinishTrip = z.object({ billTotalPaise: paise });
export const ManualTxn = z.object({ amountPaise: paise, direction: z.enum(['debit', 'credit']), categoryId: id, occurredAt: z.string().datetime({ offset: true }), merchant: z.string().max(80).optional(), note: z.string().max(200).optional() });
export const UpdateTxn = z.object({ categoryId: id, makeRule: z.boolean().default(false) });
export const SmsItem = z.object({ amountPaise: paise, direction: z.enum(['debit', 'credit']), merchant: z.string().max(120).nullable(), ref: z.string().max(40).nullable(), last4: z.string().max(6).nullable(), bank: z.string().max(40).nullable(), occurredAt: z.string().datetime({ offset: true }) });
export const SmsBatch = z.object({ items: z.array(SmsItem).max(500) });
```
`CreateProduct` must refine `packsBaseUnit(packSizes) !== null` and `category` ∈ `PRODUCT_CATEGORIES`.
- [ ] **Step 4:** PASS · export · **Step 5:** commit `feat(shared): catalog, search, API schemas`

---

### Task 7: API core: DB schema, auth, errors, products & lists

**Prereq (one-time, on the VM):**
```bash
ssh -i ~/Downloads/ssh-key-2026-09-04.key ubuntu@137.23.49.189 'sudo -u postgres createdb -p 5433 -O rupli rupli_test'
```
Local tunnel for tests: `ssh -fN -i ~/Downloads/ssh-key-2026-09-04.key -L 15433:127.0.0.1:5433 ubuntu@137.23.49.189`, then
`api/.env.test`: `TEST_DATABASE_URL=postgres://rupli:<pw from .env.vm>@127.0.0.1:15433/rupli_test`

**Files:** `api/package.json`, `api/tsconfig.json`, `api/drizzle.config.ts`, `api/vitest.config.ts`, `api/src/db/{schema,client}.ts`, `api/src/lib/{http,auth,env,prices}.ts`, `api/src/routes/{products,lists}.ts`, `api/src/{app,seed,migrate}.ts`, `api/test/{global-setup,helpers,lists.test}.ts`

**Interfaces:**
- `createApp({ db: Db, verify: (token: string) => Promise<string | null> }): Hono`
- `AppEnv = { Variables: { userId: string; db: Db } }`
- `lastPrices(db, userId): Promise<Map<string, { pricePaise: number; brand: string | null; at: Date }>>`, where the key is `priceKey(productId, packSize)` = `${productId}|${packSize}`
- Routes (all under `/v1`, JSON):
  - `GET /products` → global + own products · `POST /products` → 201 custom product · `GET /products/usual` → up to 12 most frequent product ids · `GET /categories`
  - `GET /lists` → `[{id,name,month,status,copiedFrom,createdAt,itemCount,checkedCount,estimatePaise}]` (not archived, newest first)
  - `POST /lists` 201 · `GET /lists/:id` → list + `items[{…item, product:{id,name,aliases,emoji,category}, lastPricePaise, lastBrand}]` · `PATCH /lists/:id`
  - `POST /lists/:id/copy` (CopyList) → 201 new list, items copied with `checked:false`, `copiedFrom` set
  - `POST /lists/:id/items` 201 · `PATCH /lists/:id/items/:itemId` · `DELETE /lists/:id/items/:itemId` 204

- [ ] **Step 1: Scaffold**
```bash
npm i -w api hono @hono/node-server drizzle-orm postgres @clerk/backend tsx zod @rupli/shared
npm i -D -w api drizzle-kit vitest typescript @types/node dotenv
```
`api/package.json` scripts: `"test": "vitest run"`, `"start": "tsx src/server.ts"`, `"migrate": "tsx src/migrate.ts"`, `"db:generate": "drizzle-kit generate"`. `"type": "module"`.

`api/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import 'dotenv/config';
export default defineConfig({ test: { globalSetup: './test/global-setup.ts', fileParallelism: false, env: { DOTENV_CONFIG_PATH: '.env.test' } } });
```
(Load `.env.test` via `dotenv.config({ path: '.env.test' })` at the top of `global-setup.ts` and `helpers.ts`.)

- [ ] **Step 2: DB schema** `api/src/db/schema.ts`
```ts
import { sql } from 'drizzle-orm';
import { pgTable, pgEnum, text, uuid, integer, bigint, boolean, timestamp, date, uniqueIndex, index, type AnyPgColumn } from 'drizzle-orm/pg-core';

export const listStatus = pgEnum('list_status', ['draft', 'shopping', 'done']);
export const direction = pgEnum('direction', ['debit', 'credit']);
export const txnSource = pgEnum('txn_source', ['manual', 'cart', 'sms']);
const id = () => uuid('id').primaryKey().defaultRandom();
const ts = (n: string) => timestamp(n, { withTimezone: true });
const money = (n: string) => bigint(n, { mode: 'number' });
const owner = () => text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' });
const emptyArr = sql`'{}'::text[]`;

export const users = pgTable('users', { id: text('id').primaryKey(), createdAt: ts('created_at').notNull().defaultNow() });
export const products = pgTable('products', {
  id: id(), userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), slug: text('slug').unique(),
  name: text('name').notNull(), aliases: text('aliases').array().notNull().default(emptyArr), category: text('category').notNull(),
  emoji: text('emoji').notNull(), baseUnit: text('base_unit', { enum: ['kg', 'L', 'pcs'] }).notNull(),
  packSizes: text('pack_sizes').array().notNull(), brands: text('brands').array().notNull().default(emptyArr),
});
export const lists = pgTable('lists', {
  id: id(), userId: owner(), name: text('name').notNull(), month: date('month', { mode: 'string' }),
  status: listStatus('status').notNull().default('draft'),
  copiedFrom: uuid('copied_from').references((): AnyPgColumn => lists.id, { onDelete: 'set null' }),
  archivedAt: ts('archived_at'), createdAt: ts('created_at').notNull().defaultNow(),
}, t => [index('lists_user_idx').on(t.userId)]);
export const listItems = pgTable('list_items', {
  id: id(), listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id), packSize: text('pack_size').notNull(), brand: text('brand'),
  qty: integer('qty').notNull().default(1), checked: boolean('checked').notNull().default(false), position: integer('position').notNull().default(0),
}, t => [index('list_items_list_idx').on(t.listId)]);
export const trips = pgTable('trips', {
  id: id(), userId: owner(), listId: uuid('list_id').references(() => lists.id, { onDelete: 'set null' }), store: text('store'),
  startedAt: ts('started_at').notNull().defaultNow(), pausedAt: ts('paused_at'), finishedAt: ts('finished_at'), billTotalPaise: money('bill_total_paise'),
}, t => [index('trips_user_idx').on(t.userId)]);
export const tripItems = pgTable('trip_items', {
  id: id(), tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id), packSize: text('pack_size').notNull(), brand: text('brand'),
  qty: integer('qty').notNull(), pricePaise: money('price_paise').notNull(),
  listItemId: uuid('list_item_id').references(() => listItems.id, { onDelete: 'set null' }),
}, t => [index('trip_items_trip_idx').on(t.tripId)]);
export const accounts = pgTable('accounts', {
  id: id(), userId: owner(), bank: text('bank').notNull(), last4: text('last4').notNull(), type: text('type').notNull().default('bank'),
}, t => [uniqueIndex('accounts_uniq').on(t.userId, t.bank, t.last4)]);
export const categories = pgTable('categories', {
  id: id(), userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), slug: text('slug').unique(),
  name: text('name').notNull(), emoji: text('emoji').notNull(),
});
export const categoryRules = pgTable('category_rules', {
  id: id(), userId: owner(), pattern: text('pattern').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, t => [uniqueIndex('rules_uniq').on(t.userId, t.pattern)]);
export const transactions = pgTable('transactions', {
  id: id(), userId: owner(), amountPaise: money('amount_paise').notNull(), direction: direction('direction').notNull(),
  occurredAt: ts('occurred_at').notNull(), merchant: text('merchant'), categoryId: uuid('category_id').notNull().references(() => categories.id),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }), source: txnSource('source').notNull(),
  sourceRef: text('source_ref'), tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  linkedTransactionId: uuid('linked_transaction_id').references((): AnyPgColumn => transactions.id, { onDelete: 'set null' }),
  note: text('note'), createdAt: ts('created_at').notNull().defaultNow(),
}, t => [uniqueIndex('txn_source_ref_uniq').on(t.userId, t.source, t.sourceRef), index('txn_user_time_idx').on(t.userId, t.occurredAt)]);
```
`client.ts`:
```ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
export const createDb = (url: string) => drizzle(postgres(url, { max: 10 }), { schema });
export type Db = ReturnType<typeof createDb>;
```
`drizzle.config.ts`: `defineConfig({ dialect: 'postgresql', schema: './src/db/schema.ts', out: './drizzle' })`. Run `npm run db:generate -w api` and commit `api/drizzle/`.

- [ ] **Step 3: lib**

`lib/http.ts`:
```ts
import type { Context } from 'hono';
import type { z } from 'zod';
export class ApiError extends Error {
  constructor(public status: 400 | 401 | 404 | 409, public code: string, message: string) { super(message); }
}
export const notFound = (what: string) => new ApiError(404, 'not_found', `${what} not found`);
export const body = async <S extends z.ZodType>(c: Context, s: S): Promise<z.infer<S>> => s.parse(await c.req.json());
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function idParam(c: Context, name = 'id') { const v = c.req.param(name); if (!v || !UUID.test(v)) throw notFound('resource'); return v; }
export function onError(err: Error, c: Context) {
  if (err instanceof ApiError) return c.json({ error: { code: err.code, message: err.message } }, err.status);
  if (err.name === 'ZodError') return c.json({ error: { code: 'invalid_input', message: (err as z.ZodError).issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') } }, 400);
  if (err instanceof SyntaxError) return c.json({ error: { code: 'invalid_json', message: 'Body must be JSON' } }, 400);
  console.error(err);
  return c.json({ error: { code: 'internal', message: 'Something went wrong' } }, 500);
}
```
`lib/auth.ts`:
```ts
import { verifyToken } from '@clerk/backend';
import type { MiddlewareHandler } from 'hono';
import { users } from '../db/schema';
import { ApiError } from './http';
import type { AppEnv } from './env';
export type Verify = (token: string) => Promise<string | null>;
export const clerkVerify = (secretKey: string): Verify => async token => {
  try { return (await verifyToken(token, { secretKey })).sub; } catch { return null; }
};
export const auth = (verify: Verify): MiddlewareHandler<AppEnv> => async (c, next) => {
  const h = c.req.header('authorization');
  const userId = h?.startsWith('Bearer ') ? await verify(h.slice(7)) : null;
  if (!userId) throw new ApiError(401, 'unauthenticated', 'Sign in required');
  await c.get('db').insert(users).values({ id: userId }).onConflictDoNothing();
  c.set('userId', userId);
  await next();
};
```
`lib/prices.ts`: `priceKey` + `lastPrices` using
```sql
select distinct on (ti.product_id, ti.pack_size) ti.product_id, ti.pack_size, ti.price_paise, ti.brand, t.finished_at
from trip_items ti join trips t on t.id = ti.trip_id
where t.user_id = ${userId} and t.finished_at is not null
order by ti.product_id, ti.pack_size, t.finished_at desc
```
(Run it via `db.execute(sql\`…\`)` and convert `price_paise` with `Number()`.)

`app.ts`:
```ts
export function createApp({ db, verify }: { db: Db; verify: Verify }) {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(c => c.json({ error: { code: 'not_found', message: 'Not found' } }, 404));
  app.get('/health', c => c.json({ ok: true }));
  app.use('*', async (c, next) => { c.set('db', db); await next(); });
  app.use('/v1/*', auth(verify));
  app.route('/v1/products', products); app.route('/v1/categories', categoriesRoute); app.route('/v1/lists', lists);
  // Task 8/9 add: trips, transactions, spend
  return app;
}
```
`seed.ts` `seed(db)`: upsert `DEFAULT_CATEGORIES` (on conflict slug do update name/emoji) and `CATALOG` (on conflict slug do update all fields). `migrate.ts`: `migrate(db, { migrationsFolder: './drizzle' })` → `seed(db)` → exit.

**Ownership pattern** in every route: load the parent with `and(eq(table.id, id), eq(table.userId, c.get('userId')))`. If it's missing, `throw notFound('list')`. Child rows are only reached through that parent. Products used in items must be global **or** owned by the user, otherwise 404 `product`. New item `position` = current max + 1.

- [ ] **Step 4: Tests** `api/test/helpers.ts`:
```ts
import { config } from 'dotenv'; config({ path: '.env.test' });
import { sql, eq } from 'drizzle-orm';
import { createDb } from '../src/db/client';
import { createApp } from '../src/app';
import { products } from '../src/db/schema';
export const db = createDb(process.env.TEST_DATABASE_URL!);
export const app = createApp({ db, verify: async t => (t.startsWith('user_') ? t : null) });
export const req = (user: string | null, method: string, path: string, body?: unknown) =>
  app.request(path, { method, headers: { 'content-type': 'application/json', ...(user ? { authorization: `Bearer ${user}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
export const productId = async (slug: string) => (await db.select().from(products).where(eq(products.slug, slug)))[0]!.id;
export async function resetDb() {
  await db.execute(sql`delete from transactions; delete from category_rules; delete from accounts; delete from trip_items; delete from trips;
    delete from list_items; delete from lists; delete from products where user_id is not null; delete from categories where user_id is not null; delete from users;`);
}
```
`global-setup.ts`: load env, run `migrate` + `seed` on the test DB.

`lists.test.ts` must cover:
```ts
beforeEach(resetDb);
it('401 without token', async () => expect((await req(null, 'GET', '/v1/lists')).status).toBe(401));
it('create → add item → get → copy', async () => {
  const l = await (await req('user_a', 'POST', '/v1/lists', { name: 'Oct 2026 · Monthly Kirana', month: '2026-10' })).json();
  const milk = await productId('milk');
  expect((await req('user_a', 'POST', `/v1/lists/${l.id}/items`, { productId: milk, packSize: '1 L', brand: 'Amul', qty: 30 })).status).toBe(201);
  const got = await (await req('user_a', 'GET', `/v1/lists/${l.id}`)).json();
  expect(got.items[0]).toMatchObject({ qty: 30, packSize: '1 L', lastPricePaise: null, product: { name: 'Milk' } });
  await req('user_a', 'PATCH', `/v1/lists/${l.id}/items/${got.items[0].id}`, { checked: true });
  const copy = await (await req('user_a', 'POST', `/v1/lists/${l.id}/copy`, { name: 'Nov 2026 · Monthly Kirana', month: '2026-11' })).json();
  const c = await (await req('user_a', 'GET', `/v1/lists/${copy.id}`)).json();
  expect(c).toMatchObject({ month: '2026-11', copiedFrom: l.id });
  expect(c.items[0]).toMatchObject({ qty: 30, checked: false });
});
it('cross-user and bad ids → 404', async () => {
  const l = await (await req('user_a', 'POST', '/v1/lists', { name: 'A' })).json();
  expect((await req('user_b', 'GET', `/v1/lists/${l.id}`)).status).toBe(404);
  expect((await req('user_b', 'PATCH', `/v1/lists/${l.id}`, { name: 'x' })).status).toBe(404);
  expect((await req('user_a', 'GET', '/v1/lists/not-a-uuid')).status).toBe(404);
});
it('cannot use another user’s custom product', async () => {
  const p = await (await req('user_a', 'POST', '/v1/products', { name: 'Ragi', category: 'atta-rice', emoji: '🌾', packSizes: ['1 kg'] })).json();
  const l = await (await req('user_b', 'POST', '/v1/lists', { name: 'B' })).json();
  expect((await req('user_b', 'POST', `/v1/lists/${l.id}/items`, { productId: p.id, packSize: '1 kg', brand: null, qty: 1 })).status).toBe(404);
});
it('400 on invalid input with error shape', async () => {
  const r = await req('user_a', 'POST', '/v1/lists', { name: '' });
  expect(r.status).toBe(400);
  expect((await r.json()).error.code).toBe('invalid_input');
});
```
- [ ] **Step 5:** `npm test -w api` → FAIL, then implement the routes until PASS
- [ ] **Step 6:** commit `feat(api): db schema, auth, products, lists`

---

### Task 8: Trips & cart → transaction

**Files:** `api/src/routes/trips.ts`, `api/test/trips.test.ts` · register in `app.ts`

**Routes:** `POST /v1/trips` (StartTrip; if `listId` is given it must be owned, and the list status becomes `shopping`) · `GET /v1/trips?limit=5` (finished trips, newest first, with `itemCount`, `totalPaise`) · `GET /v1/trips/:id` (trip + items with product) · `POST /v1/trips/:id/items` (AddTripItem) · `PATCH|DELETE /v1/trips/:id/items/:itemId` · `POST /v1/trips/:id/pause` (toggles `pausedAt`) · `POST /v1/trips/:id/finish` (FinishTrip).

Any change to a finished trip → **409 `trip_finished`**.

**Finish**, inside `db.transaction`:
1. `update trips set finished_at = now(), bill_total_paise = $b where id = $id and user_id = $u and finished_at is null returning *`. If no row: 404 if the trip doesn't exist or isn't the user's, else 409.
2. Insert a transaction `{ source: 'cart', sourceRef: trip.id, tripId, amountPaise: billTotalPaise, direction: 'debit', categoryId: groceries, merchant: trip.store ?? 'Grocery trip', occurredAt: now }`.
3. Link an SMS that arrived **before** finish: set `linked_transaction_id = cartTxn.id` on the closest unlinked `sms` debit with the same amount within ±30 min.
4. If the trip has a list → status `done`.

Return `{ trip, transactionId }`.

- [ ] **Step 1: Tests** (`trips.test.ts`):
  - start from list → list status `shopping`; add Toor Dal `qty 2, pricePaise 17700`; finish with `billTotalPaise: 35400` → 200; `GET /v1/lists/:id` shows `lastPricePaise: 17700` for that item and status `done`.
  - **finish twice** → second is 409, and `select count(*) from transactions where trip_id = …` = 1.
  - adding an item to a finished trip → 409.
  - user_b `GET /v1/trips/:id` → 404.
  - an SMS posted before finish (via `/v1/transactions/sms-batch` from Task 9; mark this test `it.todo` until Task 9, then enable it) with the same amount 5 min earlier → after finish, the SMS has `linkedTransactionId` = the cart transaction.
- [ ] **Step 2:** FAIL → implement → PASS
- [ ] **Step 3:** commit `feat(api): trips + finish creates cart transaction`

---

### Task 9: Transactions, SMS batch & spend

**Files:** `api/src/routes/{transactions,spend}.ts`, `api/src/lib/months.ts`, `api/test/{transactions,spend}.test.ts`

**Routes:**
- `POST /v1/transactions` (ManualTxn; category must be default or the user's own) → 201
- `PATCH /v1/transactions/:id` (UpdateTxn) → updates the category. If `makeRule` and there's a merchant: upsert `category_rules (user, lower(merchant)) → categoryId`, and re-categorise the user's other transactions with the same merchant.
- `POST /v1/transactions/sms-batch` (SmsBatch) → `{ inserted, duplicates, linked }`. For each item:
  account upsert (`bank ?? 'Unknown'`, `last4`, skipped if there's no last4) → category = `matchRule(merchant, userRules) ?? defaultSlugId` → insert with `sourceRef = ref ?? smsFallbackRef(item)` and `onConflictDoNothing().returning()`. No row back means a duplicate. For a debit, link it to the cart transaction chosen by `findCartMatch`, among unlinked cart transactions within ±30 min.
  `// ponytail: one insert per item; batch insert if imports >5k feel slow`
- `GET /v1/spend?month=YYYY-MM` →
  ```
  { month, totalPaise, prevTotalPaise, months: [{ month, totalPaise }] /* 6, oldest first */,
    byProductCategory: [{ category, totalPaise }] /* from trip_items of trips finished this month, plus 'other' = total − Σ, if > 0 */,
    transactions: [{ id, amountPaise, direction, occurredAt, merchant, source, category: { id, name, emoji }, account: { bank, last4 } | null }] }
  ```
  Totals = **Groceries-category debits, excluding rows with `linked_transaction_id`**, with month boundaries in Asia/Kolkata (`new Date(\`${m}-01T00:00:00+05:30\`)`). `transactions` lists every category for the month, linked rows excluded, newest first, limit 200.
- `lib/months.ts`: `monthsEnding('2026-10', 6)` → `['2026-05', …, '2026-10']` (handles year rollover).

- [ ] **Step 1: Tests**
  - `transactions.test.ts`: post the HDFC Zepto item → `inserted: 1`, category Groceries, account HDFC Bank ••1234 created; **post the same batch again → `{ inserted: 0, duplicates: 1 }`**; an item with `ref: null` posted twice → still one row; re-categorise with `makeRule: true` → a later SMS from the same merchant gets the new category; user_b PATCH on user_a's transaction → 404; credit SMS → Income.
  - `spend.test.ts`: finish a ₹2,348 trip in Oct and a ₹9,105 manual Groceries debit in Sep → `totalPaise 234800`, `prevTotalPaise 910500`, 6 months; an SMS debit of ₹2,348 10 min after the trip is linked and **not** double-counted; `monthsEnding('2026-02', 3)` → `['2025-12','2026-01','2026-02']`; a transaction at `2026-10-31T20:00:00+05:30` counts in October.
  - Enable the `it.todo` from Task 8.
- [ ] **Step 2:** FAIL → implement → PASS (`npm test` at the root: all green)
- [ ] **Step 3:** commit `feat(api): transactions, SMS batch, spend summary`

---

### Task 10: Deploy to the VM

**Files:** `api/src/server.ts`, `deploy/rupli-api.service`, `deploy/Caddyfile`, `deploy/deploy.sh`

- [ ] **Step 1:** `server.ts`
```ts
import { serve } from '@hono/node-server';
import { createDb } from './db/client';
import { createApp } from './app';
import { clerkVerify } from './lib/auth';
const must = (k: string) => process.env[k] ?? (() => { throw new Error(`${k} missing`); })();
const app = createApp({ db: createDb(must('DATABASE_URL')), verify: clerkVerify(must('CLERK_SECRET_KEY')) });
serve({ fetch: app.fetch, hostname: '127.0.0.1', port: Number(process.env.PORT ?? 8787) }, i => console.log(`rupli-api :${i.port}`));
```
- [ ] **Step 2:** `deploy/rupli-api.service`
```ini
[Unit]
Description=Rupli API
After=network.target postgresql@18-main.service
[Service]
User=rupli-api
WorkingDirectory=/opt/rupli/api
EnvironmentFile=/etc/rupli/api.env
ExecStart=/usr/bin/npx tsx src/server.ts
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
[Install]
WantedBy=multi-user.target
```
`// ponytail: tsx at runtime; switch to a compiled build if cold start matters`

`deploy/Caddyfile`:
```
137-23-49-189.sslip.io {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8787
}
```
- [ ] **Step 3: One-time VM setup**
```bash
ssh -i ~/Downloads/ssh-key-2026-09-04.key ubuntu@137.23.49.189 '
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
sudo useradd --system --no-create-home rupli-api || true
sudo install -d -o rupli-api /opt/rupli && sudo install -d -m 750 -o root -g rupli-api /etc/rupli'
```
The **owner** creates `/etc/rupli/api.env` (mode 640, root:rupli-api) containing `DATABASE_URL` (from `.env.vm`), `CLERK_SECRET_KEY` (from the Clerk dashboard; the owner pastes it, the agent never does) and `PORT=8787`.

- [ ] **Step 4:** `deploy/deploy.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
KEY=~/Downloads/ssh-key-2026-09-04.key; VM=ubuntu@137.23.49.189
rsync -az --delete --exclude node_modules --exclude '.env*' --exclude .git --exclude app --exclude docs -e "ssh -i $KEY" ./ $VM:/tmp/rupli/
ssh -i $KEY $VM 'sudo rsync -a --delete --exclude node_modules /tmp/rupli/ /opt/rupli/ && sudo chown -R rupli-api /opt/rupli &&
  cd /opt/rupli && sudo -u rupli-api npm ci --omit=dev -w api -w shared --include-workspace-root &&
  sudo -u rupli-api bash -c "set -a; . /etc/rupli/api.env; cd api && npx tsx src/migrate.ts" &&
  sudo cp deploy/rupli-api.service /etc/systemd/system/ && sudo cp deploy/Caddyfile /etc/caddy/Caddyfile &&
  sudo systemctl daemon-reload && sudo systemctl enable --now rupli-api && sudo systemctl restart rupli-api && sudo systemctl reload caddy'
```
(`drizzle-kit` and `vitest` are devDeps; `tsx`, `drizzle-orm` and `postgres` are runtime deps.)

- [ ] **Step 5: ⚠ Ask the owner before running.** This opens ports 80/443 to the internet.
```bash
OCI=<oci binary>; SL=$($OCI network subnet get --subnet-id ocid1.subnet.oc1.ap-mumbai-1.aaaaaaaaahkks4ujt6kxwyq32g2thchgxxvbzepxauz4nsbulxlghcamkmdq --query 'data."security-list-ids"[0]' --raw-output)
$OCI network security-list get --security-list-id $SL --query 'data."ingress-security-rules"' > /tmp/ing.json
python3 - <<'EOF'
import json
r = json.load(open('/tmp/ing.json'))
def cc(d): return {''.join(w.capitalize() if i else w for i, w in enumerate(k.split('-'))): cc(v) if isinstance(v, dict) else v for k, v in d.items() if v is not None}
r = [cc(x) for x in r] + [{"source": "0.0.0.0/0", "protocol": "6", "isStateless": False, "tcpOptions": {"destinationPortRange": {"min": p, "max": p}}} for p in (80, 443)]
json.dump(r, open('/tmp/ing-new.json', 'w'))
EOF
$OCI network security-list update --security-list-id $SL --ingress-security-rules file:///tmp/ing-new.json --force
ssh -i ~/Downloads/ssh-key-2026-09-04.key ubuntu@137.23.49.189 'sudo iptables -I INPUT 5 -p tcp -m state --state NEW -m multiport --dports 80,443 -j ACCEPT && sudo netfilter-persistent save'
```
- [ ] **Step 6: Smoke test**
```bash
curl -s https://137-23-49-189.sslip.io/health          # → {"ok":true}
curl -s -o /dev/null -w '%{http_code}\n' https://137-23-49-189.sslip.io/v1/lists   # → 401
ssh … 'sudo ss -tlnp | grep -E "5433|8787"'            # both bound to 127.0.0.1 only
```
- [ ] **Step 7:** commit `feat(deploy): systemd + Caddy deploy to Oracle VM`

---

## Self-review notes
- Spec §4.2 "copy last month": the client picks the previous-month list from `GET /lists` and calls `/copy` (one endpoint instead of two).
- Spec §6: `pack_sizes` is `text[]` (labels like "1 L") instead of jsonb; units are derived with `parsePack`. `categories.slug` and `products.slug` were added for idempotent seeding.
- Spec §8: the plan has 14 SMS fixtures; add real ones as you meet them in Plan 3 (the target is about 30).
- Not in this plan: the app (Plan 2), the SMS native module (Plan 3), the backup cron (waiting for owner approval).
