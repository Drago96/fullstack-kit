'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createApiClient } from '@reference/api-client';
import { type CreateNote, createNoteSchema } from '@reference/contract';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import createQueryHooks from 'openapi-react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/auth-client';
import { failureCode, useErrorCodes } from '@/i18n/error-codes';
import { Link } from '@/i18n/navigation';

// '/api' is the same-origin proxy declared in next.config.ts, so the session cookie
// travels with every request.
const api = createQueryHooks(createApiClient('/api'));
const noteListKey = ['get', '/notes'];

export default function NotesPage() {
  const [queryClient] = useState(() => new QueryClient());
  const t = useTranslations('notes');
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  // Notes belong to their owner, so there is nothing to show a visitor without a session.
  if (!session) {
    return (
      <main>
        <h1>{t('heading')}</h1>
        <p>
          <Link href="/login">{t('signInToSee')}</Link>
        </p>
      </main>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Notes />
    </QueryClientProvider>
  );
}

function Notes() {
  const t = useTranslations('notes');
  const translate = useErrorCodes();
  const queryClient = useQueryClient();
  const notes = api.useQuery('get', '/notes');
  const createNote = api.useMutation('post', '/notes', {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteListKey }),
  });
  const { register, handleSubmit, reset, formState } = useForm<CreateNote>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { title: '', body: '' },
  });

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
            <span role="alert">{translate(formState.errors.title.message)}</span>
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
      {createNote.error ? <p role="alert">{translate(failureCode(createNote.error))}</p> : null}
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
