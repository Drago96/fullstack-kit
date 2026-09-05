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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('checkEmail')}</h1>
        <p className="text-muted-foreground">{t('resetLinkSent')}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('forgotPassword')}</h1>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" {...register('email')} />
              {formState.errors.email ? (
                <span role="alert" className="block text-sm text-destructive">
                  {translate(formState.errors.email.message)}
                </span>
              ) : null}
            </div>
            <Button type="submit" disabled={formState.isSubmitting}>
              {t('sendResetLink')}
            </Button>
          </form>
        </CardContent>
      </Card>
      {failure ? (
        <Alert variant="destructive">
          <AlertDescription>{translate(failure)}</AlertDescription>
        </Alert>
      ) : null}
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
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('setNewPassword')}</h1>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword')}</Label>
              <Input id="password" type="password" {...register('password')} />
              {formState.errors.password ? (
                <span role="alert" className="block text-sm text-destructive">
                  {translate(formState.errors.password.message)}
                </span>
              ) : null}
            </div>
            <Button type="submit" disabled={formState.isSubmitting}>
              {t('setNewPassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
      {failure ? (
        <Alert variant="destructive">
          <AlertDescription>{translate(failure)}</AlertDescription>
        </Alert>
      ) : null}
    </main>
  );
}
