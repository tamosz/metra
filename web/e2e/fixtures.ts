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

export const SNIPE_DOUBLE_HIT: TestProposal = {
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

export const MULTI_CLASS_CHANGE: TestProposal = {
  name: 'Multi-class change',
  author: 'Tester',
  description: 'Buff Hero and Marksman simultaneously',
  changes: [
    { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 400 },
    { target: 'marksman.snipe', field: 'hitCount', from: 1, to: 2 },
  ],
};

export function encodeProposalHash(proposal: TestProposal): string {
  const json = JSON.stringify(proposal);
  return `#p=${LZString.compressToEncodedURIComponent(json)}`;
}

export async function navigateToDashboard(page: Page) {
  await page.getByRole('button', { name: 'Rankings' }).click();
}
