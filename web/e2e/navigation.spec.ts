import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test('nav buttons switch between pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ranking-table')).toBeVisible();

    await page.getByRole('button', { name: 'Build Explorer' }).click();
    await expect(page.getByTestId('ranking-table')).not.toBeVisible();

    await page.getByRole('button', { name: 'Rankings' }).click();
    await expect(page.getByTestId('ranking-table')).toBeVisible();
  });
});
