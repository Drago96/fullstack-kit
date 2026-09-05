'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type Credentials, credentialsSchema } from '@reference/contract';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authClient } from '@/auth-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('logIn')}</h1>
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
              {t('logIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
      {failure ? (
        <Alert variant="destructive">
          <AlertDescription>{translate(failure)}</AlertDescription>
        </Alert>
      ) : null}
      <p className="text-sm">
        <Link href="/reset-password" className="underline underline-offset-4">
          {t('forgotPassword')}
        </Link>
      </p>
    </main>
  );
}
