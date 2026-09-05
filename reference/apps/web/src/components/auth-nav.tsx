'use client';

import { useTranslations } from 'next-intl';
import { authClient } from '@/auth-client';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';

export function AuthNav() {
  const t = useTranslations('nav');
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Nothing is rendered until the cookie has been resolved, so the nav never flickers
  // from signed-out to signed-in.
  if (isPending) return null;

  return (
    <nav aria-label={t('account')} className="flex items-center gap-2 text-sm">
      {session ? (
        <>
          <span className="text-muted-foreground">{session.user.email}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await authClient.signOut();
              router.push('/login');
              router.refresh();
            }}
          >
            {t('signOut')}
          </Button>
        </>
      ) : (
        <>
          {/* asChild keeps these anchors: styled like buttons, still role="link". */}
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t('logIn')}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">{t('signUp')}</Link>
          </Button>
        </>
      )}
    </nav>
  );
}
