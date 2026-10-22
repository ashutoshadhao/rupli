// pure sync rules (no react-native imports, so they are unit-tested)
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

// captive Wi-Fi / mobile data with no internet counts as offline, so writes pause instead of failing
export const isOnline = (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) =>
  !!s.isConnected && s.isInternetReachable !== false;

// network errors and 5xx retry until they land; a 4xx will never succeed, so drop it and free the queue
export const shouldRetryWrite = (_failures: number, e: unknown) => !(e instanceof ApiError) || e.status >= 500;

// every write: one serial queue, parked (and persisted) while offline
export const WRITE_OPTIONS = {
  mutationKey: ['api'],
  scope: { id: 'api' },
  networkMode: 'online',
  retry: shouldRetryWrite,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
} as const;
