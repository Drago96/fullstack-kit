import { z } from 'zod';

// Validation messages are stable error codes, not prose: both the API's 400 body and the
// form resolver surface them, and the web app translates them under `errors.<code>`.
export const createNoteSchema = z.object({
  title: z.string().min(1, 'note.title.required').max(200, 'note.title.tooLong'),
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
