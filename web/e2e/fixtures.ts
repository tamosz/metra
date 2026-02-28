import { type Page } from '@playwright/test';
import LZString from 'lz-string';

export interface TestProposal {
  name: string;
  author: string;
  description: string;
  changes: {
    target: string;
    field: string;
    from?: number;
    to: number;
  }[];
}

export const BRANDISH_BUFF: TestProposal = {
  name: 'Brandish +20',
  author: 'Tester',
  description: 'Increase Brandish base power from 260 to 280',
  changes: [
    {
      target: 'hero.brandish-sword',
      field: 'basePower',
      from: 260,
      to: 280,
    },
  ],
};

export function encodeProposalHash(proposal: TestProposal): string {
  const json = JSON.stringify(proposal);
  return `#p=${LZString.compressToEncodedURIComponent(json)}`;
}

export async function navigateToProposalBuilder(page: Page) {
  await page.getByRole('button', { name: 'Proposal Builder' }).click();
}

export async function navigateToDashboard(page: Page) {
  await page.getByRole('button', { name: 'Rankings' }).click();
}

export async function addChangeViaForm(
  page: Page,
  opts: { className: string; skillLabel: string; field?: string; value: string }
) {
  await page.getByTestId('class-select').selectOption({ value: opts.className });
  await page.getByTestId('skill-select').selectOption({ label: opts.skillLabel });
  if (opts.field) {
    await page.getByTestId('field-select').selectOption({ value: opts.field });
  }
  await page.getByTestId('new-value-input').fill(opts.value);
  await page.getByRole('button', { name: 'Add' }).click();
}

export async function fillProposalAndSimulate(
  page: Page,
  proposal: TestProposal = BRANDISH_BUFF
) {
  await navigateToProposalBuilder(page);

  // Fill name
  const nameInput = page.locator('input[placeholder="e.g. Brandish Buff"]');
  await nameInput.fill(proposal.name);

  // Fill author
  const authorInput = page.locator('input[placeholder="Your name"]');
  await authorInput.fill(proposal.author);

  // Add changes via JSON import (faster than filling form for each)
  await page.getByRole('button', { name: 'Import/Export JSON' }).click();
  await page.getByTestId('json-import').fill(JSON.stringify(proposal));
  await page.getByRole('button', { name: 'Import' }).click();

  // Simulate
  await page.getByRole('button', { name: 'Simulate' }).click();
}
