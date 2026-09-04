import type { NextConfig } from 'next';
// Fails `next build` and `next start` when a required variable is missing.
import './src/env';

const nextConfig: NextConfig = {};

export default nextConfig;
