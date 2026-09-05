import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { apiUrl, lastEmail, password, post, signedInUser, signIn, signUp, verify } from './sign-in';

const sql = postgres(inject('databaseUrl'), { max: 1 });

beforeEach(async () => {
  await sql`truncate table notes, "user", session, account, verification cascade`;
});

afterAll(async () => {
  await sql.end();
});

const makeAdmin = (email: string) => sql`update "user" set role = 'admin' where email = ${email}`;

describe('sign-up and email verification', () => {
  it('emails a verification link that the visitor must follow before signing in', async () => {
    const email = 'new@example.com';
    expect((await signUp(email)).ok).toBe(true);

    const sent = await lastEmail(email, 'Verify your email');
    expect(sent.url).toContain(apiUrl);

    // requireEmailVerification: the account exists but cannot sign in yet.
    expect((await post('/auth/sign-in/email', { email, password })).ok).toBe(false);

    await verify(email);
    expect((await post('/auth/sign-in/email', { email, password })).ok).toBe(true);
  });
});

describe('password reset', () => {
  it('emails a reset link whose token sets a new password', async () => {
    const email = 'forgetful@example.com';
    await signedInUser(email);

    expect(
      (await post('/auth/request-password-reset', { email, redirectTo: 'http://localhost:3000' }))
        .ok,
    ).toBe(true);
    const { url } = await lastEmail(email, 'Reset your password');
    // The link redirects the browser to the web app with the token on the query string.
    const redirect = await fetch(url, { redirect: 'manual' });
    const token = new URL(redirect.headers.get('location') ?? url).searchParams.get('token');
    expect(token).toBeTruthy();

    const newPassword = 'a-brand-new-password';
    expect((await post('/auth/reset-password', { newPassword, token })).ok).toBe(true);

    expect((await post('/auth/sign-in/email', { email, password })).ok).toBe(false);
    expect((await post('/auth/sign-in/email', { email, password: newPassword })).ok).toBe(true);
  });
});

describe('GET /admin/users', () => {
  const get = (cookie: string) => fetch(`${apiUrl}/admin/users`, { headers: { cookie } });

  it('answers 403 for a signed-in user without the admin role', async () => {
    const res = await get(await signedInUser('plain@example.com'));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ statusCode: 403, message: 'auth.forbidden' });
  });

  it('answers 401 with no session at all', async () => {
    const res = await fetch(`${apiUrl}/admin/users`);
    expect(res.status).toBe(401);
  });

  it('lists every user for an admin', async () => {
    const email = 'boss@example.com';
    await signedInUser(email);
    await makeAdmin(email);
    // The role lands on the session, so it needs a fresh sign-in.
    const res = await get(await signIn(email));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: expect.any(String), email, role: 'admin' }]);
  });
});
