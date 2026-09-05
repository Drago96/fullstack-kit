'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  type NewPassword,
  newPasswordSchema,
  type ResetRequest,
  resetRequestSchema,
} from '@reference/contract';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/auth-client';
import { useErrorCodes } from '@/i18n/error-codes';
import { useRouter } from '@/i18n/navigation';

export function ResetPasswordForm({ token }: { token: string | null }) {
  return token === null ? <RequestLink /> : <SetPassword token={token} />;
}

function RequestLink() {
  const t = useTranslations('auth');
  const translate = useErrorCodes();
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<string>();
  const { register, handleSubmit, formState } = useForm<ResetRequest>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    setFailure(error ? 'auth.resetFailed' : undefined);
    setSent(!error);
  });

  if (sent) {
    return (
      <main>
        <h1>{t('checkEmail')}</h1>
        <p>{t('resetLinkSent')}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{t('forgotPassword')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="email">{t('email')}</label>
          <input id="email" type="email" {...register('email')} />
          {formState.errors.email ? (
            <span role="alert">{translate(formState.errors.email.message)}</span>
          ) : null}
        </p>
        <button type="submit" disabled={formState.isSubmitting}>
          {t('sendResetLink')}
        </button>
      </form>
      {failure ? <p role="alert">{translate(failure)}</p> : null}
    </main>
  );
}

function SetPassword({ token }: { token: string }) {
  const t = useTranslations('auth');
  const translate = useErrorCodes();
  const router = useRouter();
  const [failure, setFailure] = useState<string>();
  const { register, handleSubmit, formState } = useForm<NewPassword>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '' },
  });

  const submit = handleSubmit(async ({ password }) => {
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      setFailure('auth.resetFailed');
      return;
    }
    router.push('/login');
  });

  return (
    <main>
      <h1>{t('setNewPassword')}</h1>
      <form onSubmit={submit}>
        <p>
          <label htmlFor="password">{t('newPassword')}</label>
          <input id="password" type="password" {...register('password')} />
          {formState.errors.password ? (
            <span role="alert">{translate(formState.errors.password.message)}</span>
          ) : null}
        </p>
        <button type="submit" disabled={formState.isSubmitting}>
          {t('setNewPassword')}
        </button>
      </form>
      {failure ? <p role="alert">{translate(failure)}</p> : null}
    </main>
  );
}
