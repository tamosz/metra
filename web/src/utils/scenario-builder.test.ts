import { describe, it, expect } from 'vitest';
import { buildScenarios } from './scenario-builder.js';
import type { SimulationOptions } from '../hooks/useSimulation.js';

describe('buildScenarios', () => {
  it('returns a single Baseline scenario with no options', () => {
    const scenarios = buildScenarios({});
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].name).toBe('Baseline');
    expect(scenarios[0].overrides).toBeUndefined();
    expect(scenarios[0].elementModifiers).toBeUndefined();
    expect(scenarios[0].bossAttackInterval).toBeUndefined();
    expect(scenarios[0].efficiencyOverrides).toBeUndefined();
  });

  it('applies buff overrides', () => {
    const scenarios = buildScenarios({
      buffOverrides: { sharpEyes: false },
    });
    expect(scenarios[0].overrides).toEqual({ sharpEyes: false });
  });

  it('ignores empty buff overrides', () => {
    const scenarios = buildScenarios({ buffOverrides: {} });
    expect(scenarios[0].overrides).toBeUndefined();
  });

  it('applies element modifiers', () => {
    const scenarios = buildScenarios({
      elementModifiers: { Holy: 1.5 },
    });
    expect(scenarios[0].elementModifiers).toEqual({ Holy: 1.5 });
  });

  it('ignores empty element modifiers', () => {
    const scenarios = buildScenarios({ elementModifiers: {} });
    expect(scenarios[0].elementModifiers).toBeUndefined();
  });

  it('applies KB config', () => {
    const scenarios = buildScenarios({
      kbConfig: { bossAttackInterval: 2.0, bossAccuracy: 270 },
    });
    expect(scenarios[0].bossAttackInterval).toBe(2.0);
    expect(scenarios[0].bossAccuracy).toBe(270);
  });

  it('applies efficiency overrides', () => {
    const overrides = { 'Corsair.Practical Bossing': [0.5, 0.5] };
    const scenarios = buildScenarios({ efficiencyOverrides: overrides });
    expect(scenarios[0].efficiencyOverrides).toEqual(overrides);
  });

  it('adds training scenario when targetCount > 1', () => {
    const scenarios = buildScenarios({ targetCount: 6 });
    expect(scenarios).toHaveLength(2);
    expect(scenarios[1].name).toBe('Training (6 mobs)');
    expect(scenarios[1].targetCount).toBe(6);
  });

  it('does not add training scenario when targetCount is 1', () => {
    const scenarios = buildScenarios({ targetCount: 1 });
    expect(scenarios).toHaveLength(1);
  });

  it('copies all options to training scenario', () => {
    const options: SimulationOptions = {
      targetCount: 4,
      buffOverrides: { sharpEyes: false },
      elementModifiers: { Ice: 0.5 },
      kbConfig: { bossAttackInterval: 3.0, bossAccuracy: 200 },
      efficiencyOverrides: { 'Corsair.Practical Bossing': [0.8, 0.2] },
    };
    const scenarios = buildScenarios(options);
    const [baseline, training] = scenarios;

    // Both should have same overrides/mods/kb
    expect(training.overrides).toEqual(baseline.overrides);
    expect(training.elementModifiers).toEqual(baseline.elementModifiers);
    expect(training.bossAttackInterval).toBe(baseline.bossAttackInterval);
    expect(training.bossAccuracy).toBe(baseline.bossAccuracy);
    expect(training.efficiencyOverrides).toEqual(baseline.efficiencyOverrides);
  });

  it('merges extraOverrides with buffOverrides', () => {
    const scenarios = buildScenarios(
      { buffOverrides: { sharpEyes: false } },
      { echoActive: false },
    );
    expect(scenarios[0].overrides).toEqual({ sharpEyes: false, echoActive: false });
  });

  it('applies extraOverrides even with no buffOverrides', () => {
    const scenarios = buildScenarios({}, { speedInfusion: false });
    expect(scenarios[0].overrides).toEqual({ speedInfusion: false });
  });
});
