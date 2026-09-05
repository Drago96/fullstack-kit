import bg from './bg.json';
import en from './en.json';

export const locales = ['en', 'bg'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Typed against `en`, so a key missing from a translation fails typecheck.
// ponytail: both locales ship in one bundle; split per locale when the files grow.
export const messages: Record<Locale, typeof en> = { en, bg };
