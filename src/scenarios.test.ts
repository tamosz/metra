import { describe, it, expect } from 'vitest';
import { DEFAULT_SCENARIOS } from './scenarios.js';

describe('DEFAULT_SCENARIOS', () => {
  it('has 4 scenarios', () => {
    expect(DEFAULT_SCENARIOS).toHaveLength(4);
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
    expect(names).toContain('Unbuffed');
    expect(names).toContain('No-Echo');
    expect(names).toContain('Bossing (50% PDR)');
  });

  it('Buffed scenario has no overrides or pdr', () => {
    const buffed = DEFAULT_SCENARIOS.find((s) => s.name === 'Buffed')!;
    expect(buffed.overrides).toBeUndefined();
    expect(buffed.pdr).toBeUndefined();
  });

  it('Unbuffed scenario disables SE, Echo, SI, MW, and potion', () => {
    const unbuffed = DEFAULT_SCENARIOS.find((s) => s.name === 'Unbuffed')!;
    expect(unbuffed.overrides).toMatchObject({
      sharpEyes: false,
      echoActive: false,
      speedInfusion: false,
      mwLevel: 0,
      attackPotion: 0,
    });
  });
});
