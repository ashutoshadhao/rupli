> **Cancelled 2026-10-03 by the owner**: SMS reading needs risky permissions (Play Protect prompts); spends are added manually instead. The app-side module and screens were removed; the API `POST /v1/transactions/sms-batch` and the shared parser remain unused.

# Rupli Plan 3: Bank SMS import (Android)

> Executed natively with no git operations (owner's rule). Owner asked to "continue until everything is done", so this plan was written and executed in one go.

**Goal:** Turn bank and UPI SMS into categorised transactions, parsed on the phone (spec §4.6, design screens 04–06).

**Architecture:**
- **Native reading:** a local Expo module, `app/modules/rupli-sms` (Kotlin), exposes `readInbox(sinceMs, limit)` over `Telephony.Sms.Inbox`. It requires READ_SMS, and the permission is declared in the module manifest.
- **Parsing:** JS filters to DLT bank senders, then parses with `@rupli/shared` `parseSms` (Plan 1, 18 fixtures).
- **Upload:** results go up in batches of 500 to `POST /v1/transactions/sms-batch`. The server dedupes by UPI ref and links SMS to cart trips.
- **Sync points:**
  - First opt-in: backfill the last 6 months.
  - After that: an incremental sync on every app foreground, from a per-user `sms-last-sync:<userId>` cursor that only advances after a successful upload.

**Decisions:**
- **No BroadcastReceiver or background service.** New SMS are picked up when the app opens. It's simpler, needs fewer permissions, and nothing runs while the app is closed. Cost: a payment appears next time Rupli is opened, not instantly.
- **Personal chats excluded by sender format.** Only DLT sender IDs (`AX-HDFCBK`, `AD-AXISBK-S`) are read; phone numbers and contacts are skipped.
- **Raw SMS bodies never leave the device.** Only `ParsedSms` fields plus `occurredAt` are uploaded.
- **Screen 05 is Android's own permission dialog**, shown via `PermissionsAndroid.request(READ_SMS)`.
- **Entry points:** Spend empty state → "Import SMS", and the Home avatar → "Import bank SMS". The avatar menu also gained Sign out, which clears the persisted cache.

**Files:** `app/modules/rupli-sms/**`, `app/src/logic/smsImport.ts` + `app/test/smsImport.test.ts`, `app/src/sms.ts`, `app/src/app/sms.tsx`, `app/src/app/(tabs)/_layout.tsx` (foreground sync), `app/src/app/(tabs)/index.tsx` (avatar menu).

**Tests:** `smsImport.test.ts` covers the sender filter, OTP and chat exclusion, the ISO time conversion, chunking, the per-category tally and the 6-month window.

**Device checks still needed (not testable on web):**
- First import over a real inbox.
- Permission denied, then allowed later.
- Kill the app mid-import, reopen, and confirm it resumes from the cursor without duplicates (the server dedupes on UPI ref).
