import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive(),
    DATABASE_URL: z.string().min(1),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('info'),
    // Absent means Sentry stays disabled, which is what local runs and CI want.
    SENTRY_DSN: z.url().optional(),
    LLM_PROVIDER: z.enum(['google', 'mock']).default('google'),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  })
  // A real provider without its key must fail boot, not the first request.
  .superRefine((values, ctx) => {
    if (values.LLM_PROVIDER === 'google' && !values.GOOGLE_GENERATIVE_AI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_GENERATIVE_AI_API_KEY'],
        message: 'GOOGLE_GENERATIVE_AI_API_KEY is required when LLM_PROVIDER is google',
      });
    }
  });

let cached: z.infer<typeof envSchema> | undefined;

// Validated on first read rather than on import: main.ts reads it before it listens, so
// a missing variable still fails boot, while write-openapi.ts can load the same module
// graph with no environment at all.
export function env() {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
      process.exit(1);
    }
    cached = parsed.data;
  }
  return cached;
}
