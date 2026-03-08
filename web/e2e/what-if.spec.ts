import { test, expect } from '@playwright/test';
import { encodeProposalHash, BRANDISH_BUFF } from './fixtures.js';

test.describe('What-if mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ranking-table"]');
  });

  test('what-if toggle appears', async ({ page }) => {
    await expect(page.getByText('What If', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('clicking toggle enables what-if mode', async ({ page }) => {
    const editButton = page.getByRole('button', { name: 'Edit' });
    await editButton.click();
    await expect(editButton).toHaveClass(/emerald/);
  });

  test('expanding a skill row in what-if mode shows editable fields', async ({ page }) => {
    // Enable what-if mode
    await page.getByRole('button', { name: 'Edit' }).click();

    // Click the first ranking row to expand it
    const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();
    await firstRow.click();

    // Verify the detail panel appears with an editable basePower input
    const detailPanel = page.locator('[data-testid="skill-detail-panel"]');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel.locator('input[aria-label="basePower"]')).toBeVisible();
  });

  test('editing a value shows changes pill and delta badge', async ({ page }) => {
    // Enable what-if mode
    await page.getByRole('button', { name: 'Edit' }).click();

    // Expand a row
    const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();
    await firstRow.click();

    // Edit the basePower input
    const basePowerInput = page.locator('[data-testid="skill-detail-panel"] input[aria-label="basePower"]');
    await basePowerInput.fill('999');
    await basePowerInput.blur();

    // Verify changes pill appears
    await expect(page.getByText('1 change')).toBeVisible();

    // Verify a delta badge appears in the table (emerald for buff, red for nerf)
    const deltaBadge = page.locator('[data-testid="ranking-table"] span').filter({ hasText: /[+-][\d.]+%/ });
    await expect(deltaBadge.first()).toBeVisible();
    await expect(deltaBadge.first()).toHaveClass(/bg-emerald-500|bg-red-500/);
  });

  test('#p= URL loads into what-if mode', async ({ page }) => {
    const hash = encodeProposalHash(BRANDISH_BUFF);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    // The changes pill should be visible, confirming what-if mode activated with changes loaded
    await expect(page.getByText('1 change')).toBeVisible();
  });
});
