'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createApiClient } from '@reference/api-client';
import { type CreateNote, createNoteSchema } from '@reference/contract';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('notes');
  const tErrors = useTranslations('errors');
  const queryClient = useQueryClient();
  const notes = api.useQuery('get', '/notes');
  const createNote = api.useMutation('post', '/notes', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteListKey }),
  });
  const { register, handleSubmit, reset, formState } = useForm<CreateNote>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { title: '', body: '' },
  });

  // Both the resolver and the API's 400 report the Contract's error codes.
  const translateCode = (code: string | undefined) =>
    code !== undefined && tErrors.has(code) ? tErrors(code) : tErrors('unknown');

  const submit = handleSubmit((note) => {
    createNote.mutate({ body: note }, { onSuccess: () => reset() });
  });

  return (
    <main>
      <h1>{t('heading')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="title">{t('title')}</label>
          <input id="title" {...register('title')} />
          {formState.errors.title ? (
            <span role="alert">{translateCode(formState.errors.title.message)}</span>
          ) : null}
        </p>
        <p>
          <label htmlFor="body">{t('body')}</label>
          <textarea id="body" {...register('body')} />
        </p>
        <button type="submit" disabled={createNote.isPending}>
          {t('add')}
        </button>
      </form>
      {createNote.error ? (
        <p role="alert">{translateCode(createNote.error.errors[0]?.message)}</p>
      ) : null}
      <p>{t('count', { count: notes.data?.length ?? 0 })}</p>
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
