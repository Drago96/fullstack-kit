import { inject } from 'vitest';

const apiUrl = inject('apiUrl');

export const password = 'password123';

type CapturedEmail = { to: string; subject: string; url: string };

const capturedEmails = async (): Promise<CapturedEmail[]> => {
  const res = await fetch(`${apiUrl}/debug/emails`);
  if (!res.ok) throw new Error(`GET /debug/emails answered ${res.status}`);
  return res.json();
};

export async function lastEmail(to: string, subject: string) {
  const emails = await capturedEmails();
  const match = emails.filter((email) => email.to === to && email.subject === subject).at(-1);
  if (!match) throw new Error(`No "${subject}" message was captured for ${to}`);
  return match;
}

const post = (path: string, body: unknown, cookie?: string) =>
  fetch(`${apiUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });

// Better Auth answers with one or more Set-Cookie headers; the session cookie is the one
// the guarded routes need back.
const cookieFrom = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');

export const signUp = (email: string, name = 'Test User') =>
  post('/auth/sign-up/email', { email, password, name });

export async function verify(email: string) {
  const { url } = await lastEmail(email, 'Verify your email');
  const res = await fetch(url, { redirect: 'manual' });
  if (res.status >= 400) throw new Error(`Verification link answered ${res.status}`);
}

export async function signIn(email: string) {
  const res = await post('/auth/sign-in/email', { email, password });
  if (!res.ok) throw new Error(`Signing ${email} in answered ${res.status}`);
  return cookieFrom(res);
}

// Sign up, follow the verification link, sign in: the cookie a guarded route accepts.
export async function signedInUser(email: string) {
  const created = await signUp(email);
  if (!created.ok) throw new Error(`Signing ${email} up answered ${created.status}`);
  await verify(email);
  return signIn(email);
}

export { apiUrl, post };
