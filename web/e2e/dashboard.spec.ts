import { test, expect } from '@playwright/test';

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with ranking table and chart visible', async ({ page }) => {
    await expect(page.getByTestId('ranking-table')).toBeVisible();
    await expect(page.getByTestId('dps-chart').locator('svg')).toBeVisible();
  });

  test('scenario filter changes DPS values', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const firstDpsBefore = await table.locator('tbody tr:first-child td:last-child').textContent();

    await page.getByRole('button', { name: 'Unbuffed' }).click();

    const firstDpsAfter = await table.locator('tbody tr:first-child td:last-child').textContent();
    expect(firstDpsAfter).not.toBe(firstDpsBefore);
  });

  test('tier filter narrows table rows', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const allRowCount = await table.locator('tbody tr').count();

    await page.getByRole('button', { name: 'High' }).click();
    const highRowCount = await table.locator('tbody tr').count();

    expect(highRowCount).toBeLessThan(allRowCount);
    // Every visible row should say "High" in the tier column
    const tiers = await table.locator('tbody tr td:nth-child(4)').allTextContents();
    for (const tier of tiers) {
      expect(tier).toBe('High');
    }
  });

  test('rankings sorted by DPS descending', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const dpsTexts = await table.locator('tbody tr td:last-child').allTextContents();
    const dpsValues = dpsTexts.map((t) => Number(t.replace(/,/g, '')));

    for (let i = 1; i < dpsValues.length; i++) {
      expect(dpsValues[i]).toBeLessThanOrEqual(dpsValues[i - 1]);
    }
  });

  test('chart bar count matches table row count', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const rowCount = await table.locator('tbody tr').count();

    const chart = page.getByTestId('dps-chart');
    const barCount = await chart.locator('.recharts-bar-rectangle').count();

    expect(barCount).toBe(rowCount);
  });
});
