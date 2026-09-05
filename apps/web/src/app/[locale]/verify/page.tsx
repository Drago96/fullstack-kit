import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

// Where the link in the verification email lands after Nest has marked the address
// verified. There is nothing left to do here but send the visitor on to log in.
export default async function VerifyPage() {
  const t = await getTranslations('auth');
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('verified')}</h1>
      <p>
        <Button asChild>
          <Link href="/login">{t('logIn')}</Link>
        </Button>
      </p>
    </main>
  );
}
