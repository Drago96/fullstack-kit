import { z } from 'zod';

// The 400 body nestjs-zod's ZodValidationException returns. Each issue's `message` is the
// stable error code declared on the schema check, which the web app translates.
export const validationFailureSchema = z.object({
  statusCode: z.literal(400),
  message: z.string(),
  errors: z.array(z.object({ message: z.string() })),
});
