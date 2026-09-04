import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
