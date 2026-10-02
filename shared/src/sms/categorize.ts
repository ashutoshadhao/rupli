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
  ['airtel', 'bills'], ['jio', 'bills'], ['vodafone', 'bills'], ['vi', 'bills'], ['bescom', 'bills'], ['msedcl', 'bills'],
  ['mahadiscom', 'bills'], ['tata power', 'bills'],
  ['netflix', 'entertainment'], ['hotstar', 'entertainment'], ['bookmyshow', 'entertainment'], ['spotify', 'entertainment'],
] as const).map(([pattern, key]) => ({ pattern, key }));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// whole-word, case-insensitive; first rule wins
export function matchRule<K>(merchant: string | null, rules: { pattern: string; key: K }[]): K | null {
  if (!merchant) return null;
  for (const r of rules) if (new RegExp(`(^|[^a-z0-9])${esc(r.pattern)}($|[^a-z0-9])`, 'i').test(merchant)) return r.key;
  return null;
}

export function defaultCategorySlug(merchant: string | null, direction: 'debit' | 'credit'): CategorySlug {
  return matchRule(merchant, DEFAULT_RULES) ?? (direction === 'credit' ? 'income' : 'uncategorised');
}
