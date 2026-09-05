'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type SignUp, signUpSchema } from '@reference/contract';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/auth-client';
import { useErrorCodes } from '@/i18n/error-codes';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const translate = useErrorCodes();
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<string>();
  const { register, handleSubmit, formState } = useForm<SignUp>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    const { error } = await authClient.signUp.email({
      ...values,
      // Where the link in the verification email drops the visitor afterwards.
      callbackURL: `${window.location.origin}/${locale}/verify`,
    });
    setFailure(error ? 'auth.signUpFailed' : undefined);
    setSent(!error);
  });

  if (sent) {
    return (
      <main>
        <h1>{t('checkEmail')}</h1>
        <p>{t('checkEmailBody')}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{t('signUp')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="name">{t('name')}</label>
          <input id="name" {...register('name')} />
          {formState.errors.name ? (
            <span role="alert">{translate(formState.errors.name.message)}</span>
          ) : null}
        </p>
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
          {t('signUp')}
        </button>
      </form>
      {failure ? <p role="alert">{translate(failure)}</p> : null}
    </main>
  );
}
