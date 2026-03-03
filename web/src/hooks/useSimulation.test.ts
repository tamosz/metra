import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSimulation } from './useSimulation.js';

describe('useSimulation', () => {
  it('returns results with expected shape', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.results).toBeInstanceOf(Array);
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.classNames.length).toBeGreaterThan(0);
    expect(result.current.tiers).toContain('low');
    expect(result.current.tiers).toContain('high');
  });

  it('each result has positive DPS', () => {
    const { result } = renderHook(() => useSimulation());

    for (const r of result.current.results) {
      expect(r.dps.dps).toBeGreaterThan(0);
    }
  });
});

describe('useSimulation buff overrides', () => {
  it('disabling SE reduces DPS vs baseline', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: noSe } = renderHook(() =>
      useSimulation(undefined, undefined, { sharpEyes: false })
    );

    const baseHero = baseline.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;
    const noSeHero = noSe.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;

    expect(noSeHero.dps.dps).toBeLessThan(baseHero.dps.dps);
  });

  it('disabling all buffs significantly reduces DPS', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: noBuffs } = renderHook(() =>
      useSimulation(undefined, undefined, {
        sharpEyes: false,
        echoActive: false,
        speedInfusion: false,
        mwLevel: 0,
        attackPotion: 0,
      })
    );

    const baseHero = baseline.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;
    const noBuffHero = noBuffs.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;

    expect(noBuffHero.dps.dps).toBeLessThan(baseHero.dps.dps * 0.8);
  });
});

describe('useSimulation element modifiers', () => {
  it('Holy 1.5x boosts Paladin DPS', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: holy } = renderHook(() =>
      useSimulation(undefined, { Holy: 1.5 })
    );

    const basePaladin = baseline.current.results.find(
      r => r.className === 'Paladin' && r.tier === 'high'
    )!;
    const holyPaladin = holy.current.results.find(
      r => r.className === 'Paladin' && r.tier === 'high'
    )!;

    expect(holyPaladin.dps.dps).toBeGreaterThan(basePaladin.dps.dps);
  });

  it('element modifiers do not affect non-elemental classes', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: holy } = renderHook(() =>
      useSimulation(undefined, { Holy: 1.5 })
    );

    const baseHero = baseline.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;
    const holyHero = holy.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;

    expect(holyHero.dps.dps).toBe(baseHero.dps.dps);
  });
});

describe('useSimulation KB config', () => {
  it('KB reduces DPS vs baseline', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: kb } = renderHook(() =>
      useSimulation(undefined, undefined, undefined, {
        bossAttackInterval: 1.5,
        bossAccuracy: 250,
      })
    );

    const baseHero = baseline.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;
    const kbHero = kb.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;

    expect(kbHero.dps.dps).toBeLessThan(baseHero.dps.dps);
  });
});

describe('useSimulation target count', () => {
  it('targetCount > 1 adds a Training scenario', () => {
    const { result } = renderHook(() =>
      useSimulation(6)
    );

    const scenarios = new Set(result.current.results.map(r => r.scenario));
    expect(scenarios.has('Baseline')).toBe(true);
    expect(scenarios.has('Training (6 mobs)')).toBe(true);
  });

  it('AoE skills scale up in Training scenario', () => {
    const { result } = renderHook(() =>
      useSimulation(6)
    );

    const baselineHero = result.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high' && r.scenario === 'Baseline'
    )!;
    const trainingHero = result.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high' && r.scenario === 'Training (6 mobs)'
    )!;

    // Hero Brandish has maxTargets: 3, so 3x even with 6 targets
    expect(trainingHero.dps.dps).toBeCloseTo(baselineHero.dps.dps * 3, 0);
  });

  it('targetCount of 1 does not add a Training scenario', () => {
    const { result } = renderHook(() =>
      useSimulation(1)
    );

    const scenarios = new Set(result.current.results.map(r => r.scenario));
    expect(scenarios.size).toBe(1);
    expect(scenarios.has('Baseline')).toBe(true);
  });
});

describe('useSimulation CGS override', () => {
  it('increasing CGS boosts WATK-dependent DPS', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: boosted } = renderHook(() =>
      useSimulation(undefined, undefined, undefined, undefined, {
        tier: 'high',
        values: { cape: 22, glove: 22, shoe: 18 },
      })
    );

    const baseHero = baseline.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;
    const boostedHero = boosted.current.results.find(
      r => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.tier === 'high'
    )!;

    // Default high CGS = 18+20+16 = 54, override = 22+22+18 = 62, delta +8 WATK
    expect(boostedHero.dps.dps).toBeGreaterThan(baseHero.dps.dps);
  });

  it('CGS override does not affect mage classes', () => {
    const { result: baseline } = renderHook(() => useSimulation());
    const { result: boosted } = renderHook(() =>
      useSimulation(undefined, undefined, undefined, undefined, {
        tier: 'high',
        values: { cape: 22, glove: 22, shoe: 18 },
      })
    );

    const baseMage = baseline.current.results.find(
      r => r.className === 'Archmage I/L' && r.skillName === 'Chain Lightning' && r.tier === 'high'
    )!;
    const boostedMage = boosted.current.results.find(
      r => r.className === 'Archmage I/L' && r.skillName === 'Chain Lightning' && r.tier === 'high'
    )!;

    expect(boostedMage.dps.dps).toBe(baseMage.dps.dps);
  });
});
