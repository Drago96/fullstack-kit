import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
// Fails `next build` and `next start` when a required variable is missing.
import { env } from './src/env';

const nextConfig: NextConfig = {
  // Client components reach the API same-origin through this proxy, so API_URL stays
  // server-side and no CORS configuration is needed.
  rewrites: async () => [{ source: '/api/:path*', destination: `${env.API_URL}/:path*` }],
};

// Wires src/i18n/request.ts into every server render, then the Sentry SDK around it.
// Uploading source maps additionally needs SENTRY_AUTH_TOKEN, org and project; without
// them the plugin skips that step, so the build works unchanged in CI and for anyone
// without a Sentry account.
export default withSentryConfig(createNextIntlPlugin()(nextConfig), { silent: true });
