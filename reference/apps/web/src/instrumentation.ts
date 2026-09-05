import * as Sentry from '@sentry/nextjs';
import { publicEnv } from '@/env.public';

// Next calls this once per server runtime before anything else is loaded.
export function register() {
  const dsn = publicEnv.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) Sentry.init({ dsn });
}

// Reports errors thrown while rendering on the server.
export const onRequestError = Sentry.captureRequestError;
