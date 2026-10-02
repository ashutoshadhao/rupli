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
