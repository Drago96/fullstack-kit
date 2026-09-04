'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createApiClient } from '@reference/api-client';
import { type CreateNote, createNoteSchema } from '@reference/contract';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import createQueryHooks from 'openapi-react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

// '/api' is the same-origin proxy declared in next.config.ts.
const api = createQueryHooks(createApiClient('/api'));
const noteListKey = ['get', '/notes'];

export default function NotesPage() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <Notes />
    </QueryClientProvider>
  );
}

function Notes() {
  const queryClient = useQueryClient();
  const notes = api.useQuery('get', '/notes');
  const createNote = api.useMutation('post', '/notes', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteListKey }),
  });
  const { register, handleSubmit, reset, formState } = useForm<CreateNote>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { title: '', body: '' },
  });

  const submit = handleSubmit(async (note) => {
    await createNote.mutateAsync({ body: note });
    reset();
  });

  return (
    <main>
      <h1>Notes</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="title">Title</label>
          <input id="title" {...register('title')} />
          {formState.errors.title ? (
            <span role="alert">{formState.errors.title.message}</span>
          ) : null}
        </p>
        <p>
          <label htmlFor="body">Body</label>
          <textarea id="body" {...register('body')} />
        </p>
        <button type="submit" disabled={formState.isSubmitting}>
          Add note
        </button>
      </form>
      <ul>
        {notes.data?.map((note) => (
          <li key={note.id}>
            <strong>{note.title}</strong> {note.body}
          </li>
        ))}
      </ul>
    </main>
  );
}
