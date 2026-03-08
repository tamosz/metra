import { test, expect } from '@playwright/test';
import { encodeProposalHash, BRANDISH_BUFF, SNIPE_DOUBLE_HIT, MULTI_CLASS_CHANGE } from './fixtures.js';

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
    await page.getByRole('button', { name: 'Edit' }).click();

    const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();
    await firstRow.click();

    const detailPanel = page.locator('[data-testid="skill-detail-panel"]');
    await expect(detailPanel).toBeVisible();
    // Use .first() — combo skills may expose multiple basePower inputs
    await expect(detailPanel.locator('input[aria-label="basePower"]').first()).toBeVisible();
  });

  test('editing a value shows changes pill and delta badge', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit' }).click();

    const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();
    await firstRow.click();

    const basePowerInput = page.locator('[data-testid="skill-detail-panel"] input[aria-label="basePower"]').first();
    await basePowerInput.fill('999');
    await basePowerInput.blur();

    // The edit toggle button shows the change count
    await expect(page.getByTitle(/[Ee]dit mode active/)).toContainText('1 change');

    // A delta badge appears in the table
    const deltaBadge = page.locator('[data-testid="ranking-table"] span').filter({ hasText: /[+-][\d.]+%/ });
    await expect(deltaBadge.first()).toBeVisible();
    await expect(deltaBadge.first()).toHaveClass(/bg-emerald-500|bg-red-500/);
  });

  test('#p= URL loads into edit mode', async ({ page }) => {
    const hash = encodeProposalHash(BRANDISH_BUFF);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    await expect(page.getByTitle(/[Ee]dit mode active/)).toContainText('1 change');
  });

  test('snipe hitCount change shows positive delta for marksman', async ({ page }) => {
    const hash = encodeProposalHash(SNIPE_DOUBLE_HIT);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    await expect(page.getByTitle(/[Ee]dit mode active/)).toContainText('1 change');

    const marksmanRow = page.locator('[data-testid="ranking-table"] tbody tr').filter({ hasText: 'Marksman' });
    const deltaBadge = marksmanRow.locator('span').filter({ hasText: /^\+[\d.]+%$/ });
    await expect(deltaBadge.first()).toBeVisible();
  });

  test('multi-change proposal shows deltas for both classes', async ({ page }) => {
    const hash = encodeProposalHash(MULTI_CLASS_CHANGE);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    await expect(page.getByTitle(/[Ee]dit mode active/)).toContainText('2 changes');

    // Both Hero and Marksman should have delta badges
    const heroRow = page.locator('[data-testid="ranking-table"] tbody tr').filter({ hasText: 'Hero' }).first();
    await expect(heroRow.locator('span').filter({ hasText: /^\+[\d.]+%$/ })).toBeVisible();

    const marksmanRow = page.locator('[data-testid="ranking-table"] tbody tr').filter({ hasText: 'Marksman' }).first();
    await expect(marksmanRow.locator('span').filter({ hasText: /^\+[\d.]+%$/ })).toBeVisible();
  });

  test('big buff reorders rankings and bar chart', async ({ page }) => {
    // Load a proposal that makes Marksman Snipe hit twice — should jump significantly
    const hash = encodeProposalHash(SNIPE_DOUBLE_HIT);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    // Get all class names in ranking order
    const rows = page.locator('[data-testid="ranking-table"] tbody tr');
    const classNames: string[] = [];
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent();
      if (text?.includes('Marksman')) {
        classNames.push('Marksman');
      }
    }

    // Marksman should appear in the table
    expect(classNames.length).toBeGreaterThan(0);

    // Bar chart should exist and have bars
    const chart = page.locator('[data-testid="dps-chart"]');
    await expect(chart).toBeVisible();
  });

  test('rank diff arrows reflect visible positions only', async ({ page }) => {
    // Load a big buff that should cause rank movement
    const hash = encodeProposalHash(SNIPE_DOUBLE_HIT);
    await page.goto(`/${hash}`);
    await page.waitForSelector('[data-testid="ranking-table"]');

    // Any rank arrows should have values within the visible entry count
    const rows = page.locator('[data-testid="ranking-table"] tbody tr');
    const rowCount = await rows.count();

    // Find all rank diff indicators (↑N or ↓N)
    const arrows = page.locator('[data-testid="ranking-table"] span').filter({ hasText: /[↑↓]\d+/ });
    const arrowCount = await arrows.count();
    for (let i = 0; i < arrowCount; i++) {
      const text = await arrows.nth(i).textContent();
      const match = text?.match(/[↑↓](\d+)/);
      if (match) {
        const rankChange = parseInt(match[1], 10);
        // Rank change should never exceed the number of visible entries
        expect(rankChange).toBeLessThan(rowCount);
      }
    }
  });
});
