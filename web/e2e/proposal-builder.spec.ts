import { test, expect } from '@playwright/test';
import { navigateToProposalBuilder, addChangeViaForm, BRANDISH_BUFF } from './fixtures.js';

test.describe('proposal builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await navigateToProposalBuilder(page);
  });

  test('simulate button disabled without name + changes', async ({ page }) => {
    const simulateBtn = page.getByRole('button', { name: 'Simulate' });
    await expect(simulateBtn).toBeDisabled();

    // Add name but no changes — still disabled
    await page.locator('input[placeholder="e.g. Brandish Buff"]').fill('Test');
    await expect(simulateBtn).toBeDisabled();

    // Add a change
    await addChangeViaForm(page, {
      className: 'hero',
      skillLabel: 'Brandish (Sword)',
      value: '280',
    });
    await expect(simulateBtn).toBeEnabled();
  });

  test('add a change via form and remove it', async ({ page }) => {
    await addChangeViaForm(page, {
      className: 'hero',
      skillLabel: 'Brandish (Sword)',
      value: '280',
    });

    // Change row should be visible
    await expect(page.getByText('hero.brandish-sword')).toBeVisible();

    // Remove it
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('hero.brandish-sword')).not.toBeVisible();
  });

  test('current value hint shows after selecting skill', async ({ page }) => {
    await page.getByTestId('class-select').selectOption({ value: 'hero' });
    await page.getByTestId('skill-select').selectOption({ label: 'Brandish (Sword)' });

    // The label should show "(was 260)" for basePower
    await expect(page.getByText('was 260')).toBeVisible();
  });

  test('JSON import loads proposal', async ({ page }) => {
    await page.getByRole('button', { name: 'Import/Export JSON' }).click();
    await page.getByTestId('json-import').fill(JSON.stringify(BRANDISH_BUFF));
    await page.getByRole('button', { name: 'Import' }).click();

    // Name and change should be loaded
    await expect(page.locator('input[placeholder="e.g. Brandish Buff"]')).toHaveValue('Brandish +20');
    await expect(page.getByText('hero.brandish-sword')).toBeVisible();
  });

  test('JSON export contains valid JSON matching current proposal', async ({ page }) => {
    await page.locator('input[placeholder="e.g. Brandish Buff"]').fill('Export Test');

    await addChangeViaForm(page, {
      className: 'hero',
      skillLabel: 'Brandish (Sword)',
      value: '280',
    });

    await page.getByRole('button', { name: 'Import/Export JSON' }).click();

    const jsonText = await page.getByTestId('json-export').textContent();
    const parsed = JSON.parse(jsonText!);
    expect(parsed.name).toBe('Export Test');
    expect(parsed.changes).toHaveLength(1);
    expect(parsed.changes[0].target).toBe('hero.brandish-sword');
    expect(parsed.changes[0].to).toBe(280);
  });
});
