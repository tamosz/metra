import { describe, it, expect } from 'vitest';
import { DEFAULT_SCENARIOS } from './scenarios.js';

describe('DEFAULT_SCENARIOS', () => {
  it('has 3 scenarios', () => {
    expect(DEFAULT_SCENARIOS).toHaveLength(3);
  });

  it('each scenario has a non-empty name', () => {
    for (const scenario of DEFAULT_SCENARIOS) {
      expect(typeof scenario.name).toBe('string');
      expect(scenario.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('override keys are valid CharacterBuild fields', () => {
    const validKeys = new Set([
      'sharpEyes', 'echoActive', 'speedInfusion',
      'mwLevel', 'attackPotion', 'shadowPartner',
    ]);
    for (const scenario of DEFAULT_SCENARIOS) {
      if (scenario.overrides) {
        for (const key of Object.keys(scenario.overrides)) {
          expect(validKeys).toContain(key);
        }
      }
    }
  });

  it('pdr values are between 0 and 1', () => {
    for (const scenario of DEFAULT_SCENARIOS) {
      if (scenario.pdr !== undefined) {
        expect(scenario.pdr).toBeGreaterThanOrEqual(0);
        expect(scenario.pdr).toBeLessThanOrEqual(1);
      }
    }
  });

  it('includes expected scenario names', () => {
    const names = DEFAULT_SCENARIOS.map((s) => s.name);
    expect(names).toContain('Buffed');
    expect(names).toContain('Bossing (50% PDR)');
    expect(names).toContain('Bossing (KB)');
  });

  it('Buffed scenario has no overrides or pdr', () => {
    const buffed = DEFAULT_SCENARIOS.find((s) => s.name === 'Buffed')!;
    expect(buffed.overrides).toBeUndefined();
    expect(buffed.pdr).toBeUndefined();
  });

  it('Bossing (KB) scenario has PDR, attack interval, and accuracy', () => {
    const kb = DEFAULT_SCENARIOS.find((s) => s.name === 'Bossing (KB)')!;
    expect(kb.pdr).toBe(0.5);
    expect(kb.bossAttackInterval).toBe(1.5);
    expect(kb.bossAccuracy).toBe(250);
  });
});
