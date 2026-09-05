'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type Credentials, credentialsSchema } from '@reference/contract';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/auth-client';
import { useErrorCodes } from '@/i18n/error-codes';
import { Link, useRouter } from '@/i18n/navigation';

export default function LogInPage() {
  const t = useTranslations('auth');
  const translate = useErrorCodes();
  const router = useRouter();
  const [failure, setFailure] = useState<string>();
  const { register, handleSubmit, formState } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (credentials) => {
    const { error } = await authClient.signIn.email(credentials);
    // Better Auth answers 403 while the address is still unverified.
    if (error) {
      setFailure(error.status === 403 ? 'auth.notVerified' : 'auth.signInFailed');
      return;
    }
    router.push('/notes');
    router.refresh();
  });

  return (
    <main>
      <h1>{t('logIn')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="email">{t('email')}</label>
          <input id="email" type="email" {...register('email')} />
          {formState.errors.email ? (
            <span role="alert">{translate(formState.errors.email.message)}</span>
          ) : null}
        </p>
        <p>
          <label htmlFor="password">{t('password')}</label>
          <input id="password" type="password" {...register('password')} />
          {formState.errors.password ? (
            <span role="alert">{translate(formState.errors.password.message)}</span>
          ) : null}
        </p>
        <button type="submit" disabled={formState.isSubmitting}>
          {t('logIn')}
        </button>
      </form>
      {failure ? <p role="alert">{translate(failure)}</p> : null}
      <p>
        <Link href="/reset-password">{t('forgotPassword')}</Link>
      </p>
    </main>
  );
}
