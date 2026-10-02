import { config } from 'dotenv';
import { createDb } from '../src/db/client';
import { migrateAndSeed } from '../src/migrate';

export default async function () {
  config({ path: '.env.test', quiet: true });
  const db = createDb(process.env.TEST_DATABASE_URL!);
  await migrateAndSeed(db);
  await db.$client.end();
}
