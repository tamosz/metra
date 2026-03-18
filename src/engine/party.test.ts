import { describe, it, expect } from 'vitest';
import { resolvePartyBuffs } from '@metra/engine';

describe('resolvePartyBuffs', () => {
  it('returns all false for a party with no buff providers', () => {
    const members = [
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'dark-knight' },
      { className: 'shadower' },
      { className: 'archmage-il' },
      { className: 'bishop' },
    ];
    const buffs = resolvePartyBuffs(members);
    expect(buffs.sharpEyes).toBe(false);
    expect(buffs.speedInfusion).toBe(false);
    expect(buffs.rage).toBe(false);
  });

  it('enables SE when Bowmaster is present', () => {
    const members = [{ className: 'bowmaster' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).sharpEyes).toBe(true);
  });

  it('enables SE when Marksman is present', () => {
    const members = [{ className: 'marksman' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).sharpEyes).toBe(true);
  });

  it('enables SI when Buccaneer is present', () => {
    const members = [{ className: 'bucc' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).speedInfusion).toBe(true);
  });

  it('enables Rage when Hero is present', () => {
    const members = [{ className: 'hero' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).rage).toBe(true);
  });

  it('enables Rage when Hero (Axe) is present', () => {
    const members = [{ className: 'hero-axe' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).rage).toBe(true);
  });

  it('does not double-apply buffs with duplicate buff providers', () => {
    const members = [
      { className: 'bowmaster' },
      { className: 'marksman' },
      { className: 'bucc' },
      { className: 'hero' },
      { className: 'hero-axe' },
      { className: 'night-lord' },
    ];
    const buffs = resolvePartyBuffs(members);
    expect(buffs.sharpEyes).toBe(true);
    expect(buffs.speedInfusion).toBe(true);
    expect(buffs.rage).toBe(true);
  });

  it('handles empty party', () => {
    const buffs = resolvePartyBuffs([]);
    expect(buffs.sharpEyes).toBe(false);
    expect(buffs.speedInfusion).toBe(false);
    expect(buffs.rage).toBe(false);
  });
});
