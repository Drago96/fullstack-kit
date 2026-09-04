import { z } from 'zod';

export const helloQuerySchema = z.object({
  name: z.string().min(1).max(50).default('World'),
});

export const helloResponseSchema = z.object({
  message: z.string(),
});

export type HelloQuery = z.infer<typeof helloQuerySchema>;
export type HelloResponse = z.infer<typeof helloResponseSchema>;
