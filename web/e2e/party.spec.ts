import { test, expect } from '@playwright/test';

// Screenshots land in web/e2e/screenshots/ (relative to CWD when running playwright from web/)
const SC = (name: string) => `e2e/screenshots/party-${name}.png`;

test.describe('party builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'party' }).click();
  });

  test('renders party page with heading and class roster', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Party Builder' })).toBeVisible();
    await expect(page.getByText('Class Roster')).toBeVisible();
    await page.screenshot({ path: SC('initial') });
  });

  test('clicking a preset populates the grid and shows total DPS', async ({ page }) => {
    await page.getByRole('button', { name: 'Warriors + SI' }).click();

    await expect(page.getByText('Total Party DPS')).toBeVisible();
    await page.screenshot({ path: SC('warriors-si') });
  });

  test('clicking a roster class adds it to the party', async ({ page }) => {
    // Empty party — no total DPS shown yet
    await expect(page.getByText('Total Party DPS')).not.toBeVisible();

    await page.getByRole('button', { name: 'Hero' }).first().click();

    await expect(page.getByText('Total Party DPS')).toBeVisible();
    await page.screenshot({ path: SC('add-member') });
  });

  test('removing a member updates the party DPS', async ({ page }) => {
    await page.getByRole('button', { name: 'Warriors + SI' }).click();
    await expect(page.getByText('Total Party DPS')).toBeVisible();

    const dpsBefore = await page.locator('.text-accent').first().textContent();

    // Remove the first filled slot via its aria-labelled × button
    await page.locator('button[aria-label^="Remove"]').first().click();

    const dpsAfter = await page.locator('.text-accent').first().textContent();
    expect(dpsAfter).not.toBe(dpsBefore);

    await page.screenshot({ path: SC('remove-member') });
  });

  test('buff bar reflects party composition — Rainbow shows SE chip', async ({ page }) => {
    // Rainbow includes Bowmaster which provides Sharp Eyes
    await page.getByRole('button', { name: 'Rainbow' }).click();

    await expect(page.getByText('Total Party DPS')).toBeVisible();
    await expect(page.getByText('SE')).toBeVisible();

    await page.screenshot({ path: SC('rainbow-buffs') });
  });

  test('URL encodes party composition after loading a preset', async ({ page }) => {
    await page.getByRole('button', { name: 'Warriors + SI' }).click();
    await expect(page.getByText('Total Party DPS')).toBeVisible();

    const url = page.url();
    expect(url).toContain('#party=');

    await page.screenshot({ path: SC('url-encoded') });
  });

  test('party loads from URL hash', async ({ page }) => {
    await page.goto('/#party=hero,bowmaster,night-lord,dark-knight,bucc,shadower');

    await expect(page.getByText('Total Party DPS')).toBeVisible();
    await page.screenshot({ path: SC('from-url') });
  });
});
