import { defaultLocale, locales, messages } from '@reference/messages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getLocales } from 'expo-localization';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { hasLocale, IntlProvider } from 'use-intl';

// `use-intl` is next-intl's framework-agnostic core, so the screens call the same
// `useTranslations` against the same ICU messages the web app uses. The device language
// cannot change while the process lives, so it is read once.
const device = getLocales()[0]?.languageCode;
const locale = hasLocale(locales, device) ? device : defaultLocale;

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </IntlProvider>
  );
}
