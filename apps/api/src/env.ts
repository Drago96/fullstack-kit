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
    // Public base URL of this API. Better Auth builds the links it emails with it.
    API_URL: z.url(),
    // Public base URL of the web app: the trusted origin for auth requests, and where
    // the links in verification and password-reset emails send the visitor back to.
    WEB_URL: z.url(),
    // Signs sessions and verification tokens. Rotating it logs everyone out.
    AUTH_SECRET: z.string().min(32),
    // capture keeps messages in memory for the tests to read instead of sending them.
    EMAIL_TRANSPORT: z.enum(['resend', 'capture']).default('resend'),
    EMAIL_FROM: z.string().min(1).default('Reference <onboarding@resend.dev>'),
    RESEND_API_KEY: z.string().min(1).optional(),
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
    if (values.EMAIL_TRANSPORT === 'resend' && !values.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when EMAIL_TRANSPORT is resend',
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
