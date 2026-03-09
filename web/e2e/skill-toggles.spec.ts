import { test, expect } from '@playwright/test';

const SKILL_GROUP_LABELS = ['Main', 'Warriors', 'Mages', 'Archers', 'Thieves', 'Pirates', 'Multi-target'];

// Warrior classes include Hero, Dark Knight, Paladin (not variants like Hero (Axe), Paladin (BW))
const WARRIOR_CLASSES = ['Hero', 'Dark Knight', 'Paladin'];
const MAGE_CLASSES = ['Bishop', 'Archmage I/L', 'Archmage F/P'];
const ARCHER_CLASSES = ['Bowmaster', 'Marksman'];
const THIEF_CLASSES = ['Night Lord', 'Shadower'];
const PIRATE_CLASSES = ['Corsair', 'Buccaneer'];

function skillToggle(page: import('@playwright/test').Page, label: string) {
  return page.getByRole('button', { name: label, exact: true }).and(
    page.locator('[aria-pressed]'),
  );
}

function getTableClassNames(page: import('@playwright/test').Page) {
  return page.getByTestId('ranking-table').locator('tbody tr td:nth-child(2)').allTextContents();
}

test.describe('skill group toggles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ranking-table')).toBeVisible();
  });

  test('all toggle buttons are visible with correct labels', async ({ page }) => {
    for (const label of SKILL_GROUP_LABELS) {
      await expect(skillToggle(page, label)).toBeVisible();
    }
  });

  test('Main toggle is active by default, others are not', async ({ page }) => {
    await expect(skillToggle(page, 'Main')).toHaveAttribute('aria-pressed', 'true');
    for (const label of SKILL_GROUP_LABELS.slice(1)) {
      await expect(skillToggle(page, label)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('deselecting all toggles shows empty state without crashing', async ({ page }) => {
    // Main is the only active toggle by default — click it to deselect all
    await skillToggle(page, 'Main').click();
    await expect(skillToggle(page, 'Main')).toHaveAttribute('aria-pressed', 'false');

    // Table should show empty state
    const table = page.getByTestId('ranking-table');
    await expect(table.locator('tbody tr td')).toContainText('No results');

    // Page should not crash — verify we can still interact
    await skillToggle(page, 'Main').click();
    await expect(skillToggle(page, 'Main')).toHaveAttribute('aria-pressed', 'true');
    const rowCount = await table.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Warriors toggle shows only warrior classes', async ({ page }) => {
    // Deactivate Main, activate Warriors
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Warriors').click();

    const classNames = await getTableClassNames(page);
    expect(classNames.length).toBeGreaterThan(0);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(
        WARRIOR_CLASSES.some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('Mages toggle shows only mage classes', async ({ page }) => {
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Mages').click();

    const classNames = await getTableClassNames(page);
    expect(classNames.length).toBeGreaterThan(0);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(
        MAGE_CLASSES.some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('Archers toggle shows only archer classes', async ({ page }) => {
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Archers').click();

    const classNames = await getTableClassNames(page);
    expect(classNames.length).toBeGreaterThan(0);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(
        ARCHER_CLASSES.some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('Thieves toggle shows only thief classes', async ({ page }) => {
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Thieves').click();

    const classNames = await getTableClassNames(page);
    expect(classNames.length).toBeGreaterThan(0);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(
        THIEF_CLASSES.some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('Pirates toggle shows only pirate classes', async ({ page }) => {
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Pirates').click();

    const classNames = await getTableClassNames(page);
    expect(classNames.length).toBeGreaterThan(0);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(
        PIRATE_CLASSES.some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('multiple toggles are additive — combining groups shows union of classes', async ({ page }) => {
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Warriors').click();
    const warriorOnly = await getTableClassNames(page);

    await skillToggle(page, 'Mages').click();
    const warriorAndMage = await getTableClassNames(page);

    expect(warriorAndMage.length).toBeGreaterThan(warriorOnly.length);

    // All classes should be either warrior or mage
    for (const name of warriorAndMage) {
      const trimmed = name.trim();
      expect(
        [...WARRIOR_CLASSES, ...MAGE_CLASSES].some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('Main toggle excludes weapon variant classes (Hero Axe, Paladin BW)', async ({ page }) => {
    const classNames = await getTableClassNames(page);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(trimmed).not.toContain('Hero (Axe)');
      expect(trimmed).not.toContain('Paladin (BW)');
    }
  });

  test('Warriors toggle includes weapon variant classes', async ({ page }) => {
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Warriors').click();

    const classNames = (await getTableClassNames(page)).map((n) => n.trim());
    // Warriors group should show all warrior skills including variants
    const hasVariant = classNames.some(
      (n) => n.includes('Hero (Axe)') || n.includes('Paladin (BW)'),
    );
    expect(hasVariant).toBe(true);
  });

  test('toggling a group off then on again restores the same results', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const dpsBefore = await table.locator('tbody tr td:nth-child(5)').allTextContents();

    // Toggle Main off then back on
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Main').click();

    const dpsAfter = await table.locator('tbody tr td:nth-child(5)').allTextContents();
    expect(dpsAfter).toEqual(dpsBefore);
  });

  test('skill toggles interact correctly with tier filter', async ({ page }) => {
    // Activate Warriors only
    await skillToggle(page, 'Main').click();
    await skillToggle(page, 'Warriors').click();

    // Switch to High tier
    await page.getByRole('button', { name: 'High' }).click();

    const table = page.getByTestId('ranking-table');
    const tiers = await table.locator('tbody tr td:nth-child(4)').allTextContents();
    for (const tier of tiers) {
      expect(tier).toBe('High');
    }

    const classNames = await getTableClassNames(page);
    for (const name of classNames) {
      const trimmed = name.trim();
      expect(
        WARRIOR_CLASSES.some((c) => trimmed.includes(c)),
      ).toBe(true);
    }
  });

  test('deselecting all toggles shows empty chart', async ({ page }) => {
    await skillToggle(page, 'Main').click();

    // Both chart areas should show "No data" text
    const noDataMessages = page.getByText('No data');
    await expect(noDataMessages.first()).toBeVisible();
  });

  test('rapidly toggling groups does not crash the app', async ({ page }) => {
    // Rapidly toggle multiple groups on and off
    for (const label of SKILL_GROUP_LABELS) {
      await skillToggle(page, label).click();
    }
    // All on now — toggle them all off
    for (const label of SKILL_GROUP_LABELS) {
      await skillToggle(page, label).click();
    }

    // Page should still be functional
    const table = page.getByTestId('ranking-table');
    await expect(table.locator('tbody tr td')).toContainText('No results');

    // Re-enable Main
    await skillToggle(page, 'Main').click();
    const rowCount = await table.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
