import { z } from 'zod';

export const askSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

export const answerSchema = z.object({
  answer: z.string(),
});
