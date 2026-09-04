import type { NextConfig } from 'next';
// Fails `next build` and `next start` when a required variable is missing.
import { env } from './src/env';

const nextConfig: NextConfig = {
  // Client components reach the API same-origin through this proxy, so API_URL stays
  // server-side and no CORS configuration is needed.
  rewrites: async () => [{ source: '/api/:path*', destination: `${env.API_URL}/:path*` }],
};

export default nextConfig;
