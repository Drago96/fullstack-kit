import { createAuthClient } from 'better-auth/react';

// Next is a pure client: the session lives in a cookie Nest sets, and every call here
// goes to Better Auth running inside Nest. `/api/auth` is same-origin thanks to the
// rewrite in next.config.ts, so the cookie stays first-party and no CORS is involved.
export const authClient = createAuthClient({ basePath: '/api/auth' });
