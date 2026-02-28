import { test, expect } from '@playwright/test';
import { encodeProposalHash, BRANDISH_BUFF } from './fixtures.js';

test.describe('url sharing', () => {
  test('navigating to /#p=<valid hash> auto-loads proposal and shows results', async ({ page }) => {
    const hash = encodeProposalHash(BRANDISH_BUFF);
    await page.goto('/' + hash);

    // Should auto-switch to proposal page and show results
    await expect(page.getByTestId('delta-table')).toBeVisible();
    // Proposal name should be loaded
    await expect(page.locator('input[placeholder="e.g. Brandish Buff"]')).toHaveValue('Brandish +20');
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
