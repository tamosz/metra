import { test, expect } from '@playwright/test';
import { encodeProposalHash, BRANDISH_BUFF, SNIPE_DOUBLE_HIT } from './fixtures.js';

test.describe('Edit mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ranking-table"]');
  });

  test('edit toggle appears', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('clicking toggle enables edit mode', async ({ page }) => {
    const editButton = page.getByRole('button', { name: 'Edit' });
    await editButton.click();
    await expect(editButton).toHaveClass(/emerald/);
  });

  test('expanding a skill row in edit mode shows editable fields', async ({ page }) => {
    // Enable edit mode
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
    // Enable edit mode
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

  test('#p= URL loads into edit mode', async ({ page }) => {
    const hash = encodeProposalHash(BRANDISH_BUFF);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    // The changes pill should be visible, confirming edit mode activated with changes loaded
    await expect(page.getByText('1 change')).toBeVisible();
  });

  test('snipe hitCount change shows positive delta for marksman', async ({ page }) => {
    const hash = encodeProposalHash(SNIPE_DOUBLE_HIT);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    // Should have 1 change loaded
    await expect(page.getByText('1 change')).toBeVisible();

    // Find a Marksman row with a positive delta badge
    const marksmanRow = page.locator('[data-testid="ranking-table"] tbody tr').filter({ hasText: 'Marksman' });
    const deltaBadge = marksmanRow.locator('span').filter({ hasText: /^\+[\d.]+%$/ });
    await expect(deltaBadge.first()).toBeVisible();
  });
});
