import type { Db } from '../db/client';
export type AppEnv = { Variables: { userId: string; db: Db } };
