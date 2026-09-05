import * as Sentry from '@sentry/nestjs';
import { env } from './env';

// main.ts imports this before anything else so Sentry can instrument the libraries it
// wraps (http, postgres) as they load. Without a DSN there is nowhere to report, so the
// SDK is left uninitialised rather than started and disabled.
const dsn = env().SENTRY_DSN;
if (dsn) Sentry.init({ dsn });
