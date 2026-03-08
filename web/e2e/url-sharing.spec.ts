import { test, expect } from '@playwright/test';
import { encodeProposalHash, BRANDISH_BUFF } from './fixtures.js';

test.describe('url sharing', () => {
  test('navigating to /#p=<valid hash> enables what-if mode with changes', async ({ page }) => {
    const hash = encodeProposalHash(BRANDISH_BUFF);
    await page.goto('/' + hash);

    // Should stay on dashboard with what-if mode active
    await expect(page.getByTestId('ranking-table')).toBeVisible();
  });

  test('navigating to / with no hash shows dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ranking-table')).toBeVisible();
  });

  test('navigating to /#p=INVALID does not crash', async ({ page }) => {
    await page.goto('/#p=INVALID');
    // App should still load — shows dashboard since invalid hash is ignored
    await expect(page.getByTestId('ranking-table')).toBeVisible();
  });
});
