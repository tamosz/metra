import { describe, it, expect } from 'vitest';
import type { SimulationFiltersContextType } from '../context/SimulationFiltersContext.js';
import { FILTER_DEFAULTS } from './filter-defaults.js';
import { CGS_DEFAULTS } from './cgs.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';
import { buildFilterState, stripCgs, filterStatesEqual, type PresetFilterState } from './filter-state.js';

const noop = () => {};

function makeControls(overrides: Partial<SimulationFiltersContextType> = {}): SimulationFiltersContextType {
  const tier = (overrides.selectedTier ?? FILTER_DEFAULTS.tier);
  return {
    selectedTier: tier,
    setSelectedTier: noop,
    targetCount: FILTER_DEFAULTS.targetCount,
    setTargetCount: noop,
    capEnabled: FILTER_DEFAULTS.capEnabled,
    setCapEnabled: noop,
    kbEnabled: FILTER_DEFAULTS.kbEnabled,
    setKbEnabled: noop,
    bossAttackInterval: FILTER_DEFAULTS.bossAttackInterval,
    setBossAttackInterval: noop,
    bossAccuracy: FILTER_DEFAULTS.bossAccuracy,
    setBossAccuracy: noop,
    breakdownEnabled: FILTER_DEFAULTS.breakdownEnabled,
    setBreakdownEnabled: noop,
    buffOverrides: {},
    setBuffOverrides: noop,
    elementModifiers: {},
    setElementModifiers: noop,
    cgsValues: { ...(CGS_DEFAULTS[tier] ?? CGS_DEFAULTS.perfect) },
    setCgsValues: noop,
    activeGroups: new Set(DEFAULT_SKILL_GROUPS),
    setActiveGroups: noop,
    toggleGroup: noop,
    kbConfig: undefined,
    efficiencyOverrides: {},
    setEfficiencyOverrides: noop,
    resetFilters: noop,
    ...overrides,
  };
}

describe('buildFilterState', () => {
  it('returns empty object for all defaults', () => {
    const controls = makeControls();
    expect(buildFilterState(controls)).toEqual({});
  });

  it('captures non-default tier', () => {
    const controls = makeControls({ selectedTier: 'low' });
    expect(buildFilterState(controls)).toEqual({ tier: 'low' });
  });

  it('captures buff overrides', () => {
    const controls = makeControls({ buffOverrides: { sharpEyes: false } });
    expect(buildFilterState(controls)).toEqual({ buffs: { sharpEyes: false } });
  });

  it('captures element modifiers', () => {
    const controls = makeControls({ elementModifiers: { Holy: 1.5 } });
    expect(buildFilterState(controls)).toEqual({ elements: { Holy: 1.5 } });
  });

  it('captures target count', () => {
    const controls = makeControls({ targetCount: 6 });
    expect(buildFilterState(controls)).toEqual({ targets: 6 });
  });

  it('captures KB enabled with default params', () => {
    const controls = makeControls({ kbEnabled: true });
    expect(buildFilterState(controls)).toEqual({ kb: {} });
  });

  it('captures KB with custom params', () => {
    const controls = makeControls({
      kbEnabled: true,
      bossAttackInterval: 2.0,
      bossAccuracy: 270,
    });
    expect(buildFilterState(controls)).toEqual({ kb: { interval: 2.0, accuracy: 270 } });
  });

  it('captures non-default groups', () => {
    const controls = makeControls({ activeGroups: new Set(['warriors', 'mages']) as never });
    expect(buildFilterState(controls)).toEqual({ groups: ['mages', 'warriors'] });
  });

  it('captures cap disabled', () => {
    const controls = makeControls({ capEnabled: false });
    expect(buildFilterState(controls)).toEqual({ cap: false });
  });

  it('captures breakdown enabled', () => {
    const controls = makeControls({ breakdownEnabled: true });
    expect(buildFilterState(controls)).toEqual({ breakdown: true });
  });

  it('captures CGS overrides', () => {
    const controls = makeControls({ cgsValues: { cape: 20, glove: 20, shoe: 20 } });
    expect(buildFilterState(controls)).toEqual({ cgs: { cape: 20, glove: 20, shoe: 20 } });
  });
});

describe('stripCgs', () => {
  it('removes cgs field', () => {
    const state = { tier: 'low', cgs: { cape: 20, glove: 20, shoe: 20 } };
    expect(stripCgs(state)).toEqual({ tier: 'low' });
  });

  it('returns same shape if no cgs', () => {
    const state = { tier: 'high', targets: 3 };
    expect(stripCgs(state)).toEqual({ tier: 'high', targets: 3 });
  });

  it('returns empty object for empty input', () => {
    expect(stripCgs({})).toEqual({});
  });
});

describe('filterStatesEqual', () => {
  it('empty states are equal', () => {
    expect(filterStatesEqual({}, {})).toBe(true);
  });

  it('detects tier difference', () => {
    expect(filterStatesEqual({ tier: 'low' }, { tier: 'high' })).toBe(false);
  });

  it('detects missing vs present field', () => {
    expect(filterStatesEqual({ tier: 'low' }, {})).toBe(false);
    expect(filterStatesEqual({}, { tier: 'low' })).toBe(false);
  });

  it('compares buffs deeply', () => {
    expect(filterStatesEqual(
      { buffs: { sharpEyes: false } },
      { buffs: { sharpEyes: false } },
    )).toBe(true);

    expect(filterStatesEqual(
      { buffs: { sharpEyes: false } },
      { buffs: { sharpEyes: true } },
    )).toBe(false);
  });

  it('compares groups with sorted order', () => {
    expect(filterStatesEqual(
      { groups: ['warriors', 'mages'] },
      { groups: ['mages', 'warriors'] },
    )).toBe(true);

    expect(filterStatesEqual(
      { groups: ['warriors'] },
      { groups: ['mages'] },
    )).toBe(false);
  });

  it('compares complex states', () => {
    const a: PresetFilterState = {
      tier: 'high',
      buffs: { sharpEyes: false },
      kb: { interval: 2.0 },
      targets: 3,
      cap: false,
      groups: ['warriors', 'pirates'],
      breakdown: true,
    };
    const b: PresetFilterState = {
      tier: 'high',
      buffs: { sharpEyes: false },
      kb: { interval: 2.0 },
      targets: 3,
      cap: false,
      groups: ['pirates', 'warriors'],
      breakdown: true,
    };
    expect(filterStatesEqual(a, b)).toBe(true);

    expect(filterStatesEqual(a, { ...b, tier: 'low' })).toBe(false);
  });

  it('handles KB comparison', () => {
    expect(filterStatesEqual({ kb: {} }, { kb: {} })).toBe(true);
    expect(filterStatesEqual({ kb: { interval: 2 } }, { kb: { interval: 3 } })).toBe(false);
    expect(filterStatesEqual({ kb: {} }, {})).toBe(false);
  });

  it('handles elements comparison', () => {
    expect(filterStatesEqual(
      { elements: { Holy: 1.5 } },
      { elements: { Holy: 1.5 } },
    )).toBe(true);
    expect(filterStatesEqual(
      { elements: { Holy: 1.5 } },
      { elements: { Holy: 0.5 } },
    )).toBe(false);
  });
});
