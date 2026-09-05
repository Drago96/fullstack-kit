'use client';

import { useTranslations } from 'next-intl';
import { authClient } from '@/auth-client';
import { Link, useRouter } from '@/i18n/navigation';

export function AuthNav() {
  const t = useTranslations('nav');
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Nothing is rendered until the cookie has been resolved, so the nav never flickers
  // from signed-out to signed-in.
  if (isPending) return null;

  return (
    <nav aria-label={t('account')}>
      {session ? (
        <>
          <span>{session.user.email}</span>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              router.push('/login');
              router.refresh();
            }}
          >
            {t('signOut')}
          </button>
        </>
      ) : (
        <>
          <Link href="/login">{t('logIn')}</Link>
          <Link href="/signup">{t('signUp')}</Link>
        </>
      )}
    </nav>
  );
}
