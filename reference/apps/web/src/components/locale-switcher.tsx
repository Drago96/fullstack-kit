'use client';

import { locales } from '@reference/messages';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function LocaleSwitcher() {
  const t = useTranslations('nav');
  // Locale-free pathname, so each link stays on the current page.
  const pathname = usePathname();

  return (
    <nav aria-label={t('language')} className="flex items-center gap-3 text-sm">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
