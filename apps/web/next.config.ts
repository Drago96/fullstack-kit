import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
// Fails `next build` and `next start` when a required variable is missing.
import { env } from './src/env';

const nextConfig: NextConfig = {
  // Client components reach the API same-origin through this proxy, so API_URL stays
  // server-side and no CORS configuration is needed.
  rewrites: async () => [{ source: '/api/:path*', destination: `${env.API_URL}/:path*` }],
};

// Wires src/i18n/request.ts into every server render.
export default createNextIntlPlugin()(nextConfig);
