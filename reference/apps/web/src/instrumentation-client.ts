import * as Sentry from '@sentry/nextjs';
import { publicEnv } from '@/env.public';

const dsn = publicEnv.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) Sentry.init({ dsn });

// Ties client-side navigations to the errors raised during them.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
