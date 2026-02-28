import { test, expect } from '@playwright/test';
import { navigateToProposalBuilder, navigateToDashboard } from './fixtures.js';

test.describe('navigation', () => {
  test('nav buttons switch between Rankings and Proposal Builder', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ranking-table')).toBeVisible();

    await navigateToProposalBuilder(page);
    await expect(page.getByText('Proposal Builder')).toBeVisible();
    await expect(page.getByTestId('ranking-table')).not.toBeVisible();

    await navigateToDashboard(page);
    await expect(page.getByTestId('ranking-table')).toBeVisible();
  });

  test('proposal state persists across page switches', async ({ page }) => {
    await page.goto('/');
    await navigateToProposalBuilder(page);

    const nameInput = page.locator('input[placeholder="e.g. Brandish Buff"]');
    await nameInput.fill('My Test Proposal');

    await navigateToDashboard(page);
    await navigateToProposalBuilder(page);

    await expect(nameInput).toHaveValue('My Test Proposal');
  });
});
