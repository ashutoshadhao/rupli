# Rupli — Claude Design brief

Paste everything below the line into Claude Design (claude.ai/design).

---

Design a mobile app UI (Android, 390×844 frames) for **Rupli**, a grocery shopping and spend
tracking app for Indian households, aimed at Gen Z / young millennial users who run the
monthly kirana shopping for their family.

## Feel
- Fresh, playful, confident: Gen Z, not corporate banking. Think friendly fintech meets a
  kirana store, not a spreadsheet.
- Built for **one-handed use in a busy supermarket**: big tap targets (min 48dp), key actions in
  the thumb zone at the bottom, high contrast, readable in bright store lighting.
- Indian context: ₹ everywhere, amounts formatted Indian-style (₹1,25,000), item names in
  English with Hindi/Marathi words shown as secondary text (e.g. "Milk · doodh").
- Emoji as product icons (🥛 🍚 🫘 🧅 🧴), so no product photography is needed.
- Light and dark mode.
- Avoid the generic purple-gradient AI look. Choose a distinctive palette and a typeface with
  character that still renders ₹ and numbers clearly. Numbers (prices, totals) should feel
  prominent and satisfying, using tabular figures.

## Screens to design

1. **Sign in**: Clerk-style: "Continue with Google", email OTP. Rupli wordmark + one-line pitch.
2. **App lock**: fingerprint prompt over blurred app.
3. **Home**: this month's grocery spend (big number + vs last month), "Start shopping"
   primary CTA, current monthly list card with progress (12/40 items), recent trips, quick links
   to Compare and Spend. Bottom nav: Home · Lists · Compare · Spend.
4. **Lists**: list cards with month tag ("Oct 2026 · Monthly Kirana"), item count, estimated
   total. Primary action: **"Copy last month's list"**, secondary: "New list".
5. **List detail**: items grouped by category, each row: emoji, name, pack size, brand chip,
   qty stepper, last paid price in muted text, checkbox. Floating "Add items" button. Header shows
   estimated total.
6. **Product picker** (the most important screen, with almost no typing):
   - Search bar on top (searches English + Hindi/Marathi aliases).
   - "Your usual" horizontal row of frequent items.
   - Category tabs (Dairy, Atta & Rice, Dal, Oil & Ghee, Masala, Sabzi, Fruits, Bakery & Eggs,
     Snacks, Beverages, Dry Fruits, Cleaning, Personal Care, Pooja, Baby, Kitchen).
   - Grid of product tiles (emoji + name + alias).
   - **Bottom sheet after tapping a tile** (e.g. Milk): pack-size chips (500 ml · 1 L · 6 L),
     optional brand chips (Amul · Mother Dairy · Gokul · Any), qty stepper, "Add to list" button.
     Show the selected-items count in a sticky bottom bar.
7. **Cart mode** (in-store): sticky top bar with **running total** (huge) and item count.
   Two sections: "To pick" and "In cart". Tapping an item opens a price sheet with a big numeric
   keypad, **filled in with the last paid price**, and a warning chip if the new price is higher
   ("₹12 more than last time"). "+ Add item" for unlisted items. Bottom CTA: "At the counter".
8. **Bill check**: enter the bill total → success state (✅ "Bill matches ₹2,348") or mismatch
   state (❌ "Bill is ₹23 more than your cart"), with the list of items to recheck. "Finish trip"
   button.
9. **Compare**: 2–4 option cards, each: name, quantity + unit selector (g/kg/ml/L/pcs), price.
   Results: price per kg/L/pc for each, the cheapest highlighted with a "Best value" badge, saving
   shown in ₹ and % ("5 L tin saves ₹9/L · 5.5%"). "Add winner to list" button.
10. **Spend**: month selector, total, monthly trend bar chart (6 months), category breakdown
    (donut or bars), transaction list with source badges (Cart 🛒 / SMS 💬 / Manual ✍️),
    "+ Add expense" button.
11. **Transaction detail / re-categorise**: amount, merchant, account (HDFC ••1234), UPI ref,
    category picker with an "Always categorise Zepto as Groceries" toggle.
12. **SMS import onboarding**: explain what's read and that raw SMS never leave the phone,
    permission request, then progress ("Reading last 6 months… 342 transactions found").
13. **Empty states** for Lists, Spend and Compare, plus an offline banner ("Offline: changes will sync").

## Sample data to use
- List "Oct 2026 · Monthly Kirana": Milk 1 L × 30 (Amul, ₹68), Aashirvaad Atta 10 kg (₹485),
  Toor Dal 1 kg × 2 (₹165), Fortune Sunflower Oil 5 L (₹780), Tata Salt 1 kg (₹28), Onion 2 kg
  (₹60), Surf Excel 1 kg (₹140), Eggs 30 (₹210).
- This month's spend ₹8,420 vs ₹9,105 last month.
- Compare: Fortune Oil 1 L ₹165 vs Fortune Oil 5 L ₹780 vs Saffola 1 L ₹199.

Deliver: the screens above as a consistent design system (colors, type scale, spacing,
components: buttons, chips, steppers, cards, bottom sheets, numeric keypad, list rows, nav).
