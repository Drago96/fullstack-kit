import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from '../db/db';
import * as schema from '../db/schema';
import { sendEmail } from '../email/email';
import { env } from '../env';

function createAuth() {
  const { API_URL, WEB_URL, MOBILE_URL, AUTH_SECRET } = env();
  return betterAuth({
    baseURL: API_URL,
    // The web app proxies /api/* to this API, so the browser reaches these routes
    // same-origin at /api/auth/* and the session cookie stays first-party.
    basePath: '/auth',
    secret: AUTH_SECRET,
    // MOBILE_URL is the app's deep-link scheme, and is unset in a Project without mobile.
    trustedOrigins: MOBILE_URL ? [WEB_URL, MOBILE_URL] : [WEB_URL],
    database: drizzleAdapter(db(), { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: ({ user, url }) =>
        sendEmail({ to: user.email, subject: 'Reset your password', url }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: ({ user, url }) =>
        sendEmail({ to: user.email, subject: 'Verify your email', url }),
    },
    // admin() gives every user a `role`, which src/auth/session.ts turns into a Nest guard.
    // expo() promotes the `expo-origin` header the mobile client sends to `origin`, because
    // a device sends none of its own and the origin check would otherwise refuse it.
    plugins: [admin(), expo()],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

// Built on first use rather than on import, so it reads the environment and the database
// only after main.ts has validated and connected them, and write-openapi.ts can load the
// controllers with neither.
export function auth() {
  if (!instance) instance = createAuth();
  return instance;
}

export type SessionData = NonNullable<
  Awaited<ReturnType<ReturnType<typeof createAuth>['api']['getSession']>>
>;

export type SessionUser = SessionData['user'];
