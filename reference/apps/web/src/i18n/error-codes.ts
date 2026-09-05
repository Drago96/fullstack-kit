'use client';

import { authFailureSchema, validationFailureSchema } from '@reference/contract';
import { useTranslations } from 'next-intl';

// The Contract's resolvers, the API's failure bodies and the auth pages all report stable
// error codes rather than prose; this turns one into the message for the current locale.
export function useErrorCodes() {
  const t = useTranslations('errors');
  return (code: string | undefined) => (code !== undefined && t.has(code) ? t(code) : t('unknown'));
}

// An error body off the typed client is a union of everything the endpoint documents, so
// the Contract schemas tell the 400 and the 401 apart and pull the code out of each.
export function failureCode(failure: unknown) {
  const validation = validationFailureSchema.safeParse(failure);
  if (validation.success) return validation.data.errors[0]?.message;
  const auth = authFailureSchema.safeParse(failure);
  return auth.success ? auth.data.message : undefined;
}
