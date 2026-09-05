import { expect, test } from '@playwright/test';

test('an unprefixed path lands on the default locale', async ({ page }) => {
  await page.goto('/notes');
  await expect(page).toHaveURL('/en/notes');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notes');
});

test('the switcher translates the page, headings and validation errors included', async ({
  page,
}) => {
  await page.goto('/en/notes');
  await page.getByRole('link', { name: 'Български' }).click();

  await expect(page).toHaveURL('/bg/notes');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бележки');

  // The empty title fails the Contract schema; its `note.title.required` code is translated.
  await page.getByRole('button', { name: 'Добави бележка' }).click();
  // Scoped to <main>: Next's route announcer is a role="alert" of its own.
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Заглавието е задължително');
});
