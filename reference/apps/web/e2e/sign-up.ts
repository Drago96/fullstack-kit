import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const apiUrl = 'http://localhost:3001';

const password = 'password123';

// Unique per call, so the tests can run in parallel against one database.
export const anEmail = () =>
  `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

type CapturedEmail = { to: string; subject: string; url: string };

// GET /debug/emails is what the API's capture transport records instead of sending.
async function verificationLink(request: APIRequestContext, email: string) {
  const captured: CapturedEmail[] = await (await request.get(`${apiUrl}/debug/emails`)).json();
  const link = captured
    .filter((message) => message.to === email && message.subject === 'Verify your email')
    .at(-1);
  if (!link) throw new Error(`No verification message was captured for ${email}`);
  return link.url;
}

export async function signUp(page: Page, request: APIRequestContext, email: string) {
  await page.goto('/en/signup');
  await page.getByLabel('Name').fill('Test User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

  await page.goto(await verificationLink(request, email));
  await expect(page.getByRole('heading', { name: 'Your email is verified' })).toBeVisible();
}

export async function logIn(page: Page, email: string) {
  await page.goto('/en/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/en/notes');
}

// Sign up, follow the verification link, log in: a browser holding a session.
export async function signedIn(page: Page, request: APIRequestContext) {
  const email = anEmail();
  await signUp(page, request, email);
  await logIn(page, email);
  return email;
}
