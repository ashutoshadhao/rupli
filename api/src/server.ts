import { serve } from '@hono/node-server';
import { createDb } from './db/client';
import { createApp } from './app';
import { clerkVerify } from './lib/auth';

const must = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} missing`);
  return v;
};

const app = createApp({ db: createDb(must('DATABASE_URL')), verify: clerkVerify(must('CLERK_SECRET_KEY')) });
serve({ fetch: app.fetch, hostname: '127.0.0.1', port: Number(process.env.PORT ?? 8787) }, i => console.log(`rupli-api :${i.port}`));
