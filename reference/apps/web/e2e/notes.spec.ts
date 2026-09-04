import { expect, test } from '@playwright/test';

test('a visitor creates a note and sees it in the list', async ({ page }) => {
  const title = `Note ${Date.now()}`;
  await page.goto('/notes');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Body').fill('Written in the browser');
  await page.getByRole('button', { name: 'Add note' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: title })).toBeVisible();
});
