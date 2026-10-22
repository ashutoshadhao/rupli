import { it, expect } from 'vitest';
import { MutationCache, QueryClient, onlineManager } from '@tanstack/query-core';
import { ApiError, WRITE_OPTIONS, isOnline, shouldRetryWrite } from '../src/logic/sync';

it('online only when connected AND the internet is reachable', () => {
  expect(isOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
  expect(isOnline({ isConnected: true, isInternetReachable: null })).toBe(true); // unknown yet
  expect(isOnline({ isConnected: true, isInternetReachable: false })).toBe(false); // captive wifi / no data
  expect(isOnline({ isConnected: false, isInternetReachable: null })).toBe(false);
});

it('writes retry network/5xx errors forever but never 4xx', () => {
  expect(shouldRetryWrite(10, new TypeError('Network request failed'))).toBe(true);
  expect(shouldRetryWrite(10, new ApiError(503, 'x', 'down'))).toBe(true);
  expect(shouldRetryWrite(0, new ApiError(409, 'trip_finished', 'done'))).toBe(false);
  expect(shouldRetryWrite(0, new ApiError(404, 'not_found', 'gone'))).toBe(false);
});

it('scoped writes queued offline replay one at a time, in order, finish last', async () => {
  onlineManager.setOnline(false);
  const qc = new QueryClient({ mutationCache: new MutationCache() });
  const log: string[] = [];
  const fn = async (name: string) => { log.push(`start ${name}`); await new Promise(r => setTimeout(r, 5)); log.push(`end ${name}`); };
  const run = (name: string) => qc.getMutationCache().build(qc, { ...WRITE_OPTIONS, mutationKey: [...WRITE_OPTIONS.mutationKey], mutationFn: () => fn(name) }).execute(undefined);
  const done = Promise.all([run('add A'), run('add B'), run('finish')]);
  await new Promise(r => setTimeout(r, 20));
  expect(log).toEqual([]);           // nothing ran while offline
  onlineManager.setOnline(true);
  await qc.resumePausedMutations();
  await done;
  expect(log).toEqual(['start add A', 'end add A', 'start add B', 'end add B', 'start finish', 'end finish']);
});
