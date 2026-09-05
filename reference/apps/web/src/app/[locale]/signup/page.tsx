'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type SignUp, signUpSchema } from '@reference/contract';
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
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('checkEmail')}</h1>
        <p className="text-muted-foreground">{t('checkEmailBody')}</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('signUp')}</h1>
      <Card>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input id="name" {...register('name')} />
              {formState.errors.name ? (
                <span role="alert" className="block text-sm text-destructive">
                  {translate(formState.errors.name.message)}
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" {...register('email')} />
              {formState.errors.email ? (
                <span role="alert" className="block text-sm text-destructive">
                  {translate(formState.errors.email.message)}
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" type="password" {...register('password')} />
              {formState.errors.password ? (
                <span role="alert" className="block text-sm text-destructive">
                  {translate(formState.errors.password.message)}
                </span>
              ) : null}
            </div>
            <Button type="submit" disabled={formState.isSubmitting}>
              {t('signUp')}
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
