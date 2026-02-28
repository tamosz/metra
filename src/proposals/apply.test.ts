import { describe, it, expect, beforeAll } from 'vitest';
import { loadClassSkills } from '../data/loader.js';
import type { ClassSkillData } from '../data/types.js';
import { applyProposal, skillSlug } from './apply.js';
import type { Proposal } from './types.js';

let classDataMap: Map<string, ClassSkillData>;

beforeAll(() => {
  classDataMap = new Map([
    ['hero', loadClassSkills('Hero')],
    ['drk', loadClassSkills('DrK')],
    ['paladin', loadClassSkills('Paladin')],
  ]);
});

describe('skillSlug', () => {
  it('converts skill names to slugs', () => {
    expect(skillSlug('Brandish (Sword)')).toBe('brandish-sword');
    expect(skillSlug('Spear Crusher')).toBe('spear-crusher');
    expect(skillSlug('Blast (Holy, Sword)')).toBe('blast-holy-sword');
    expect(skillSlug('Blast (F/I/L Charge, Sword)')).toBe(
      'blast-fil-charge-sword'
    );
  });
});

describe('applyProposal', () => {
  it('applies a single change to a skill', () => {
    const proposal: Proposal = {
      name: 'Brandish +20%',
      author: 'test',
      changes: [
        {
          target: 'hero.brandish-sword',
          field: 'basePower',
          from: 260,
          to: 312,
        },
      ],
    };

    const modified = applyProposal(classDataMap, proposal);

    // Hero Brandish should be changed
    const heroSkill = modified
      .get('hero')!
      .skills.find((s) => s.name === 'Brandish (Sword)')!;
    expect(heroSkill.basePower).toBe(312);

    // Original should be untouched
    const originalSkill = classDataMap
      .get('hero')!
      .skills.find((s) => s.name === 'Brandish (Sword)')!;
    expect(originalSkill.basePower).toBe(260);
  });

  it('does not affect other classes', () => {
    const proposal: Proposal = {
      name: 'Brandish +20%',
      author: 'test',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 312 },
      ],
    };

    const modified = applyProposal(classDataMap, proposal);

    // DrK should be unchanged
    const crusher = modified
      .get('drk')!
      .skills.find((s) => s.name === 'Spear Crusher')!;
    expect(crusher.basePower).toBe(170);
  });

  it('throws on stale from value', () => {
    const proposal: Proposal = {
      name: 'Stale proposal',
      author: 'test',
      changes: [
        {
          target: 'hero.brandish-sword',
          field: 'basePower',
          from: 999,
          to: 312,
        },
      ],
    };

    expect(() => applyProposal(classDataMap, proposal)).toThrow(
      /Stale proposal/
    );
  });

  it('throws on unknown class', () => {
    const proposal: Proposal = {
      name: 'Bad class',
      author: 'test',
      changes: [
        { target: 'ninja.shuriken', field: 'basePower', to: 100 },
      ],
    };

    expect(() => applyProposal(classDataMap, proposal)).toThrow(
      /not found/
    );
  });

  it('throws on unknown skill', () => {
    const proposal: Proposal = {
      name: 'Bad skill',
      author: 'test',
      changes: [
        { target: 'hero.nonexistent-skill', field: 'basePower', to: 100 },
      ],
    };

    expect(() => applyProposal(classDataMap, proposal)).toThrow(
      /not found/
    );
  });

  it('applies multiple changes across classes', () => {
    const proposal: Proposal = {
      name: 'Multi-class rebalance',
      author: 'test',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 300 },
        { target: 'drk.spear-crusher', field: 'basePower', to: 200 },
      ],
    };

    const modified = applyProposal(classDataMap, proposal);

    expect(
      modified.get('hero')!.skills.find((s) => s.name === 'Brandish (Sword)')!
        .basePower
    ).toBe(300);
    expect(
      modified.get('drk')!.skills.find((s) => s.name === 'Spear Crusher')!
        .basePower
    ).toBe(200);
  });
});
