import { describe, it, expect } from 'vitest';
import { isResultVisible, type SkillGroupId } from './skill-groups.js';
import type { ScenarioResult } from '@engine/proposals/types.js';

function makeResult(overrides: Partial<ScenarioResult> = {}): ScenarioResult {
  return {
    className: 'Hero',
    skillName: 'Brandish',
    tier: 'high',
    scenario: 'Baseline',
    dps: {} as ScenarioResult['dps'],
    ...overrides,
  };
}

function groups(...ids: SkillGroupId[]): Set<SkillGroupId> {
  return new Set(ids);
}

describe('isResultVisible', () => {
  describe('main group', () => {
    it('shows headline skills for non-variant classes', () => {
      expect(isResultVisible(makeResult(), groups('main'))).toBe(true);
    });

    it('hides non-headline skills', () => {
      expect(isResultVisible(makeResult({ headline: false }), groups('main'))).toBe(false);
    });

    it('hides variant classes', () => {
      expect(isResultVisible(makeResult({ className: 'Hero (Axe)' }), groups('main'))).toBe(false);
      expect(isResultVisible(makeResult({ className: 'Paladin (BW)' }), groups('main'))).toBe(false);
    });
  });

  describe('class archetype groups', () => {
    it('warriors group shows all warrior classes', () => {
      for (const cls of ['Hero', 'Hero (Axe)', 'Dark Knight', 'Paladin', 'Paladin (BW)']) {
        expect(isResultVisible(makeResult({ className: cls }), groups('warriors'))).toBe(true);
      }
    });

    it('warriors group shows non-headline skills', () => {
      expect(isResultVisible(makeResult({ className: 'Hero', headline: false }), groups('warriors'))).toBe(true);
    });

    it('mages group shows mage classes', () => {
      for (const cls of ['Bishop', 'Archmage I/L', 'Archmage F/P']) {
        expect(isResultVisible(makeResult({ className: cls }), groups('mages'))).toBe(true);
      }
    });

    it('archers group shows archer classes', () => {
      for (const cls of ['Bowmaster', 'Marksman']) {
        expect(isResultVisible(makeResult({ className: cls }), groups('archers'))).toBe(true);
      }
    });

    it('thieves group shows thief classes', () => {
      for (const cls of ['Night Lord', 'Shadower']) {
        expect(isResultVisible(makeResult({ className: cls }), groups('thieves'))).toBe(true);
      }
    });

    it('pirates group shows pirate classes', () => {
      for (const cls of ['Corsair', 'Buccaneer']) {
        expect(isResultVisible(makeResult({ className: cls }), groups('pirates'))).toBe(true);
      }
    });

    it('does not show classes from other groups', () => {
      expect(isResultVisible(makeResult({ className: 'Night Lord' }), groups('warriors'))).toBe(false);
      expect(isResultVisible(makeResult({ className: 'Hero' }), groups('mages'))).toBe(false);
    });
  });

  describe('multi-target group', () => {
    it('shows skills with maxTargets > 1', () => {
      expect(isResultVisible(makeResult({ maxTargets: 6 }), groups('multi-target'))).toBe(true);
    });

    it('hides single-target skills', () => {
      expect(isResultVisible(makeResult(), groups('multi-target'))).toBe(false);
      expect(isResultVisible(makeResult({ maxTargets: 1 }), groups('multi-target'))).toBe(false);
    });
  });

  describe('additive group logic', () => {
    it('result visible if any active group includes it', () => {
      const result = makeResult({ className: 'Hero (Axe)', headline: false });
      expect(isResultVisible(result, groups('main'))).toBe(false);
      expect(isResultVisible(result, groups('warriors'))).toBe(true);
      expect(isResultVisible(result, groups('main', 'warriors'))).toBe(true);
    });

    it('multi-target + archetype both work independently', () => {
      const result = makeResult({ className: 'Bowmaster', maxTargets: 6, headline: false });
      expect(isResultVisible(result, groups('multi-target'))).toBe(true);
      expect(isResultVisible(result, groups('archers'))).toBe(true);
      expect(isResultVisible(result, groups('main'))).toBe(false);
    });
  });

  describe('no active groups', () => {
    it('hides everything when no groups are active', () => {
      expect(isResultVisible(makeResult(), groups())).toBe(false);
    });
  });
});
