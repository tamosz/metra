import { describe, it, expect } from 'vitest';
import { encodeProposal, decodeProposal } from './url-encoding.js';
import type { Proposal } from '@engine/proposals/types.js';

describe('url-encoding', () => {
  it('roundtrips a proposal through encode/decode', () => {
    const proposal: Proposal = {
      name: 'Brandish Buff',
      author: 'Test',
      description: 'Increase base power',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
      ],
    };

    const encoded = encodeProposal(proposal);
    const decoded = decodeProposal(encoded);

    expect(decoded).toEqual(proposal);
  });

  it('roundtrips a multi-change proposal', () => {
    const proposal: Proposal = {
      name: 'Warrior Rebalance',
      author: 'Staff',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
        { target: 'drk.spear-crusher', field: 'basePower', to: 200 },
        { target: 'paladin.blast-holy-sword', field: 'multiplier', to: 1.5 },
      ],
    };

    const encoded = encodeProposal(proposal);
    const decoded = decodeProposal(encoded);

    expect(decoded).toEqual(proposal);
  });

  it('rejects an empty-changes proposal', () => {
    const proposal: Proposal = {
      name: 'Empty',
      author: 'Test',
      changes: [],
    };

    const encoded = encodeProposal(proposal);
    const decoded = decodeProposal(encoded);

    // validateProposal requires at least one change
    expect(decoded).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(decodeProposal('')).toBeNull();
    expect(decodeProposal('not-valid-lz-data')).toBeNull();
    expect(decodeProposal('abc123')).toBeNull();
  });
});
