import { test, expect } from '@playwright/test';

test.describe('buff breakdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ranking-table"]');
  });

  test('breakdown toggle appears and activates', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Buffs' });
    await expect(btn).toBeVisible();

    // Should start inactive
    await expect(btn).not.toHaveClass(/emerald/);

    await btn.click();
    await expect(btn).toHaveClass(/emerald/);
  });

  test('activating breakdown shows legend', async ({ page }) => {
    await expect(page.getByTestId('breakdown-legend')).not.toBeVisible();

    await page.getByRole('button', { name: 'Buffs' }).click();
    await expect(page.getByTestId('breakdown-legend')).toBeVisible();

    // Legend should contain SE, SI, Echo labels
    const legend = page.getByTestId('breakdown-legend');
    await expect(legend).toContainText('Base');
    await expect(legend).toContainText('SE');
    await expect(legend).toContainText('SI');
    await expect(legend).toContainText('Echo');
  });

  test('breakdown renders stacked bars in the chart', async ({ page }) => {
    const chart = page.getByTestId('dps-chart');

    // Before breakdown: single bar group
    const barsBefore = await chart.locator('.recharts-bar').count();

    await page.getByRole('button', { name: 'Buffs' }).click();

    // After breakdown: 4 stacked bar groups (base + SE + SI + Echo)
    const barsAfter = await chart.locator('.recharts-bar').count();
    expect(barsAfter).toBe(4);
    expect(barsAfter).toBeGreaterThan(barsBefore);
  });

  test('toggling breakdown off returns to single bars', async ({ page }) => {
    const chart = page.getByTestId('dps-chart');
    const btn = page.getByRole('button', { name: 'Buffs' });

    await btn.click();
    expect(await chart.locator('.recharts-bar').count()).toBe(4);

    await btn.click();
    expect(await chart.locator('.recharts-bar').count()).toBe(1);
    await expect(page.getByTestId('breakdown-legend')).not.toBeVisible();
  });

  test('disabling SE still renders breakdown with 4 bar groups', async ({ page }) => {
    // Enable breakdown
    await page.getByRole('button', { name: 'Buffs' }).click();

    const chart = page.getByTestId('dps-chart');

    // Turn off SE via buff toggles
    await page.getByRole('button', { name: 'SE', exact: true }).click();

    // Breakdown should still render with all 4 bar groups (SE bars will be zero-width)
    expect(await chart.locator('.recharts-layer.recharts-bar').count()).toBe(4);
    await expect(page.getByTestId('breakdown-legend')).toBeVisible();
  });

  test('edit mode hides breakdown', async ({ page }) => {
    // Enable breakdown
    await page.getByRole('button', { name: 'Buffs' }).click();
    await expect(page.getByTestId('breakdown-legend')).toBeVisible();

    // Enable edit mode — breakdown should be suppressed
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByTestId('breakdown-legend')).not.toBeVisible();

    // Disable edit mode — breakdown should come back
    await page.getByTitle(/[Ee]dit mode active/).click();
    await expect(page.getByTestId('breakdown-legend')).toBeVisible();
  });
});
