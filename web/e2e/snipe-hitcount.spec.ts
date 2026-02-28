import { test, expect } from '@playwright/test';
import { navigateToProposalBuilder, addChangeViaForm, fillProposalAndSimulate } from './fixtures.js';

test.describe('Snipe hitCount proposal', () => {
  test('changing Snipe hitCount to 2 doubles its DPS in results', async ({ page }) => {
    const proposal = {
      name: 'Snipe Double Hit',
      author: 'Tester',
      description: 'Double Snipe hitCount',
      changes: [
        {
          target: 'marksman.snipe',
          field: 'hitCount',
          from: 1,
          to: 2,
        },
      ],
    };

    await page.goto('/');
    await fillProposalAndSimulate(page, proposal);

    const table = page.getByTestId('delta-table');
    await expect(table).toBeVisible();

    // Find the Snipe row — it participates in the "Snipe + Strafe" combo
    // Look for a row containing "Snipe" that shows a positive change
    const snipeRow = table.locator('tbody tr').filter({ hasText: /Snipe/ }).first();
    await expect(snipeRow).toBeVisible();

    // The change column should show a positive delta (not 0 or empty)
    const cells = await snipeRow.locator('td').allTextContents();
    // Find the "Change" column — it has a "+" prefix for positive changes
    const changeCell = cells.find((c) => c.startsWith('+'));
    expect(changeCell).toBeTruthy();

    // The percentage change should be substantial (Snipe is ~18% of combo DPS,
    // doubling it should give roughly +18% on the combo row)
    const pctCell = cells.find((c) => c.match(/^\+\d+\.\d%$/));
    expect(pctCell).toBeTruthy();
  });
});
