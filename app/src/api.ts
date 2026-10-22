import { useAuth } from './auth';
import { useCallback } from 'react';
import { ApiError } from './logic/sync';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://137-23-49-189.sslip.io';

export { ApiError };

// response shapes of the Plan 1 API
export type ListStatus = 'draft' | 'shopping' | 'done';
export interface ProductLite { id: string; name: string; aliases: string[]; emoji: string; category: string }
export interface Product extends ProductLite { slug: string | null; userId: string | null; baseUnit: 'kg' | 'L' | 'pcs'; packSizes: string[]; brands: string[] }
export interface ListSummary {
  id: string; name: string; month: string | null; status: ListStatus; copiedFrom: string | null; createdAt: string;
  itemCount: number; checkedCount: number; estimatePaise: number; paidPaise: number | null;
  owner?: boolean; shared?: boolean; memberCount?: number; // family sharing
}
export interface ListItem {
  id: string; listId: string; productId: string; packSize: string; brand: string | null; qty: number; checked: boolean; position: number;
  lastPricePaise: number | null; lastBrand: string | null; product: ProductLite;
}
export interface ListDetail extends Omit<ListSummary, 'itemCount' | 'checkedCount' | 'estimatePaise' | 'paidPaise'> { items: ListItem[]; inviteCode?: string | null }
export interface TripItem { id: string; tripId: string; productId: string; packSize: string; brand: string | null; qty: number; pricePaise: number; listItemId: string | null; product?: ProductLite }
export interface Trip {
  id: string; listId: string | null; store: string | null; startedAt: string; pausedAt: string | null; finishedAt: string | null;
  billTotalPaise: number | null; items?: TripItem[]; itemCount?: number; totalPaise?: number | null;
}
export interface Category { id: string; slug: string | null; name: string; emoji: string; userId: string | null }
export interface SpendTxn {
  id: string; amountPaise: number; direction: 'debit' | 'credit'; occurredAt: string; merchant: string | null;
  source: 'cart' | 'sms' | 'manual'; sourceRef: string | null; note: string | null;
  category: { id: string; name: string; emoji: string }; account: { bank: string; last4: string } | null;
}
export interface Spend {
  month: string; totalPaise: number; allPaise: number; prevTotalPaise: number; months: { month: string; totalPaise: number }[];
  byProductCategory: { category: string; totalPaise: number }[]; transactions: SpendTxn[]; budgetPaise: number | null;
}
export interface Recurring { id: string; name: string; amountPaise: number; categoryId: string; dayOfMonth: number; startMonth: string }
export interface PricePoint { packSize: string; pricePaise: number; brand: string | null; store: string | null; at: string }

export function useApi() {
  const { getToken } = useAuth();
  return useCallback(async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
    const token = await getToken();
    // a hung request would block the serial write queue, so give up after 15 s and let it retry
    const r = await fetch(API_URL + path, {
      method, signal: AbortSignal.timeout(15_000),
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (r.status === 204) return null as T;
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new ApiError(r.status, data?.error?.code ?? 'http_error', data?.error?.message ?? `Request failed (${r.status})`);
    return data as T;
  }, [getToken]);
}
