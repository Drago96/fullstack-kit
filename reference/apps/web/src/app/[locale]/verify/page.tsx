import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// Where the link in the verification email lands after Nest has marked the address
// verified. There is nothing left to do here but send the visitor on to log in.
export default async function VerifyPage() {
  const t = await getTranslations('auth');
  return (
    <main>
      <h1>{t('verified')}</h1>
      <p>
        <Link href="/login">{t('logIn')}</Link>
      </p>
    </main>
  );
}
