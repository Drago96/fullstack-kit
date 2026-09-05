import { expect, test } from '@playwright/test';
import { signedIn } from './sign-up';

test('a signed-in visitor creates a note and sees it in the list', async ({ page, request }) => {
  await signedIn(page, request);
  const title = `Note ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Body').fill('Written in the browser');
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: title })).toBeVisible();
});
