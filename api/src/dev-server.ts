// LOCAL end-to-end testing only — never deployed (systemd runs server.ts).
// Accepts the single token "dev" as user "user_dev" and allows browser (CORS) calls from the web preview.
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db/client';
import { createApp } from './app';
import { migrateAndSeed } from './migrate';

const url = process.env.E2E_DATABASE_URL;
if (!url || !url.includes('rupli_e2e')) throw new Error('E2E_DATABASE_URL must point at the rupli_e2e database');
const db = createDb(url);
await migrateAndSeed(db);
const app = new Hono();
app.use('*', cors({ origin: o => (/^http:\/\/localhost:\d+$/.test(o) ? o : null) }));
app.route('/', createApp({ db, verify: async t => (t === 'dev' ? 'user_dev' : null) }));
serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 8788 }, i => console.log(`rupli e2e api :${i.port}`));
