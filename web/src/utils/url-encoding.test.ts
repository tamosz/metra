import { describe, it, expect } from 'vitest';
import {
  encodeProposal,
  decodeProposal,
  encodeBuild,
  decodeBuild,
  encodeComparison,
  decodeComparison,
  encodeParty,
  decodeParty,
} from './url-encoding.js';
import type { BuildUrlPayload, ComparisonUrlPayload } from './url-encoding.js';
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
        { target: 'dark-knight.spear-crusher', field: 'basePower', to: 200 },
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

describe('build url encoding', () => {
  it('roundtrips a build with overrides', () => {
    const payload: BuildUrlPayload = {
      class: 'hero',
      overrides: { gearSTR: 200 },
    };

    const encoded = encodeBuild(payload);
    const decoded = decodeBuild(encoded);

    expect(decoded).toEqual(payload);
  });

  it('roundtrips a build with empty overrides', () => {
    const payload: BuildUrlPayload = {
      class: 'night-lord',
      overrides: {},
    };

    const encoded = encodeBuild(payload);
    const decoded = decodeBuild(encoded);

    expect(decoded).toEqual(payload);
  });

  it('returns null for malformed input', () => {
    expect(decodeBuild('garbage')).toBeNull();
  });
});

describe('comparison url encoding', () => {
  it('roundtrips two builds with different classes', () => {
    const payload: ComparisonUrlPayload = {
      a: { class: 'hero', overrides: {} },
      b: { class: 'dark-knight', overrides: {} },
    };

    const encoded = encodeComparison(payload);
    const decoded = decodeComparison(encoded);

    expect(decoded).toEqual(payload);
  });

  it('returns null for malformed input', () => {
    expect(decodeComparison('garbage')).toBeNull();
  });

  it('preserves nested overrides on both builds', () => {
    const payload: ComparisonUrlPayload = {
      a: { class: 'hero', overrides: { gearSTR: 300, totalWeaponAttack: 250 } },
      b: { class: 'night-lord', overrides: { gearLUK: 400 } },
    };

    const encoded = encodeComparison(payload);
    const decoded = decodeComparison(encoded);

    expect(decoded).toEqual(payload);
    expect(decoded!.a.overrides).toEqual({ gearSTR: 300, totalWeaponAttack: 250 });
    expect(decoded!.b.overrides).toEqual({ gearLUK: 400 });
  });
});

describe('party URL encoding', () => {
  it('roundtrips a party composition', () => {
    const members = ['night-lord', 'night-lord', 'bowmaster', 'hero', 'dark-knight', 'bishop'];
    const encoded = encodeParty(members);
    const decoded = decodeParty(encoded);
    expect(decoded).toEqual(members);
  });

  it('handles empty party', () => {
    const encoded = encodeParty([]);
    const decoded = decodeParty(encoded);
    expect(decoded).toEqual([]);
  });

  it('returns null for empty string', () => {
    expect(decodeParty('')).toBeNull();
  });
});
