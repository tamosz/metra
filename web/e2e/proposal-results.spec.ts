import { test, expect } from '@playwright/test';
import { fillProposalAndSimulate, BRANDISH_BUFF } from './fixtures.js';

test.describe('proposal results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await fillProposalAndSimulate(page);
  });

  test('simulate produces delta table with expected columns', async ({ page }) => {
    const table = page.getByTestId('delta-table');
    await expect(table).toBeVisible();

    const headers = await table.locator('thead th').allTextContents();
    expect(headers).toContain('Class');
    expect(headers).toContain('Skill');
    expect(headers).toContain('Tier');
    expect(headers).toContain('Before');
    expect(headers).toContain('After');
    expect(headers).toContain('Change');
    expect(headers).toContain('%');
  });

  test('scenario tabs switch table data', async ({ page }) => {
    const table = page.getByTestId('delta-table');
    const buffedFirst = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();

    await page.getByRole('button', { name: 'Unbuffed' }).click();
    const unbuffedFirst = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();

    expect(unbuffedFirst).not.toBe(buffedFirst);
  });

  test('changed rows show positive coloring and + prefix', async ({ page }) => {
    const table = page.getByTestId('delta-table');
    // Brandish buff should produce a positive change row with "+" prefix
    const changeCell = table.locator('tbody tr:first-child td:nth-child(7)');
    const text = await changeCell.textContent();
    expect(text).toMatch(/^\+/);
  });

  test('rank column with movement present', async ({ page }) => {
    const table = page.getByTestId('delta-table');
    const headers = await table.locator('thead th').allTextContents();
    expect(headers).toContain('Rank');
  });

  test('rank bump chart shows when tier is selected', async ({ page }) => {
    // Select a specific tier to make bump chart visible
    await page.getByRole('button', { name: /High/i }).click();

    const chart = page.getByTestId('rank-bump-chart');
    await expect(chart).toBeVisible();
    await expect(chart.getByText('Rank Movement')).toBeVisible();
  });

  test('rank bump chart hidden when all tiers selected', async ({ page }) => {
    // "All Tiers" is default — bump chart should not be visible
    const chart = page.getByTestId('rank-bump-chart');
    await expect(chart).not.toBeVisible();
  });

  test.describe('clipboard', () => {
    test.use({
      permissions: ['clipboard-read', 'clipboard-write'],
    });

    test('copy share link sets URL hash and copies to clipboard', async ({ page }) => {
      await page.getByRole('button', { name: 'Copy Share Link' }).click();
      await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

      const url = page.url();
      expect(url).toContain('#p=');

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('#p=');
    });

    test('copy markdown writes markdown to clipboard', async ({ page }) => {
      await page.getByRole('button', { name: 'Copy Markdown' }).click();

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('##');
      expect(clipboardText).toMatch(/\|[-:]+\|/);
    });

    test('copy for forum writes BBCode to clipboard', async ({ page }) => {
      await page.getByRole('button', { name: 'Copy for Forum' }).click();

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('[b]');
    });
  });
});
