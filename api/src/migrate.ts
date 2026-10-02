import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'node:url';
import { createDb, type Db } from './db/client';
import { seed } from './seed';

export async function migrateAndSeed(db: Db) {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  await seed(db);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = createDb(process.env.DATABASE_URL!);
  await migrateAndSeed(db);
  await db.$client.end();
  console.log('migrated + seeded');
}
