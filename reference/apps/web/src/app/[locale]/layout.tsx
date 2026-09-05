import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { AuthNav } from '@/components/auth-nav';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { routing } from '@/i18n/routing';
// Tailwind's single entry point: every utility class in the app comes from here.
import '../globals.css';

type LocaleParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  return { title: t('title') };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleParams & { children: ReactNode }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <header className="border-b">
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-6 py-3">
              <LocaleSwitcher />
              <AuthNav />
            </div>
          </header>
          {/* Every page renders its own <main> inside this column, so the width, gutter
              and rhythm are set once here rather than repeated per page. */}
          <div className="mx-auto w-full max-w-2xl px-6 py-10">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
