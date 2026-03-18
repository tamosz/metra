# Saved Filter Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add named filter presets ("Bossing", "Training", "Unbuffed") with one-click switching, custom preset save/delete, and dirty-state tracking to the dashboard.

**Architecture:** New `useFilterPresets` hook manages preset CRUD via localStorage (following `useBuilds` pattern). New `FilterPresets` component renders a preset row above the existing filter bar. `buildFilterState()` is extracted from `useFilterPermalink.ts` into a shared util so both the permalink hook and the presets hook can use it.

**Tech Stack:** React hooks, localStorage, Vitest, existing `FilterState` type from `filter-url.ts`.

**Spec:** `docs/superpowers/specs/2026-03-18-saved-filter-presets-design.md`

---

### Task 1: Extract `buildFilterState` into shared util

**Files:**
- Create: `web/src/utils/filter-state.ts`
- Create: `web/src/utils/filter-state.test.ts`
- Modify: `web/src/hooks/useFilterPermalink.ts`

This task moves `buildFilterState()` and `setsEqual()` out of `useFilterPermalink.ts` into a shared module, adds a `stripCgs()` helper and `filterStatesEqual()` comparator, and defines the `PresetFilterState` type. No behavior change to the permalink hook.

- [ ] **Step 1: Write tests for the extracted utilities**

```typescript
// web/src/utils/filter-state.test.ts
import { describe, it, expect } from 'vitest';
import { buildFilterState, filterStatesEqual, stripCgs } from './filter-state.js';
import type { SimulationControlsContextType } from '../context/SimulationControlsContext.js';
import { FILTER_DEFAULTS } from './filter-defaults.js';
import { CGS_DEFAULTS } from './cgs.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';

function makeControls(overrides: Partial<SimulationControlsContextType> = {}): SimulationControlsContextType {
  return {
    selectedTier: FILTER_DEFAULTS.tier,
    targetCount: FILTER_DEFAULTS.targetCount,
    capEnabled: FILTER_DEFAULTS.capEnabled,
    kbEnabled: FILTER_DEFAULTS.kbEnabled,
    bossAttackInterval: FILTER_DEFAULTS.bossAttackInterval,
    bossAccuracy: FILTER_DEFAULTS.bossAccuracy,
    breakdownEnabled: FILTER_DEFAULTS.breakdownEnabled,
    buffOverrides: {},
    elementModifiers: {},
    cgsValues: { ...CGS_DEFAULTS.perfect },
    activeGroups: new Set(DEFAULT_SKILL_GROUPS),
    // stubs for setters and other fields not used by buildFilterState
    setSelectedTier: () => {},
    setTargetCount: () => {},
    setCapEnabled: () => {},
    setKbEnabled: () => {},
    setBossAttackInterval: () => {},
    setBossAccuracy: () => {},
    setBreakdownEnabled: () => {},
    setBuffOverrides: () => {},
    setElementModifiers: () => {},
    setCgsValues: () => {},
    setActiveGroups: () => {},
    toggleGroup: () => {},
    resetControls: () => {},
    kbConfig: undefined,
    efficiencyOverrides: {},
    setEfficiencyOverrides: () => {},
    editEnabled: false,
    setEditEnabled: () => {},
    editChanges: [],
    addEditChange: () => {},
    removeEditChange: () => {},
    updateEditChange: () => {},
    clearEditChanges: () => {},
    editMeta: { name: '', author: '' },
    setEditMeta: () => {},
    loadEditState: () => {},
    ...overrides,
  } as SimulationControlsContextType;
}

describe('buildFilterState', () => {
  it('returns empty object for all defaults', () => {
    const state = buildFilterState(makeControls());
    expect(state).toEqual({});
  });

  it('captures non-default tier', () => {
    const state = buildFilterState(makeControls({ selectedTier: 'low' }));
    expect(state.tier).toBe('low');
  });

  it('captures buff overrides', () => {
    const state = buildFilterState(makeControls({ buffOverrides: { sharpEyes: false } }));
    expect(state.buffs).toEqual({ sharpEyes: false });
  });

  it('captures target count', () => {
    const state = buildFilterState(makeControls({ targetCount: 15 }));
    expect(state.targets).toBe(15);
  });

  it('captures KB enabled with params', () => {
    const state = buildFilterState(makeControls({ kbEnabled: true, bossAttackInterval: 2.0, bossAccuracy: 300 }));
    expect(state.kb).toEqual({ interval: 2.0, accuracy: 300 });
  });

  it('captures non-default groups', () => {
    const state = buildFilterState(makeControls({ activeGroups: new Set(['main', 'multi-target']) as any }));
    expect(state.groups).toEqual(['main', 'multi-target']);
  });
});

describe('stripCgs', () => {
  it('removes cgs field', () => {
    expect(stripCgs({ tier: 'low', cgs: { cape: 10, glove: 10, shoe: 10 } })).toEqual({ tier: 'low' });
  });

  it('returns same object if no cgs', () => {
    const state = { tier: 'low' };
    expect(stripCgs(state)).toEqual(state);
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
  });

  it('compares buff overrides deeply', () => {
    expect(filterStatesEqual(
      { buffs: { sharpEyes: false } },
      { buffs: { sharpEyes: false } },
    )).toBe(true);
    expect(filterStatesEqual(
      { buffs: { sharpEyes: false } },
      { buffs: { sharpEyes: false, echoActive: false } },
    )).toBe(false);
  });

  it('compares groups as sorted arrays', () => {
    expect(filterStatesEqual(
      { groups: ['main', 'warriors'] },
      { groups: ['warriors', 'main'] },
    )).toBe(true);
  });

  it('compares complex states', () => {
    const a = { tier: 'high', buffs: { sharpEyes: false }, targets: 15 };
    const b = { tier: 'high', buffs: { sharpEyes: false }, targets: 15 };
    expect(filterStatesEqual(a, b)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd web && npx vitest run src/utils/filter-state.test.ts`
Expected: FAIL — module `./filter-state.js` does not exist.

- [ ] **Step 3: Implement `filter-state.ts`**

```typescript
// web/src/utils/filter-state.ts
import type { SimulationControlsContextType } from '../context/SimulationControlsContext.js';
import type { FilterState } from './filter-url.js';
import { FILTER_DEFAULTS } from './filter-defaults.js';
import { CGS_DEFAULTS } from './cgs.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';

export type PresetFilterState = Omit<FilterState, 'cgs'>;

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function buildFilterState(controls: SimulationControlsContextType): FilterState {
  const state: FilterState = {};

  if (controls.selectedTier !== FILTER_DEFAULTS.tier) {
    state.tier = controls.selectedTier;
  }

  if (Object.keys(controls.buffOverrides).length > 0) {
    state.buffs = controls.buffOverrides;
  }

  if (Object.keys(controls.elementModifiers).length > 0) {
    state.elements = controls.elementModifiers;
  }

  if (controls.kbEnabled) {
    const kb: FilterState['kb'] = {};
    if (controls.bossAttackInterval !== FILTER_DEFAULTS.bossAttackInterval) {
      kb.interval = controls.bossAttackInterval;
    }
    if (controls.bossAccuracy !== FILTER_DEFAULTS.bossAccuracy) {
      kb.accuracy = controls.bossAccuracy;
    }
    state.kb = kb;
  }

  if (controls.targetCount !== FILTER_DEFAULTS.targetCount) {
    state.targets = controls.targetCount;
  }

  if (controls.capEnabled !== FILTER_DEFAULTS.capEnabled) {
    state.cap = controls.capEnabled;
  }

  const tierDefaults = CGS_DEFAULTS[controls.selectedTier] ?? CGS_DEFAULTS.perfect;
  if (
    controls.cgsValues.cape !== tierDefaults.cape ||
    controls.cgsValues.glove !== tierDefaults.glove ||
    controls.cgsValues.shoe !== tierDefaults.shoe
  ) {
    state.cgs = controls.cgsValues;
  }

  const defaultGroups = new Set<string>(DEFAULT_SKILL_GROUPS);
  if (!setsEqual(controls.activeGroups as Set<string>, defaultGroups)) {
    state.groups = [...controls.activeGroups].sort();
  }

  if (controls.breakdownEnabled !== FILTER_DEFAULTS.breakdownEnabled) {
    state.breakdown = controls.breakdownEnabled;
  }

  return state;
}

export function stripCgs(state: FilterState): PresetFilterState {
  const { cgs, ...rest } = state;
  return rest;
}

export function filterStatesEqual(a: PresetFilterState, b: PresetFilterState): boolean {
  const aKeys = Object.keys(a) as (keyof PresetFilterState)[];
  const bKeys = Object.keys(b) as (keyof PresetFilterState)[];
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!(key in b)) return false;
    const va = a[key];
    const vb = b[key];

    if (key === 'groups') {
      const ga = [...(va as string[])].sort();
      const gb = [...(vb as string[])].sort();
      if (ga.length !== gb.length || ga.some((v, i) => v !== gb[i])) return false;
    } else if (typeof va === 'object' && va !== null) {
      if (JSON.stringify(va) !== JSON.stringify(vb)) return false;
    } else {
      if (va !== vb) return false;
    }
  }

  return true;
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd web && npx vitest run src/utils/filter-state.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Update `useFilterPermalink.ts` to import from `filter-state.ts`**

Replace the local `setsEqual` and `buildFilterState` functions in `web/src/hooks/useFilterPermalink.ts` with imports:

```typescript
// web/src/hooks/useFilterPermalink.ts
import { useEffect, useRef } from 'react';
import type { SimulationControlsContextType } from '../context/SimulationControlsContext.js';
import { type FilterState, setFilterInUrl, clearFilterFromUrl } from '../utils/filter-url.js';
import { buildFilterState } from '../utils/filter-state.js';

export function useFilterPermalink(controls: SimulationControlsContextType): void {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const state = buildFilterState(controls);
    if (Object.keys(state).length === 0) {
      clearFilterFromUrl();
    } else {
      setFilterInUrl(state);
    }
  }, [
    controls.selectedTier,
    controls.buffOverrides,
    controls.elementModifiers,
    controls.kbEnabled,
    controls.bossAttackInterval,
    controls.bossAccuracy,
    controls.targetCount,
    controls.capEnabled,
    controls.cgsValues,
    controls.activeGroups,
    controls.breakdownEnabled,
  ]);
}
```

- [ ] **Step 6: Run full web test suite to verify no regressions**

Run: `cd web && npx vitest run`
Expected: all tests PASS. The permalink hook behavior is unchanged.

- [ ] **Step 7: Commit**

```bash
git add web/src/utils/filter-state.ts web/src/utils/filter-state.test.ts web/src/hooks/useFilterPermalink.ts
git commit -m "extract buildFilterState into shared util for preset reuse"
```

---

### Task 2: Add `FilterPreset` type and built-in presets

**Files:**
- Create: `web/src/utils/filter-presets.ts`
- Create: `web/src/utils/filter-presets.test.ts`

Defines the `FilterPreset` type, the `BUILTIN_PRESETS` constant, and localStorage helpers for user presets and dismissed built-in presets.

- [ ] **Step 1: Write tests for preset types and localStorage helpers**

```typescript
// web/src/utils/filter-presets.test.ts
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

  it('all have builtIn: true and ids starting with builtin-', () => {
    for (const p of BUILTIN_PRESETS) {
      expect(p.builtIn).toBe(true);
      expect(p.id).toMatch(/^builtin-/);
    }
  });

  it('Bossing preset has empty state (all defaults)', () => {
    const bossing = BUILTIN_PRESETS.find((p) => p.id === 'builtin-bossing')!;
    expect(bossing.state).toEqual({});
  });

  it('Training preset has 15 targets and multi-target group', () => {
    const training = BUILTIN_PRESETS.find((p) => p.id === 'builtin-training')!;
    expect(training.state.targets).toBe(15);
    expect(training.state.groups).toEqual(['main', 'multi-target']);
  });

  it('Unbuffed preset disables party buffs', () => {
    const unbuffed = BUILTIN_PRESETS.find((p) => p.id === 'builtin-unbuffed')!;
    expect(unbuffed.state.buffs).toEqual({
      sharpEyes: false,
      echoActive: false,
      speedInfusion: false,
      mwLevel: 0,
      attackPotion: 0,
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

  it('saveUserPresets persists and loads back', () => {
    const presets: FilterPreset[] = [
      { id: 'preset-abc', name: 'Custom', state: { tier: 'low' }, builtIn: false },
    ];
    saveUserPresets(presets);
    expect(loadUserPresets()).toEqual(presets);
  });

  it('loadDismissedIds returns empty set when empty', () => {
    expect(loadDismissedIds()).toEqual(new Set());
  });

  it('saveDismissedIds persists and loads back', () => {
    saveDismissedIds(new Set(['builtin-bossing']));
    expect(loadDismissedIds()).toEqual(new Set(['builtin-bossing']));
  });
});

describe('mergePresets', () => {
  it('returns all built-ins when no user presets and no dismissals', () => {
    const result = mergePresets([], new Set());
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('builtin-bossing');
  });

  it('excludes dismissed built-ins', () => {
    const result = mergePresets([], new Set(['builtin-bossing']));
    expect(result.find((p) => p.id === 'builtin-bossing')).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it('appends user presets after built-ins', () => {
    const user: FilterPreset[] = [
      { id: 'preset-abc', name: 'My preset', state: { tier: 'high' }, builtIn: false },
    ];
    const result = mergePresets(user, new Set());
    expect(result).toHaveLength(4);
    expect(result[3].id).toBe('preset-abc');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd web && npx vitest run src/utils/filter-presets.test.ts`
Expected: FAIL — module `./filter-presets.js` does not exist.

- [ ] **Step 3: Implement `filter-presets.ts`**

```typescript
// web/src/utils/filter-presets.ts
import type { PresetFilterState } from './filter-state.js';

export interface FilterPreset {
  id: string;
  name: string;
  state: PresetFilterState;
  builtIn: boolean;
}

export const BUILTIN_PRESETS: FilterPreset[] = [
  { id: 'builtin-bossing', name: 'Bossing', state: {}, builtIn: true },
  { id: 'builtin-training', name: 'Training', state: { targets: 15, groups: ['main', 'multi-target'] }, builtIn: true },
  {
    id: 'builtin-unbuffed',
    name: 'Unbuffed',
    state: {
      buffs: { sharpEyes: false, echoActive: false, speedInfusion: false, mwLevel: 0, attackPotion: 0 },
    },
    builtIn: true,
  },
];

const USER_KEY = 'royals-sim:filter-presets';
const DISMISSED_KEY = 'royals-sim:filter-presets:dismissed';

export function loadUserPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FilterPreset[];
  } catch {
    return [];
  }
}

export function saveUserPresets(presets: FilterPreset[]): void {
  localStorage.setItem(USER_KEY, JSON.stringify(presets));
}

export function loadDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveDismissedIds(ids: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export function mergePresets(userPresets: FilterPreset[], dismissedIds: Set<string>): FilterPreset[] {
  const builtIns = BUILTIN_PRESETS.filter((p) => !dismissedIds.has(p.id));
  return [...builtIns, ...userPresets];
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd web && npx vitest run src/utils/filter-presets.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/utils/filter-presets.ts web/src/utils/filter-presets.test.ts
git commit -m "add FilterPreset type, built-in presets, and localStorage helpers"
```

---

### Task 3: Implement `useFilterPresets` hook

**Files:**
- Create: `web/src/hooks/useFilterPresets.ts`
- Create: `web/src/hooks/useFilterPresets.test.ts`

The hook manages preset CRUD, active preset tracking, dirty detection, and apply/revert. It consumes `SimulationControlsContext` and uses the shared `buildFilterState` and `filterStatesEqual` utilities.

- [ ] **Step 1: Write tests for the hook**

The hook needs the `SimulationControlsContext` provider to work. Follow the `useBuilds.test.ts` pattern but wrap in provider. Since the hook calls context setters on `apply()`, tests need a real provider to verify state changes.

```typescript
// web/src/hooks/useFilterPresets.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { useFilterPresets } from './useFilterPresets.js';
import { SimulationControlsProvider, useSimulationControls } from '../context/SimulationControlsContext.js';

const USER_KEY = 'royals-sim:filter-presets';
const DISMISSED_KEY = 'royals-sim:filter-presets:dismissed';

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SimulationControlsProvider, null, children);
}

describe('useFilterPresets', () => {
  beforeEach(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  });

  it('starts with 3 built-in presets and no active preset', () => {
    const { result } = renderHook(() => useFilterPresets(), { wrapper });
    expect(result.current.presets).toHaveLength(3);
    expect(result.current.activePresetId).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('apply sets active preset and is not dirty', () => {
    const { result } = renderHook(() => useFilterPresets(), { wrapper });
    act(() => {
      result.current.apply('builtin-bossing');
    });
    expect(result.current.activePresetId).toBe('builtin-bossing');
    expect(result.current.isDirty).toBe(false);
  });

  it('apply training preset sets target count to 15', () => {
    const { result } = renderHook(() => ({
      presets: useFilterPresets(),
      controls: useSimulationControls(),
    }), { wrapper });
    act(() => {
      result.current.presets.apply('builtin-training');
    });
    expect(result.current.controls.targetCount).toBe(15);
  });

  it('becomes dirty when controls change after apply', () => {
    const { result } = renderHook(() => ({
      presets: useFilterPresets(),
      controls: useSimulationControls(),
    }), { wrapper });
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    expect(result.current.presets.isDirty).toBe(false);
    act(() => {
      result.current.controls.setTargetCount(6);
    });
    expect(result.current.presets.isDirty).toBe(true);
  });

  it('revert clears dirty state', () => {
    const { result } = renderHook(() => ({
      presets: useFilterPresets(),
      controls: useSimulationControls(),
    }), { wrapper });
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    act(() => {
      result.current.controls.setTargetCount(6);
    });
    expect(result.current.presets.isDirty).toBe(true);
    act(() => {
      result.current.presets.revert();
    });
    expect(result.current.presets.isDirty).toBe(false);
    expect(result.current.controls.targetCount).toBe(1);
  });

  it('save creates a new user preset and sets it active', () => {
    const { result } = renderHook(() => ({
      presets: useFilterPresets(),
      controls: useSimulationControls(),
    }), { wrapper });
    act(() => {
      result.current.controls.setTargetCount(6);
    });
    act(() => {
      result.current.presets.save('My preset');
    });
    expect(result.current.presets.presets).toHaveLength(4);
    const custom = result.current.presets.presets[3];
    expect(custom.name).toBe('My preset');
    expect(custom.builtIn).toBe(false);
    expect(custom.state.targets).toBe(6);
    expect(result.current.presets.activePresetId).toBe(custom.id);
  });

  it('save persists to localStorage', () => {
    const { result } = renderHook(() => useFilterPresets(), { wrapper });
    act(() => {
      result.current.save('Persisted');
    });
    const stored = JSON.parse(localStorage.getItem(USER_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persisted');
  });

  it('remove deletes a user preset', () => {
    const { result } = renderHook(() => useFilterPresets(), { wrapper });
    act(() => {
      result.current.save('Temp');
    });
    const id = result.current.presets[3].id;
    act(() => {
      result.current.remove(id);
    });
    expect(result.current.presets).toHaveLength(3);
  });

  it('remove dismisses a built-in preset', () => {
    const { result } = renderHook(() => useFilterPresets(), { wrapper });
    act(() => {
      result.current.remove('builtin-bossing');
    });
    expect(result.current.presets).toHaveLength(2);
    expect(result.current.presets.find((p) => p.id === 'builtin-bossing')).toBeUndefined();
    expect(loadDismissedCheck()).toContain('builtin-bossing');
  });

  it('remove clears activePresetId if removing the active preset', () => {
    const { result } = renderHook(() => useFilterPresets(), { wrapper });
    act(() => {
      result.current.apply('builtin-bossing');
    });
    act(() => {
      result.current.remove('builtin-bossing');
    });
    expect(result.current.activePresetId).toBeNull();
  });

  it('CGS changes do not affect dirty state', () => {
    const { result } = renderHook(() => ({
      presets: useFilterPresets(),
      controls: useSimulationControls(),
    }), { wrapper });
    act(() => {
      result.current.presets.apply('builtin-bossing');
    });
    act(() => {
      result.current.controls.setCgsValues({ cape: 99, glove: 99, shoe: 99 });
    });
    expect(result.current.presets.isDirty).toBe(false);
  });
});

function loadDismissedCheck(): string[] {
  try {
    return JSON.parse(localStorage.getItem('royals-sim:filter-presets:dismissed')!) as string[];
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd web && npx vitest run src/hooks/useFilterPresets.test.ts`
Expected: FAIL — module `./useFilterPresets.js` does not exist.

- [ ] **Step 3: Implement the hook**

```typescript
// web/src/hooks/useFilterPresets.ts
import { useState, useCallback, useMemo } from 'react';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { buildFilterState, stripCgs, filterStatesEqual, type PresetFilterState } from '../utils/filter-state.js';
import {
  type FilterPreset,
  loadUserPresets,
  saveUserPresets,
  loadDismissedIds,
  saveDismissedIds,
  mergePresets,
} from '../utils/filter-presets.js';
import { FILTER_DEFAULTS, defaultActiveGroups, defaultBuffOverrides, defaultElementModifiers } from '../utils/filter-defaults.js';
import type { SkillGroupId } from '../utils/skill-groups.js';

export interface FilterPresetsState {
  presets: FilterPreset[];
  activePresetId: string | null;
  isDirty: boolean;
  save: (name: string) => void;
  remove: (id: string) => void;
  apply: (id: string) => void;
  revert: () => void;
}

export function useFilterPresets(): FilterPresetsState {
  const controls = useSimulationControls();
  const [userPresets, setUserPresets] = useState<FilterPreset[]>(() => loadUserPresets());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const presets = useMemo(
    () => mergePresets(userPresets, dismissedIds),
    [userPresets, dismissedIds],
  );

  const activePreset = useMemo(
    () => (activePresetId ? presets.find((p) => p.id === activePresetId) ?? null : null),
    [activePresetId, presets],
  );

  const currentState = useMemo(
    () => stripCgs(buildFilterState(controls)),
    [
      controls.selectedTier,
      controls.buffOverrides,
      controls.elementModifiers,
      controls.kbEnabled,
      controls.bossAttackInterval,
      controls.bossAccuracy,
      controls.targetCount,
      controls.capEnabled,
      controls.activeGroups,
      controls.breakdownEnabled,
    ],
  );

  const isDirty = useMemo(
    () => (activePreset ? !filterStatesEqual(currentState, activePreset.state) : false),
    [activePreset, currentState],
  );

  const applyState = useCallback((state: PresetFilterState) => {
    // Reset preset-managed controls to defaults
    controls.setSelectedTier(FILTER_DEFAULTS.tier);
    controls.setBuffOverrides(defaultBuffOverrides());
    controls.setElementModifiers(defaultElementModifiers());
    controls.setKbEnabled(FILTER_DEFAULTS.kbEnabled);
    controls.setBossAttackInterval(FILTER_DEFAULTS.bossAttackInterval);
    controls.setBossAccuracy(FILTER_DEFAULTS.bossAccuracy);
    controls.setTargetCount(FILTER_DEFAULTS.targetCount);
    controls.setCapEnabled(FILTER_DEFAULTS.capEnabled);
    controls.setActiveGroups(defaultActiveGroups());
    controls.setBreakdownEnabled(FILTER_DEFAULTS.breakdownEnabled);

    // Overlay preset values
    if (state.tier !== undefined) controls.setSelectedTier(state.tier);
    if (state.buffs !== undefined) controls.setBuffOverrides(state.buffs);
    if (state.elements !== undefined) controls.setElementModifiers(state.elements);
    if (state.kb !== undefined) {
      controls.setKbEnabled(true);
      if (state.kb.interval !== undefined) controls.setBossAttackInterval(state.kb.interval);
      if (state.kb.accuracy !== undefined) controls.setBossAccuracy(state.kb.accuracy);
    }
    if (state.targets !== undefined) controls.setTargetCount(state.targets);
    if (state.cap !== undefined) controls.setCapEnabled(state.cap);
    if (state.groups !== undefined) controls.setActiveGroups(new Set(state.groups as SkillGroupId[]));
    if (state.breakdown !== undefined) controls.setBreakdownEnabled(state.breakdown);
  }, [controls]);

  const apply = useCallback((id: string) => {
    const preset = mergePresets(userPresets, dismissedIds).find((p) => p.id === id);
    if (!preset) return;
    setActivePresetId(id);
    applyState(preset.state);
  }, [userPresets, dismissedIds, applyState]);

  const revert = useCallback(() => {
    if (activePreset) {
      applyState(activePreset.state);
    }
  }, [activePreset, applyState]);

  const save = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: 'preset-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      state: currentState,
      builtIn: false,
    };
    const next = [...loadUserPresets(), preset];
    setUserPresets(next);
    saveUserPresets(next);
    setActivePresetId(preset.id);
  }, [currentState]);

  const remove = useCallback((id: string) => {
    if (id.startsWith('builtin-')) {
      const next = new Set(loadDismissedIds());
      next.add(id);
      setDismissedIds(next);
      saveDismissedIds(next);
    } else {
      const next = loadUserPresets().filter((p) => p.id !== id);
      setUserPresets(next);
      saveUserPresets(next);
    }
    setActivePresetId((prev) => (prev === id ? null : prev));
  }, []);

  return { presets, activePresetId, isDirty, save, remove, apply, revert };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd web && npx vitest run src/hooks/useFilterPresets.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Run full web test suite**

Run: `cd web && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add web/src/hooks/useFilterPresets.ts web/src/hooks/useFilterPresets.test.ts
git commit -m "add useFilterPresets hook with CRUD, apply, revert, dirty detection"
```

---

### Task 4: Build `FilterPresets` component

**Files:**
- Create: `web/src/components/FilterPresets.tsx`

Renders the preset row above the filter bar. Handles click interactions (apply/deselect/revert), save flow (inline input), and delete buttons.

- [ ] **Step 1: Add `deselect` to the hook interface**

The component needs to deselect the active preset. Update `web/src/hooks/useFilterPresets.ts`:

Add to the `FilterPresetsState` interface:
```typescript
deselect: () => void;
```

Add implementation:
```typescript
const deselect = useCallback(() => {
  setActivePresetId(null);
}, []);
```

Update the return:
```typescript
return { presets, activePresetId, isDirty, save, remove, apply, revert, deselect };
```

- [ ] **Step 2: Add a test for deselect**

Add to `web/src/hooks/useFilterPresets.test.ts`:

```typescript
it('deselect clears active preset', () => {
  const { result } = renderHook(() => useFilterPresets(), { wrapper });
  act(() => {
    result.current.apply('builtin-bossing');
  });
  expect(result.current.activePresetId).toBe('builtin-bossing');
  act(() => {
    result.current.deselect();
  });
  expect(result.current.activePresetId).toBeNull();
});
```

- [ ] **Step 3: Run tests**

Run: `cd web && npx vitest run src/hooks/useFilterPresets.test.ts`
Expected: all tests PASS.

- [ ] **Step 4: Implement the component**

```tsx
// web/src/components/FilterPresets.tsx
import { useState, useEffect, useRef } from 'react';
import type { FilterPresetsState } from '../hooks/useFilterPresets.js';

interface FilterPresetsProps {
  presetsState: FilterPresetsState;
}

export function FilterPresets({ presetsState }: FilterPresetsProps) {
  const { presets, activePresetId, isDirty, apply, revert, save, remove, deselect } = presetsState;
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saving && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [saving]);

  const handleSaveConfirm = () => {
    const trimmed = saveName.trim();
    if (trimmed) {
      save(trimmed);
      setSaving(false);
      setSaveName('');
    }
  };

  const handleSaveCancel = () => {
    setSaving(false);
    setSaveName('');
  };

  const handlePresetClick = (id: string) => {
    if (id === activePresetId) {
      if (isDirty) {
        revert();
      } else {
        deselect();
      }
    } else {
      apply(id);
    }
  };

  const showSave = !saving && !(activePresetId && !isDirty);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised/50 px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Preset</span>

        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          const activeStyle = isActive && !isDirty
            ? 'border border-border-active bg-bg-active text-text-bright'
            : isActive && isDirty
              ? 'border border-amber-700/50 bg-amber-950/30 text-amber-400'
              : 'border border-transparent bg-transparent text-text-dim hover:text-text-muted';

          return (
            <div key={preset.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${activeStyle}`}
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(preset.id);
                }}
                className="absolute -right-1 -top-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg-raised border border-border-default text-[9px] text-text-faint hover:text-negative cursor-pointer"
                title={`Delete ${preset.name}`}
              >
                &times;
              </button>
            </div>
          );
        })}

        {showSave && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="cursor-pointer text-xs text-accent hover:text-accent-bright bg-transparent border-none p-0"
          >
            Save current...
          </button>
        )}

        {saving && (
          <div className="flex items-center gap-1">
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveConfirm();
                if (e.key === 'Escape') handleSaveCancel();
              }}
              placeholder="Preset name"
              className="w-[120px] rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
            />
            <button
              type="button"
              onClick={handleSaveConfirm}
              className="cursor-pointer rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/FilterPresets.tsx web/src/hooks/useFilterPresets.ts web/src/hooks/useFilterPresets.test.ts
git commit -m "add FilterPresets component and deselect support"
```

---

### Task 5: Integrate into Dashboard

**Files:**
- Modify: `web/src/components/Dashboard.tsx`

Wire `useFilterPresets` into the Dashboard and render the `FilterPresets` component above the filter bar.

- [ ] **Step 1: Add imports and hook call**

Add to the imports at the top of `web/src/components/Dashboard.tsx`:

```typescript
import { FilterPresets } from './FilterPresets.js';
import { useFilterPresets } from '../hooks/useFilterPresets.js';
```

Inside the `Dashboard` component function (after `const controls = useSimulationControls();`), add:

```typescript
const presetsState = useFilterPresets();
```

- [ ] **Step 2: Render `FilterPresets` above the filter bar**

In the JSX, add the `FilterPresets` component right before the existing filter bar div (the `<div className="mt-8 rounded-lg border...">` at line 80):

```tsx
<FilterPresets presetsState={presetsState} />
```

Add `mt-8` to the `FilterPresets` container (either in the component or via a wrapper). Add `mt-3` (instead of `mt-8`) to the existing filter bar div so the two rows feel grouped. Specifically, change the filter bar's `mt-8` to `mt-3`.

- [ ] **Step 3: Verify visually**

Run: `cd web && npm run dev`

Open the dashboard. Verify:
- Preset row appears above the filter bar with "Bossing", "Training", "Unbuffed"
- Clicking "Bossing" highlights it (indigo)
- Clicking "Training" switches targets to 15 and activates multi-target group
- Clicking "Unbuffed" disables SE/Echo/SI/MW/Pot
- Changing a toggle while on a preset shows amber
- Clicking amber preset reverts
- Clicking clean active preset deselects
- "Save current..." creates a new preset
- × button on hover deletes presets
- Deleting active preset clears selection

- [ ] **Step 4: Run full test suite**

Run: `cd web && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/Dashboard.tsx
git commit -m "integrate filter presets into dashboard"
```

---

### Task 6: Final integration test and cleanup

**Files:**
- All files from tasks 1-5

- [ ] **Step 1: Run full web test suite**

Run: `cd web && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 2: Run engine test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 3: Type-check both packages**

Run: `cd web && npx tsc --noEmit && cd .. && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Manual smoke test**

Run: `cd web && npm run dev`

Full walkthrough:
1. Load dashboard — preset row visible with 3 built-ins
2. Click "Bossing" — indigo highlight, all controls at defaults
3. Click "Training" — targets jumps to 15, multi-target group active
4. Toggle SE off — preset goes amber
5. Click amber "Training" — reverts (SE back on, targets still 15)
6. Click active "Training" again (now clean) — deselects
7. Set custom toggles, click "Save current..." — name it "Custom"
8. New "Custom" button appears, highlighted
9. Hover "Custom" — × appears, click it — deleted
10. Hover "Bossing" — × appears, click it — dismissed
11. Reload page — "Bossing" stays dismissed, "Custom" is gone (was deleted)
12. Check `#f=` URL updates correctly when presets change controls

- [ ] **Step 5: Commit any final fixes**

If any issues found in smoke testing, fix and commit.
