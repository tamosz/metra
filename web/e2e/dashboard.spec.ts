import { test, expect } from '@playwright/test';

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with ranking table and chart visible', async ({ page }) => {
    await expect(page.getByTestId('ranking-table')).toBeVisible();
    await expect(page.getByTestId('dps-chart').locator('svg')).toBeVisible();
  });

  test('buff toggle changes DPS values', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const firstDpsBefore = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();

    // Turn off SE
    await page.getByRole('button', { name: 'SE' }).click();

    const firstDpsAfter = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();
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
    const dpsTexts = await table.locator('tbody tr td:nth-child(5)').allTextContents();
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

  test('KB toggle changes DPS values', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const firstDpsBefore = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();

    // Enable KB modeling
    await page.getByRole('button', { name: 'KB' }).click();

    const firstDpsAfter = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();
    expect(firstDpsAfter).not.toBe(firstDpsBefore);
  });

  test('element toggle cycles through states and affects DPS', async ({ page }) => {
    const holyButton = page.getByRole('button', { name: 'Ho' });
    await expect(holyButton).toBeVisible();

    // Get baseline DPS
    const table = page.getByTestId('ranking-table');
    const dpsBefore = await table.locator('tbody tr td:nth-child(5)').allTextContents();

    // Click to set Holy weak (1.5x)
    await holyButton.click();
    await expect(holyButton).toHaveClass(/emerald/);

    // Click again to set Holy strong (0.5x)
    await holyButton.click();
    await expect(holyButton).toHaveClass(/red/);

    // Click again to reset to neutral
    await holyButton.click();
    await expect(holyButton).not.toHaveClass(/emerald|red/);

    // DPS should be back to baseline
    const dpsAfter = await table.locator('tbody tr td:nth-child(5)').allTextContents();
    expect(dpsAfter).toEqual(dpsBefore);
  });
});
