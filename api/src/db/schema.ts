import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, text, uuid, integer, bigint, boolean, timestamp, date, uniqueIndex, index, type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const listStatus = pgEnum('list_status', ['draft', 'shopping', 'done']);
export const direction = pgEnum('direction', ['debit', 'credit']);
export const txnSource = pgEnum('txn_source', ['manual', 'cart', 'sms']);

const id = () => uuid('id').primaryKey().defaultRandom();
const ts = (n: string) => timestamp(n, { withTimezone: true });
const money = (n: string) => bigint(n, { mode: 'number' });
const owner = () => text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' });
const emptyArr = sql`'{}'::text[]`;

export const users = pgTable('users', {
  id: text('id').primaryKey(), createdAt: ts('created_at').notNull().defaultNow(),
  budgetPaise: money('budget_paise'), // monthly grocery budget; null = not set
});

// user_id null = global catalog row (seeded by slug)
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
  inviteCode: text('invite_code').unique(), // set once the owner shares the list
}, t => [index('lists_user_idx').on(t.userId)]);

// family sharing: people who joined a list with its invite code
export const listMembers = pgTable('list_members', {
  listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: ts('joined_at').notNull().defaultNow(),
}, t => [uniqueIndex('list_members_pk').on(t.listId, t.userId), index('list_members_user_idx').on(t.userId)]);

// monthly bills (milkman, maid, rent) that become a transaction each month on dayOfMonth
export const recurringExpenses = pgTable('recurring_expenses', {
  id: id(), userId: owner(), name: text('name').notNull(), amountPaise: money('amount_paise').notNull(),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  dayOfMonth: integer('day_of_month').notNull(), startMonth: text('start_month').notNull(), // 'YYYY-MM'
  doneThrough: text('done_through'), // last month already added; a deleted month isn't re-added
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const listItems = pgTable('list_items', {
  id: id(), listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id), packSize: text('pack_size').notNull(), brand: text('brand'),
  qty: integer('qty').notNull().default(1), checked: boolean('checked').notNull().default(false),
  position: integer('position').notNull().default(0),
}, t => [index('list_items_list_idx').on(t.listId)]);

export const trips = pgTable('trips', {
  id: id(), userId: owner(), listId: uuid('list_id').references(() => lists.id, { onDelete: 'set null' }), store: text('store'),
  startedAt: ts('started_at').notNull().defaultNow(), pausedAt: ts('paused_at'), finishedAt: ts('finished_at'),
  billTotalPaise: money('bill_total_paise'),
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
  occurredAt: ts('occurred_at').notNull(), merchant: text('merchant'),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }), source: txnSource('source').notNull(),
  sourceRef: text('source_ref'), tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  // set on an SMS row that duplicates a cart row; such rows are excluded from totals
  linkedTransactionId: uuid('linked_transaction_id').references((): AnyPgColumn => transactions.id, { onDelete: 'set null' }),
  note: text('note'), createdAt: ts('created_at').notNull().defaultNow(),
}, t => [
  // direction is part of the key: a self-transfer has a debit and a credit with one UPI ref
  uniqueIndex('txn_source_ref_uniq').on(t.userId, t.source, t.sourceRef, t.direction),
  index('txn_user_time_idx').on(t.userId, t.occurredAt),
]);
