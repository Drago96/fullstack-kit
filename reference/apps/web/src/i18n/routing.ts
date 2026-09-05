import { defaultLocale, locales } from '@reference/messages';
import { defineRouting } from 'next-intl/routing';

// `localePrefix` defaults to 'always', so `/notes` redirects to `/en/notes`.
export const routing = defineRouting({ locales, defaultLocale });
