import { Hono } from 'hono';
import type { Db } from './db/client';
import type { AppEnv } from './lib/env';
import { auth, type Verify } from './lib/auth';
import { onError } from './lib/http';
import { productRoutes } from './routes/products';
import { categoryRoutes } from './routes/categories';
import { listRoutes } from './routes/lists';
import { tripRoutes } from './routes/trips';
import { transactionRoutes } from './routes/transactions';
import { spendRoutes } from './routes/spend';

export function createApp({ db, verify }: { db: Db; verify: Verify }) {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(c => c.json({ error: { code: 'not_found', message: 'Not found' } }, 404));
  app.get('/health', c => c.json({ ok: true }));
  app.use('*', async (c, next) => { c.set('db', db); await next(); });
  app.use('/v1/*', auth(verify));
  app.route('/v1/products', productRoutes);
  app.route('/v1/categories', categoryRoutes);
  app.route('/v1/lists', listRoutes);
  app.route('/v1/trips', tripRoutes);
  app.route('/v1/transactions', transactionRoutes);
  app.route('/v1/spend', spendRoutes);
  return app;
}
