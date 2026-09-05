import { expect, test } from '@playwright/test';

test('home page renders the greeting served by the API', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello, World!');
  await expect(page.getByText('This greeting comes from the API.')).toBeVisible();
});
