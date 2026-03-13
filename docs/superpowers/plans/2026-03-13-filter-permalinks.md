# Filter State Permalinks Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encode all dashboard filter state in the URL (`#f=`) so every configuration is shareable, and let the "metra" logo reset everything to defaults.

**Architecture:** New `filter-url.ts` utility handles encode/decode (matching existing `url-encoding.ts` pattern). New `useFilterPermalink` hook wires context state to URL via `history.replaceState`. `activeGroups` lifts from Dashboard local state into `SimulationControlsContext`. A `resetControls()` method on the context resets all state atomically.

**Tech Stack:** React, lz-string, Vitest

**Spec:** `docs/superpowers/specs/2026-03-13-filter-permalinks-design.md`

---

## Chunk 1: Filter URL utilities and context changes

### Task 1: Extract default constants

**Files:**
- Create: `web/src/utils/filter-defaults.ts`
- Modify: `web/src/context/SimulationControlsContext.tsx`

- [ ] **Step 1: Create filter-defaults.ts with named constants**

```typescript
// web/src/utils/filter-defaults.ts
import type { CgsValues } from './cgs.js';
import { CGS_DEFAULTS } from './cgs.js';
import type { SkillGroupId } from './skill-groups.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';
import type { BuffOverrides } from '../components/BuffToggles.js';

export const FILTER_DEFAULTS = {
  tier: 'perfect',
  targetCount: 1,
  capEnabled: true,
  kbEnabled: false,
  bossAttackInterval: 1.5,
  bossAccuracy: 250,
  breakdownEnabled: false,
} as const;

export function defaultCgsForTier(tier: string): CgsValues {
  return { ...(CGS_DEFAULTS[tier] ?? CGS_DEFAULTS.perfect) };
}

export function defaultActiveGroups(): Set<SkillGroupId> {
  return new Set(DEFAULT_SKILL_GROUPS);
}

export function defaultBuffOverrides(): BuffOverrides {
  return {};
}

export function defaultElementModifiers(): Record<string, number> {
  return {};
}
```

- [ ] **Step 2: Update SimulationControlsContext to import from filter-defaults**

Replace the hardcoded initial values in `SimulationControlsContext.tsx` with imports from `filter-defaults.ts`. Change:
- `useState(1)` → `useState(FILTER_DEFAULTS.targetCount)`
- `useState(false)` for kbEnabled → `useState(FILTER_DEFAULTS.kbEnabled)`
- `useState(1.5)` → `useState(FILTER_DEFAULTS.bossAttackInterval)`
- `useState(250)` → `useState(FILTER_DEFAULTS.bossAccuracy)`
- `useState(true)` for capEnabled → `useState(FILTER_DEFAULTS.capEnabled)`
- `useState('perfect')` → `useState(FILTER_DEFAULTS.tier)`
- `useState<CgsValues>({ ...CGS_DEFAULTS.perfect })` → `useState<CgsValues>(defaultCgsForTier(FILTER_DEFAULTS.tier))`
- `useState(false)` for breakdownEnabled → `useState(FILTER_DEFAULTS.breakdownEnabled)`

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `cd /Users/tome/dev/metra/web && npx vitest run src/context/SimulationControlsContext.test.tsx`
Expected: All existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add web/src/utils/filter-defaults.ts web/src/context/SimulationControlsContext.tsx
git commit -m "extract filter default constants"
```

### Task 2: Add activeGroups to SimulationControlsContext

**Files:**
- Modify: `web/src/context/SimulationControlsContext.tsx`
- Modify: `web/src/components/Dashboard.tsx`

- [ ] **Step 1: Add activeGroups state and toggleGroup to the context**

In `SimulationControlsContext.tsx`:
- Import `SkillGroupId` from `../utils/skill-groups.js` and `defaultActiveGroups` from `../utils/filter-defaults.js`
- Add to `SimulationControlsContextType`:
  ```typescript
  activeGroups: Set<SkillGroupId>;
  setActiveGroups: (groups: Set<SkillGroupId>) => void;
  toggleGroup: (id: SkillGroupId) => void;
  ```
- Add state: `const [activeGroups, setActiveGroups] = useState<Set<SkillGroupId>>(defaultActiveGroups);`
- Add toggle callback:
  ```typescript
  const toggleGroup = useCallback((id: SkillGroupId) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  ```
- Add `activeGroups`, `setActiveGroups`, `toggleGroup` to the value memo and its dependency array.

- [ ] **Step 2: Update Dashboard to use activeGroups from context**

In `Dashboard.tsx`:
- Remove the local `useState` for `activeGroups` (line 49)
- Remove the local `toggleGroup` function (lines 51-61)
- Destructure `activeGroups, toggleGroup` from `useSimulationControls()` (line 31)
- Remove `SkillGroupId` from the `skill-groups.js` import (it's no longer needed directly in Dashboard — `SkillGroupToggles` receives it via props)

- [ ] **Step 3: Run tests**

Run: `cd /Users/tome/dev/metra/web && npx vitest run`
Expected: All tests pass. Dashboard test may need updating if it asserts on internal state.

- [ ] **Step 4: Commit**

```bash
git add web/src/context/SimulationControlsContext.tsx web/src/components/Dashboard.tsx
git commit -m "lift activeGroups into SimulationControlsContext"
```

### Task 3: Add resetControls to SimulationControlsContext

**Files:**
- Modify: `web/src/context/SimulationControlsContext.tsx`
- Modify: `web/src/context/SimulationControlsContext.test.tsx`

- [ ] **Step 1: Write failing test for resetControls**

Add to `SimulationControlsContext.test.tsx`:
```typescript
it('resetControls restores all state to defaults', () => {
  const { result } = renderHook(() => useSimulationControls(), { wrapper });

  // Change everything
  act(() => {
    result.current.setSelectedTier('low');
    result.current.setTargetCount(6);
    result.current.setCapEnabled(false);
    result.current.setKbEnabled(true);
    result.current.setBossAttackInterval(3.0);
    result.current.setBossAccuracy(300);
    result.current.setBreakdownEnabled(true);
    result.current.setBuffOverrides({ sharpEyes: false });
    result.current.setElementModifiers({ Holy: 1.5 });
    result.current.setEfficiencyOverrides({ hero: [1, 2] });
    result.current.setEditEnabled(true);
  });

  // Reset
  act(() => result.current.resetControls());

  expect(result.current.selectedTier).toBe('perfect');
  expect(result.current.targetCount).toBe(1);
  expect(result.current.capEnabled).toBe(true);
  expect(result.current.kbEnabled).toBe(false);
  expect(result.current.bossAttackInterval).toBe(1.5);
  expect(result.current.bossAccuracy).toBe(250);
  expect(result.current.breakdownEnabled).toBe(false);
  expect(result.current.buffOverrides).toEqual({});
  expect(result.current.elementModifiers).toEqual({});
  expect(result.current.efficiencyOverrides).toEqual({});
  expect(result.current.editEnabled).toBe(false);
  expect(result.current.editChanges).toEqual([]);
  expect(result.current.activeGroups).toEqual(new Set(['main']));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/tome/dev/metra/web && npx vitest run src/context/SimulationControlsContext.test.tsx -t "resetControls"`
Expected: FAIL — `resetControls` is not defined.

- [ ] **Step 3: Implement resetControls**

In `SimulationControlsContext.tsx`, add:
```typescript
const resetControls = useCallback(() => {
  setSelectedTier(FILTER_DEFAULTS.tier);
  setTargetCount(FILTER_DEFAULTS.targetCount);
  setCapEnabled(FILTER_DEFAULTS.capEnabled);
  setKbEnabled(FILTER_DEFAULTS.kbEnabled);
  setBossAttackInterval(FILTER_DEFAULTS.bossAttackInterval);
  setBossAccuracy(FILTER_DEFAULTS.bossAccuracy);
  setBreakdownEnabled(FILTER_DEFAULTS.breakdownEnabled);
  setBuffOverrides(defaultBuffOverrides());
  setElementModifiers(defaultElementModifiers());
  setCgsValues(defaultCgsForTier(FILTER_DEFAULTS.tier));
  setEfficiencyOverrides({});
  setEditEnabledRaw(false);
  setEditChanges([]);
  setEditMetaRaw(EMPTY_EDIT_META);
  setActiveGroups(defaultActiveGroups());
}, []);
```

Add `resetControls` to the interface, the value memo, and the dependency array.

Also export the interface: change `interface SimulationControlsContextType` to `export interface SimulationControlsContextType` (needed by the `useFilterPermalink` hook in Task 5).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/tome/dev/metra/web && npx vitest run src/context/SimulationControlsContext.test.tsx`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/context/SimulationControlsContext.tsx web/src/context/SimulationControlsContext.test.tsx
git commit -m "add resetControls to SimulationControlsContext"
```

### Task 4: Create filter-url.ts encode/decode utilities

**Files:**
- Create: `web/src/utils/filter-url.ts`
- Create: `web/src/utils/filter-url.test.ts`

- [ ] **Step 1: Write failing tests for encodeFilterState and decodeFilterState**

```typescript
// web/src/utils/filter-url.test.ts
import { describe, it, expect } from 'vitest';
import { encodeFilterState, decodeFilterState, type FilterState } from './filter-url.js';

describe('filter-url', () => {
  it('returns empty string for all-default state', () => {
    expect(encodeFilterState({})).toBe('');
  });

  it('roundtrips tier change', () => {
    const state: FilterState = { tier: 'low' };
    const encoded = encodeFilterState(state);
    expect(encoded).not.toBe('');
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips buff overrides', () => {
    const state: FilterState = { buffs: { sharpEyes: false } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips element modifiers', () => {
    const state: FilterState = { elements: { Holy: 1.5, Fire: 0.5 } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips KB enabled with default params', () => {
    const state: FilterState = { kb: {} };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips KB with custom params', () => {
    const state: FilterState = { kb: { interval: 3.0, accuracy: 300 } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips target count', () => {
    const state: FilterState = { targets: 6 };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips cap disabled', () => {
    const state: FilterState = { cap: false };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips CGS overrides', () => {
    const state: FilterState = { cgs: { cape: 20, glove: 20, shoe: 20 } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips skill groups', () => {
    const state: FilterState = { groups: ['warriors', 'mages'] };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips breakdown enabled', () => {
    const state: FilterState = { breakdown: true };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips complex multi-field state', () => {
    const state: FilterState = {
      tier: 'high',
      buffs: { sharpEyes: false, speedInfusion: false },
      kb: { interval: 2.0 },
      targets: 3,
      cap: false,
      groups: ['warriors', 'pirates'],
      breakdown: true,
    };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('returns null for malformed input', () => {
    expect(decodeFilterState('')).toBeNull();
    expect(decodeFilterState('garbage')).toBeNull();
  });

  it('filters unknown group IDs on decode', () => {
    // Manually craft a state with an unknown group
    const state = { groups: ['warriors', 'unknown-group'] };
    const encoded = encodeFilterState(state as FilterState);
    const decoded = decodeFilterState(encoded);
    expect(decoded!.groups).toEqual(['warriors']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/tome/dev/metra/web && npx vitest run src/utils/filter-url.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement filter-url.ts**

```typescript
// web/src/utils/filter-url.ts
import LZString from 'lz-string';
import type { BuffOverrides } from '../components/BuffToggles.js';
import type { CgsValues } from './cgs.js';
import { SKILL_GROUPS, type SkillGroupId } from './skill-groups.js';

export interface FilterState {
  tier?: string;
  buffs?: BuffOverrides;
  elements?: Record<string, number>;
  kb?: { interval?: number; accuracy?: number };
  targets?: number;
  cap?: boolean;
  cgs?: CgsValues;
  groups?: string[];
  breakdown?: boolean;
}

const KNOWN_GROUP_IDS = new Set<string>(SKILL_GROUPS.map((g) => g.id));

export function encodeFilterState(state: FilterState): string {
  if (Object.keys(state).length === 0) return '';
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeFilterState(encoded: string): FilterState | null {
  try {
    if (!encoded) return null;
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const result: FilterState = {};

    if (typeof parsed.tier === 'string') result.tier = parsed.tier;
    if (typeof parsed.buffs === 'object' && parsed.buffs !== null) result.buffs = parsed.buffs;
    if (typeof parsed.elements === 'object' && parsed.elements !== null) result.elements = parsed.elements;
    if (typeof parsed.kb === 'object' && parsed.kb !== null) result.kb = parsed.kb;
    if (typeof parsed.targets === 'number') result.targets = parsed.targets;
    if (typeof parsed.cap === 'boolean') result.cap = parsed.cap;
    if (typeof parsed.cgs === 'object' && parsed.cgs !== null) result.cgs = parsed.cgs;
    if (typeof parsed.breakdown === 'boolean') result.breakdown = parsed.breakdown;

    if (Array.isArray(parsed.groups)) {
      const validGroups = parsed.groups.filter((g: unknown) => typeof g === 'string' && KNOWN_GROUP_IDS.has(g));
      if (validGroups.length > 0) result.groups = validGroups;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function getFilterFromUrl(): FilterState | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#f=')) return null;
  return decodeFilterState(hash.slice(3));
}

export function setFilterInUrl(state: FilterState): void {
  const encoded = encodeFilterState(state);
  if (encoded) {
    window.history.replaceState(null, '', `#f=${encoded}`);
  } else {
    clearFilterFromUrl();
  }
}

export function clearFilterFromUrl(): void {
  window.history.replaceState(null, '', window.location.pathname);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/tome/dev/metra/web && npx vitest run src/utils/filter-url.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/utils/filter-url.ts web/src/utils/filter-url.test.ts
git commit -m "add filter state URL encode/decode utilities"
```

## Chunk 2: Hook, App integration, and cleanup

### Task 5: Create useFilterPermalink hook

**Files:**
- Create: `web/src/hooks/useFilterPermalink.ts`

This hook reads filter state from URL on mount and writes state changes back to the URL.

- [ ] **Step 1: Implement the hook**

```typescript
// web/src/hooks/useFilterPermalink.ts
import { useEffect, useRef } from 'react';
import type { SimulationControlsContextType } from '../context/SimulationControlsContext.js';
import { FILTER_DEFAULTS, defaultCgsForTier } from '../utils/filter-defaults.js';
import { CGS_DEFAULTS } from '../utils/cgs.js';
import { DEFAULT_SKILL_GROUPS, type SkillGroupId } from '../utils/skill-groups.js';
import { type FilterState, setFilterInUrl, clearFilterFromUrl } from '../utils/filter-url.js';

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function buildFilterState(controls: SimulationControlsContextType): FilterState {
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

  // CGS: compare against defaults for current tier
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

Note: the `initialized` ref skips the first render so the hook doesn't overwrite the URL before `App.tsx` has had a chance to read it.

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks/useFilterPermalink.ts
git commit -m "add useFilterPermalink hook"
```

### Task 6: Wire everything into App.tsx

**Files:**
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Add #f= to mount-time URL loading**

In `App.tsx`, import `getFilterFromUrl` from `../utils/filter-url.js` and `useFilterPermalink` from `../hooks/useFilterPermalink.js`.

Add `#f=` as the lowest-priority case in the existing `useEffect` (after `#p=`):
```typescript
const urlFilter = getFilterFromUrl();
if (urlFilter) {
  if (urlFilter.tier) controls.setSelectedTier(urlFilter.tier);
  if (urlFilter.buffs) controls.setBuffOverrides(urlFilter.buffs);
  if (urlFilter.elements) controls.setElementModifiers(urlFilter.elements);
  if (urlFilter.kb) {
    controls.setKbEnabled(true);
    if (urlFilter.kb.interval !== undefined) controls.setBossAttackInterval(urlFilter.kb.interval);
    if (urlFilter.kb.accuracy !== undefined) controls.setBossAccuracy(urlFilter.kb.accuracy);
  }
  if (urlFilter.targets) controls.setTargetCount(urlFilter.targets);
  if (urlFilter.cap !== undefined) controls.setCapEnabled(urlFilter.cap);
  if (urlFilter.cgs) controls.setCgsValues(urlFilter.cgs);
  if (urlFilter.groups) controls.setActiveGroups(new Set(urlFilter.groups as SkillGroupId[]));
  if (urlFilter.breakdown) controls.setBreakdownEnabled(urlFilter.breakdown);
  setPage('dashboard');
}
```

Add a `useRef` guard to prevent the mount effect from re-running:
```typescript
const loadedFromUrl = useRef(false);

useEffect(() => {
  if (loadedFromUrl.current) return;
  loadedFromUrl.current = true;
  // ... existing URL loading logic + new #f= case
}, []);
```

Change the dependency array to `[]` since we only want this to run once on mount (the ref guard is a belt-and-suspenders approach). Add `// eslint-disable-next-line react-hooks/exhaustive-deps` above the `useEffect` since the effect intentionally captures these values only on mount.

- [ ] **Step 2: Call useFilterPermalink**

After the existing hooks in `AppContent`, add:
```typescript
useFilterPermalink(controls);
```

- [ ] **Step 3: Update logo onClick to reset**

Change the logo button's `onClick` from `() => navigate('dashboard')` to:
```typescript
onClick={() => {
  controls.resetControls();
  window.history.replaceState(null, '', window.location.pathname);
  navigate('dashboard');
}}
```

- [ ] **Step 4: Run all web tests**

Run: `cd /Users/tome/dev/metra/web && npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx
git commit -m "wire filter permalinks into app"
```

### Task 7: Update ROADMAP.md

**Files:**
- Modify: `ROADMAP.md`

- [ ] **Step 1: Move filter state permalinks from Phase 2 to Done**

Remove from Phase 2:
```
**Filter state permalinks**
- Encode dashboard filter state (tier, buffs, elements, KB, targets) in the URL
- Shareable links like "here's what Corsair looks like with KB on and no SI"
```

Add to Done list:
```
- Filter state permalinks: encode dashboard filter state in URL (`#f=`), shareable configuration links, logo reset to defaults
```

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md
git commit -m "move filter permalinks to done in roadmap"
```

### Task 8: Run full test suite and manual verification

- [ ] **Step 1: Run root tests**

Run: `cd /Users/tome/dev/metra && npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run web tests**

Run: `cd /Users/tome/dev/metra/web && npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Manual smoke test**

Run: `cd /Users/tome/dev/metra/web && npm run dev`

Verify:
1. Toggle some filters (change tier to "high", turn off SE, enable KB) → URL updates to `#f=<something>`
2. Copy URL, open in new tab → same filter state is restored
3. Return all filters to defaults → URL hash clears
4. Click "metra" logo → all filters reset to defaults, URL hash clears
5. Open a `#p=` link → proposal loads, no `#f=` interference
6. Open a `#b=` link → build page loads correctly
