import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string(),
});

export type CreateNote = z.infer<typeof createNoteSchema>;

export const noteSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});

export const noteListSchema = z.array(noteSchema);
