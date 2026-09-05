import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Next 16 calls this file `proxy.ts`; it was `middleware.ts` before.
export default createMiddleware(routing);

// Everything except the /api rewrite to Nest, Next internals and static files.
export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
