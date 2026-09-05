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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <main className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t('heading')}</h1>
        <p>
          <Button asChild>
            <Link href="/login">{t('signInToSee')}</Link>
          </Button>
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
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t('heading')}</h1>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('title')}</Label>
              <Input id="title" {...register('title')} />
              {formState.errors.title ? (
                <span role="alert" className="block text-sm text-destructive">
                  {translate(formState.errors.title.message)}
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">{t('body')}</Label>
              {/* The five primitives shadcn/ui is initialised with do not include a
                  textarea, so this one borrows the Input's border, ring and typography. */}
              <textarea
                id="body"
                {...register('body')}
                className="min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              />
            </div>
            <Button type="submit" disabled={createNote.isPending}>
              {t('add')}
            </Button>
          </form>
        </CardContent>
      </Card>
      {createNote.error ? (
        <Alert variant="destructive">
          <AlertDescription>{translate(failureCode(createNote.error))}</AlertDescription>
        </Alert>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {t('count', { count: notes.data?.length ?? 0 })}
      </p>
      <ul className="space-y-3">
        {notes.data?.map((note) => (
          <li key={note.id}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
                <CardDescription>{note.body}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
