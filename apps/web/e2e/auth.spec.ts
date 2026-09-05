import { expect, test } from '@playwright/test';
import { anEmail, logIn, signedIn, signUp } from './sign-up';

test('a visitor signs up, verifies, logs in and keeps their notes to themselves', async ({
  page,
  request,
  browser,
}) => {
  const email = anEmail();
  await signUp(page, request, email);
  await logIn(page, email);

  const title = `Private note ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Body').fill('Only mine');
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: title })).toBeVisible();

  // A second visitor, in a browser of their own, sees an empty list.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signedIn(otherPage, request);
  await expect(otherPage.getByText('No notes yet')).toBeVisible();
  await expect(otherPage.getByRole('listitem').filter({ hasText: title })).toHaveCount(0);
  await other.close();
});

test('an unverified account cannot log in yet', async ({ page }) => {
  const email = anEmail();
  await page.goto('/en/signup');
  await page.getByLabel('Name').fill('Unverified');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

  await page.goto('/en/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Verify your email address first',
  );
});

test('a signed-out visitor is asked to log in before seeing notes', async ({ page }) => {
  await page.goto('/en/notes');
  await expect(page.getByRole('link', { name: 'Log in to see your notes' })).toBeVisible();
});
