import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export const createDb = (url: string) => drizzle(postgres(url, { max: 10, onnotice: () => {} }), { schema });
export type Db = ReturnType<typeof createDb>;
