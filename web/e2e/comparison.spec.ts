import { test, expect } from '@playwright/test';
import LZString from 'lz-string';

test.describe('comparison view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Compare' }).click();
  });

  test('two build panels visible', async ({ page }) => {
    await expect(page.getByText('Build A').first()).toBeVisible();
    await expect(page.getByText('Build B').first()).toBeVisible();
  });

  test('selecting different classes shows comparison summary and two skill tables', async ({ page }) => {
    // Build B panel is the second one — find its class select by scoping
    const panelB = page.locator('div').filter({ hasText: /^Build B$/ }).locator('..');
    const classBSelect = panelB.locator('select').first();
    await classBSelect.selectOption('nl');

    // Should show "vs" in comparison summary
    await expect(page.getByText('vs')).toBeVisible();
    // Different classes → two separate "DPS Results" tables (not per-skill comparison)
    const dpsHeaders = page.getByText('DPS Results');
    await expect(dpsHeaders).toHaveCount(2);
  });

  test('same-class shows per-skill comparison table', async ({ page }) => {
    // Both default to same class → per-skill comparison
    await expect(page.getByText('Per-Skill Comparison')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Build A' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Build B' })).toBeVisible();
  });

  test('changing tier on one panel shows non-zero deltas', async ({ page }) => {
    // Both default to same class+tier, so change Build B tier
    // Tier selects have options "high" and "low"
    const tierSelects = page.locator('select').filter({ has: page.locator('option[value="low"]') });
    // Build B tier is the second tier select
    const buildBTier = tierSelects.nth(1);
    // Pick the opposite tier from whatever is selected
    const currentValue = await buildBTier.inputValue();
    const newTier = currentValue === 'high' ? 'low' : 'high';
    await buildBTier.selectOption(newTier);

    // Same class still → per-skill comparison
    await expect(page.getByText('Per-Skill Comparison')).toBeVisible();
    // Should have non-zero deltas now
    const deltaCell = page.locator('td').filter({ hasText: /[+-]\d+\.\d%/ }).first();
    await expect(deltaCell).toBeVisible();
  });

  test('Copy Link button exists', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Copy Link' })).toBeVisible();
  });

  test('#c= URL loads comparison with correct classes', async ({ page }) => {
    const payload = {
      a: { class: 'hero', tier: 'high', overrides: {} },
      b: { class: 'nl', tier: 'high', overrides: {} },
    };
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    // Navigate away first, then to the hash URL — ensures a fresh React mount
    await page.goto('about:blank');
    await page.goto(`http://localhost:5173/#c=${encoded}`);

    // Should auto-navigate to compare page with different classes → shows "vs"
    await expect(page.getByText('vs')).toBeVisible();
    // Two separate DPS Results tables (different classes)
    const dpsHeaders = page.getByText('DPS Results');
    await expect(dpsHeaders).toHaveCount(2);
  });
});
