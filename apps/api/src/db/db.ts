import { join } from 'node:path';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

let instance: PostgresJsDatabase | undefined;

// main.ts connects with the validated URL. Importing this module reads no environment,
// so write-openapi.ts can load the controllers without a database configured.
export function connect(url: string) {
  instance = drizzle(postgres(url));
}

export function db() {
  if (!instance) throw new Error('connect() must run before the database is used');
  return instance;
}

// Resolved from dist/, so it works the same locally and in the container image.
export const applyMigrations = () =>
  migrate(db(), { migrationsFolder: join(__dirname, '../../drizzle') });
