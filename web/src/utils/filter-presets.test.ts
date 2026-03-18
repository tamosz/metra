import { describe, it, expect, beforeEach } from 'vitest';
import {
  BUILTIN_PRESETS,
  loadUserPresets,
  saveUserPresets,
  loadDismissedIds,
  saveDismissedIds,
  mergePresets,
  type FilterPreset,
} from './filter-presets.js';

const USER_KEY = 'royals-sim:filter-presets';
const DISMISSED_KEY = 'royals-sim:filter-presets:dismissed';

describe('BUILTIN_PRESETS', () => {
  it('has 3 presets', () => {
    expect(BUILTIN_PRESETS).toHaveLength(3);
  });

  it('all have builtIn: true', () => {
    for (const preset of BUILTIN_PRESETS) {
      expect(preset.builtIn).toBe(true);
    }
  });

  it('all have IDs with builtin- prefix', () => {
    for (const preset of BUILTIN_PRESETS) {
      expect(preset.id).toMatch(/^builtin-/);
    }
  });

  it('Bossing has empty state', () => {
    const bossing = BUILTIN_PRESETS.find((p) => p.name === 'Bossing');
    expect(bossing).toBeDefined();
    expect(bossing!.state).toEqual({});
  });

  it('Training has 15 targets and multi-target group', () => {
    const training = BUILTIN_PRESETS.find((p) => p.name === 'Training');
    expect(training).toBeDefined();
    expect(training!.state).toEqual({ targets: 15, groups: ['main', 'multi-target'] });
  });

  it('Unbuffed disables party buffs', () => {
    const unbuffed = BUILTIN_PRESETS.find((p) => p.name === 'Unbuffed');
    expect(unbuffed).toBeDefined();
    expect(unbuffed!.state).toEqual({
      buffs: { sharpEyes: false, echoActive: false, speedInfusion: false, mwLevel: 0, attackPotion: 0 },
    });
  });
});

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  });

  it('loadUserPresets returns [] when empty', () => {
    expect(loadUserPresets()).toEqual([]);
  });

  it('saveUserPresets roundtrips', () => {
    const presets: FilterPreset[] = [
      { id: 'user-1', name: 'My Preset', state: { targets: 6 }, builtIn: false },
    ];
    saveUserPresets(presets);
    expect(loadUserPresets()).toEqual(presets);
  });

  it('loadDismissedIds returns empty Set when empty', () => {
    expect(loadDismissedIds()).toEqual(new Set());
  });

  it('saveDismissedIds roundtrips', () => {
    const ids = new Set(['builtin-bossing', 'builtin-training']);
    saveDismissedIds(ids);
    expect(loadDismissedIds()).toEqual(ids);
  });
});

describe('mergePresets', () => {
  it('returns all built-ins when no user presets and no dismissals', () => {
    const result = mergePresets([], new Set());
    expect(result).toEqual(BUILTIN_PRESETS);
  });

  it('excludes dismissed built-ins', () => {
    const result = mergePresets([], new Set(['builtin-bossing']));
    expect(result).toHaveLength(2);
    expect(result.find((p) => p.id === 'builtin-bossing')).toBeUndefined();
    expect(result.find((p) => p.id === 'builtin-training')).toBeDefined();
    expect(result.find((p) => p.id === 'builtin-unbuffed')).toBeDefined();
  });

  it('appends user presets after built-ins', () => {
    const userPresets: FilterPreset[] = [
      { id: 'user-1', name: 'Custom', state: { targets: 3 }, builtIn: false },
    ];
    const result = mergePresets(userPresets, new Set());
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe('builtin-bossing');
    expect(result[1].id).toBe('builtin-training');
    expect(result[2].id).toBe('builtin-unbuffed');
    expect(result[3].id).toBe('user-1');
  });
});
