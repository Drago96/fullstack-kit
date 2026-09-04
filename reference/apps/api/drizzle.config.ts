import { defineConfig } from 'drizzle-kit';

// Only `drizzle-kit generate` uses this; migrations are applied by the API at startup.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
