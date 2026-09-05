'use client';

import { locales } from '@reference/messages';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function LocaleSwitcher() {
  const t = useTranslations('nav');
  // Locale-free pathname, so each link stays on the current page.
  const pathname = usePathname();

  return (
    <nav aria-label={t('language')}>
      {locales.map((locale) => (
        <Link key={locale} href={pathname} locale={locale}>
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
