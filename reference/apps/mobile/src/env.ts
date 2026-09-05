import { z } from 'zod';

// Expo inlines EXPO_PUBLIC_* variables at build time, and only where they are written out
// in full, so the schema is fed the literal reads rather than `process.env`.
const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
if (!parsed.success) {
  throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
