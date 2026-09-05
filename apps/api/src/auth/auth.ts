import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from '../db/db';
import * as schema from '../db/schema';
import { sendEmail } from '../email/email';
import { env } from '../env';

function createAuth() {
  const { API_URL, WEB_URL, AUTH_SECRET } = env();
  return betterAuth({
    baseURL: API_URL,
    // The web app proxies /api/* to this API, so the browser reaches these routes
    // same-origin at /api/auth/* and the session cookie stays first-party.
    basePath: '/auth',
    secret: AUTH_SECRET,
    trustedOrigins: [WEB_URL],
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
    // Gives every user a `role`, which src/auth/session.ts turns into a Nest guard.
    plugins: [admin()],
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
