import { z } from 'zod';

// Next inlines only NEXT_PUBLIC_* variables into the browser bundle, so the browser
// cannot parse the server schema in src/env.ts. Variables both runtimes read live here.
const envSchema = z.object({
  // Absent means Sentry stays disabled, which is what local runs and CI want.
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});
if (!parsed.success) {
  throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
}

export const publicEnv = parsed.data;
