import { z } from 'zod';
import { packsBaseUnit } from './units';
import { PRODUCT_CATEGORIES } from './catalog';

export const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const id = z.string().uuid();
const name = z.string().trim().min(1).max(80);
const paise = z.number().int().positive().max(10_000_000_000);
const qty = z.number().int().min(1).max(999);
const pack = z.string().min(1).max(20);
const brand = z.string().max(40).nullable();
const nonEmpty = (o: object) => Object.keys(o).length > 0;

export const CreateList = z.object({ name, month: Month.optional() });
export const UpdateList = z.object({
  name: name.optional(), month: Month.nullable().optional(),
  status: z.enum(['draft', 'shopping', 'done']).optional(), archived: z.boolean().optional(),
}).refine(nonEmpty, 'nothing to update');
export const CopyList = z.object({ name, month: Month.optional() });
export const AddListItem = z.object({ id: id.optional(), productId: id, packSize: pack, brand, qty });
export const UpdateListItem = z.object({
  packSize: pack.optional(), brand: brand.optional(), qty: qty.optional(),
  checked: z.boolean().optional(), position: z.number().int().min(0).optional(),
}).refine(nonEmpty, 'nothing to update');
export const CreateProduct = z.object({
  name, aliases: z.array(z.string().max(40)).max(10).default([]),
  category: z.string().refine(c => PRODUCT_CATEGORIES.some(pc => pc.slug === c), 'unknown category'),
  emoji: z.string().min(1).max(8),
  packSizes: z.array(pack).min(1).max(8).refine(p => packsBaseUnit(p) !== null, 'pack sizes must share one unit family'),
  brands: z.array(z.string().max(40)).max(10).default([]),
});
export const StartTrip = z.object({ listId: id.optional(), store: z.string().trim().max(80).optional() });
export const AddTripItem = z.object({ id: id.optional(), productId: id, packSize: pack, brand, qty, pricePaise: paise, listItemId: id.optional() });
export const UpdateTripItem = z.object({ qty: qty.optional(), pricePaise: paise.optional() }).refine(nonEmpty, 'nothing to update');
export const PauseTrip = z.object({ paused: z.boolean() });
export const FinishTrip = z.object({ billTotalPaise: paise });
export const ManualTxn = z.object({
  amountPaise: paise, direction: z.enum(['debit', 'credit']), categoryId: id,
  occurredAt: z.string().datetime({ offset: true }), merchant: z.string().max(80).optional(), note: z.string().max(200).optional(),
});
export const UpdateTxn = z.object({ categoryId: id, makeRule: z.boolean().default(false) });
export const SmsItem = z.object({
  amountPaise: paise, direction: z.enum(['debit', 'credit']), merchant: z.string().max(120).nullable(),
  ref: z.string().max(40).nullable(), last4: z.string().max(6).nullable(), bank: z.string().max(40).nullable(),
  occurredAt: z.string().datetime({ offset: true }),
});
export const SmsBatch = z.object({ items: z.array(SmsItem).max(500) });

export const SetBudget = z.object({ budgetPaise: paise.nullable() });
export const CreateRecurring = z.object({
  name, amountPaise: paise, categoryId: id, dayOfMonth: z.number().int().min(1).max(31), startMonth: Month.optional(),
});
export const JoinList = z.object({ code: z.string().trim().min(4).max(12) });
