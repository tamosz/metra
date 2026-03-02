# Individual Buff Toggles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace pre-baked Unbuffed/No-Echo scenarios with composable per-buff toggles in the web UI.

**Architecture:** Mirror the element toggles pattern — App-level state for buff overrides, merged into scenarios at simulation time via `useSimulation`. New `BuffToggles` component with binary on/off toggles for SE, Echo, SI, MW, and Attack Potion.

**Tech Stack:** TypeScript, React, Vitest, Playwright

---

### Task 1: Remove Unbuffed and No-Echo from DEFAULT_SCENARIOS

**Files:**
- Modify: `src/scenarios.ts`
- Modify: `src/scenarios.test.ts`

**Step 1: Update scenarios.ts**

Remove the Unbuffed and No-Echo entries, keeping Buffed, Bossing (50% PDR), and Bossing (KB):

```typescript
import type { ScenarioConfig } from './proposals/types.js';

export const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  { name: 'Buffed' },
  {
    name: 'Bossing (50% PDR)',
    pdr: 0.5,
  },
  {
    name: 'Bossing (KB)',
    pdr: 0.5,
    bossAttackInterval: 1.5,
    bossAccuracy: 250,
  },
];
```

**Step 2: Update scenarios.test.ts**

Update the test to match 3 scenarios, remove Unbuffed/No-Echo assertions:

```typescript
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
```

**Step 3: Run tests**

Run: `npx vitest run src/scenarios.test.ts`
Expected: PASS

**Step 4: Commit**

```
remove unbuffed and no-echo from default scenarios
```

---

### Task 2: Update engine tests that reference Unbuffed/No-Echo

These tests use "Unbuffed" and "No-Echo" as scenario names in local test data. The tests are testing the simulation/comparison engine's ability to handle multiple scenarios and overrides — those capabilities still exist. Replace the scenario names with "Bossing (50% PDR)" or use inline overrides that test the same behavior without relying on removed scenario names.

**Files:**
- Modify: `src/proposals/simulate.test.ts`
- Modify: `src/proposals/compare.test.ts`
- Modify: `src/integration.test.ts`
- Modify: `src/audit/analyze.test.ts`
- Modify: `src/report/markdown.test.ts`
- Modify: `src/report/bbcode.test.ts`
- Modify: `src/report/utils.test.ts`

**Key changes per file:**

**`src/proposals/simulate.test.ts`** (lines 86-214):
- Line 90: Change `{ name: 'Unbuffed' }` → `{ name: 'Bossing (50% PDR)', pdr: 0.5 }` in the "multiplies results" test
- Lines 153-214: The "unbuffed scenario produces lower DPS" and "no-echo scenario produces slightly lower DPS" tests — these test that scenario overrides work. Keep the test logic but rename the scenarios. The overrides are inline so they still work:
  - Rename `'Unbuffed'` → `'No Buffs'` (these are local test scenarios, not DEFAULT_SCENARIOS)
  - Rename `'No-Echo'` → `'Echo Off'`

**`src/proposals/compare.test.ts`** (lines 218-380):
- Same pattern: rename `'Unbuffed'` → `'No Buffs'` and `'No-Echo'` → `'Echo Off'` in local test scenario configs and assertions. The overrides are all inline.

**`src/integration.test.ts`** (lines 315-358):
- Rename `'Unbuffed'` → `'No Buffs'` in the multi-scenario baseline test and update the `expect(report).toContain()` assertion accordingly.

**`src/audit/analyze.test.ts`** (lines 224-246):
- Rename `'Unbuffed'` → `'Scenario B'` in the "handles multiple scenarios independently" test.

**`src/report/markdown.test.ts`** (lines 145-233):
- Rename `'Unbuffed'` → `'Bossing (50% PDR)'` and `'No-Echo'` → `'Bossing (KB)'` in test data and assertions.

**`src/report/bbcode.test.ts`** (lines 130-184):
- Rename `'Unbuffed'` → `'Bossing (50% PDR)'` in test data and assertions.

**`src/report/utils.test.ts`** (lines 129-179):
- Rename `'Unbuffed'` → `'Bossing (50% PDR)'` and `'No-Echo'` → `'Bossing (KB)'` in test data and assertions.

**Step 1: Make all the renames**

Apply the changes described above. Each file is a straightforward find-and-replace of scenario name strings in local test data. The overrides (when present) stay the same — only the `name` field and assertion strings change.

**Step 2: Run all engine tests**

Run: `npx vitest run`
Expected: All pass

**Step 3: Commit**

```
update engine tests to not reference removed scenarios
```

---

### Task 3: Add BuffToggles component

**Files:**
- Create: `web/src/components/BuffToggles.tsx`

**Step 1: Create the component**

Model it after `ElementToggles.tsx` but with binary on/off state. The `overrides` prop is a partial override object — keys present mean "off", keys absent mean "on" (default buffed).

```tsx
import type { CharacterBuild } from '@engine/data/types.js';

type BuffOverrides = Partial<Pick<CharacterBuild, 'sharpEyes' | 'echoActive' | 'speedInfusion' | 'mwLevel' | 'attackPotion'>>;

const BUFFS = [
  { key: 'sharpEyes' as const, label: 'SE', offValue: false as const, tooltip: 'Sharp Eyes' },
  { key: 'echoActive' as const, label: 'Echo', offValue: false as const, tooltip: 'Echo of Hero' },
  { key: 'speedInfusion' as const, label: 'SI', offValue: false as const, tooltip: 'Speed Infusion' },
  { key: 'mwLevel' as const, label: 'MW', offValue: 0 as const, tooltip: 'Maple Warrior' },
  { key: 'attackPotion' as const, label: 'Pot', offValue: 0 as const, tooltip: 'Attack Potion' },
] as const;

const STYLE_ON = 'border border-transparent bg-transparent text-text-dim hover:text-text-muted';
const STYLE_OFF = 'border border-red-700/50 bg-red-950/40 text-red-400';

interface BuffTogglesProps {
  overrides: BuffOverrides;
  onChange: (overrides: BuffOverrides) => void;
}

export type { BuffOverrides };

export function BuffToggles({ overrides, onChange }: BuffTogglesProps) {
  const handleClick = (key: keyof BuffOverrides, offValue: boolean | number) => {
    const isOff = key in overrides;
    const updated = { ...overrides };
    if (isOff) {
      delete updated[key];
    } else {
      (updated as Record<string, unknown>)[key] = offValue;
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Buffs</span>
      <div className="flex gap-1">
        {BUFFS.map(({ key, label, offValue, tooltip }) => {
          const isOff = key in overrides;
          return (
            <button
              key={key}
              type="button"
              title={isOff ? `${tooltip}: OFF (click to enable)` : `${tooltip}: ON (click to disable)`}
              onClick={() => handleClick(key, offValue)}
              className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${isOff ? STYLE_OFF : STYLE_ON}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```
add BuffToggles component
```

---

### Task 4: Wire buff overrides into useSimulation

**Files:**
- Modify: `web/src/hooks/useSimulation.ts`

**Step 1: Add buffOverrides parameter**

Add a `buffOverrides` parameter to `useSimulation` that merges into each scenario's `overrides`, same pattern as `elementModifiers`:

```typescript
import type { BuffOverrides } from '../components/BuffToggles.js';
```

Update the function signature:

```typescript
export function useSimulation(
  customTiers: CustomTier[] = [],
  targetCount?: number,
  elementModifiers?: Record<string, number>,
  buffOverrides?: BuffOverrides,
): SimulationData {
```

Inside the `useMemo`, after the element modifier merging block, add buff override merging:

```typescript
    const hasBuffOverrides = buffOverrides && Object.keys(buffOverrides).length > 0;
    const scenarios: ScenarioConfig[] = DEFAULT_SCENARIOS.map((s) => {
      let merged = s;
      if (hasElementMods) {
        merged = { ...merged, elementModifiers: { ...merged.elementModifiers, ...elementModifiers } };
      }
      if (hasBuffOverrides) {
        merged = { ...merged, overrides: { ...merged.overrides, ...buffOverrides } };
      }
      return merged;
    });
```

This replaces the existing element-only mapping. Also update the training scenario creation to include buff overrides:

```typescript
    if (targetCount != null && targetCount > 1) {
      const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
      if (hasElementMods) training.elementModifiers = { ...elementModifiers };
      if (hasBuffOverrides) training.overrides = { ...buffOverrides };
      scenarios.push(training);
    }
```

Update the `useMemo` dependency array to include `buffOverrides`.

**Step 2: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```
wire buff overrides into useSimulation
```

---

### Task 5: Wire App and Dashboard

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/Dashboard.tsx`

**Step 1: Add state to App**

In `App.tsx`, add buff override state and pass it through:

```typescript
import type { BuffOverrides } from './components/BuffToggles.js';
```

Add state after `elementModifiers`:

```typescript
const [buffOverrides, setBuffOverrides] = useState<BuffOverrides>({});
```

Pass to `useSimulation`:

```typescript
const simulation = useSimulation(
  customTiersState.tiers,
  targetCount > 1 ? targetCount : undefined,
  Object.keys(elementModifiers).length > 0 ? elementModifiers : undefined,
  Object.keys(buffOverrides).length > 0 ? buffOverrides : undefined,
);
```

Pass to `Dashboard`:

```tsx
<Dashboard
  simulation={simulation}
  customTiers={customTiersState}
  baseTiers={baseTiers}
  targetCount={targetCount}
  setTargetCount={setTargetCount}
  elementModifiers={elementModifiers}
  setElementModifiers={setElementModifiers}
  buffOverrides={buffOverrides}
  setBuffOverrides={setBuffOverrides}
/>
```

**Step 2: Update Dashboard props and filter bar**

In `Dashboard.tsx`, add to the interface and destructuring:

```typescript
import { BuffToggles } from './BuffToggles.js';
import type { BuffOverrides } from './BuffToggles.js';
```

Add to `DashboardProps`:

```typescript
  buffOverrides: BuffOverrides;
  setBuffOverrides: (overrides: BuffOverrides) => void;
```

Add to destructuring and render in the filter bar after `ElementToggles`:

```tsx
<BuffToggles overrides={buffOverrides} onChange={setBuffOverrides} />
```

**Step 3: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
wire buff toggles into app and dashboard
```

---

### Task 6: Update web tests

**Files:**
- Modify: `web/src/hooks/useSimulation.test.ts`
- Modify: `web/src/utils/game-terms.ts`
- Modify: `web/src/utils/game-terms.test.ts`

**Step 1: Update useSimulation.test.ts**

Change the expected scenarios list from 5 to 3, removing Unbuffed and No-Echo:

```typescript
  it('includes all 3 default scenarios', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.scenarios).toEqual([
      'Buffed',
      'Bossing (50% PDR)',
      'Bossing (KB)',
    ]);
  });
```

**Step 2: Update game-terms.ts**

Remove Unbuffed and No-Echo from `SCENARIO_DESCRIPTIONS`:

```typescript
export const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  Buffed: 'All party buffs active: MW20, SE, SI, Echo, and attack potions.',
  'Bossing (50% PDR)': 'Fully buffed with 50% Physical Damage Reduction — sustained bossing damage.',
  'Bossing (KB)': 'Bossing with knockback modeling — accounts for DPS lost to boss attacks interrupting your skills. Classes with Stance or Shadow Shifter lose less uptime.',
};
```

**Step 3: Update game-terms.test.ts**

Remove the Unbuffed and No-Echo assertions:

```typescript
  it('returns static description for known scenarios', () => {
    expect(getScenarioDescription('Buffed')).toContain('All party buffs');
    expect(getScenarioDescription('Bossing (50% PDR)')).toContain('50%');
  });
```

**Step 4: Run web tests**

Run: `cd web && npx vitest run`
Expected: All pass

**Step 5: Commit**

```
update web tests and scenario descriptions for buff toggles
```

---

### Task 7: Update e2e tests

**Files:**
- Modify: `web/e2e/dashboard.spec.ts`
- Modify: `web/e2e/proposal-results.spec.ts`

**Step 1: Update dashboard.spec.ts**

Replace the "scenario filter changes DPS values" test. Instead of clicking 'Unbuffed' scenario button, toggle a buff off:

```typescript
  test('buff toggle changes DPS values', async ({ page }) => {
    const table = page.getByTestId('ranking-table');
    const firstDpsBefore = await table.locator('tbody tr:first-child td:last-child').textContent();

    // Turn off Sharp Eyes
    await page.getByRole('button', { name: /SE/ }).click();

    const firstDpsAfter = await table.locator('tbody tr:first-child td:last-child').textContent();
    expect(firstDpsAfter).not.toBe(firstDpsBefore);
  });
```

**Step 2: Update proposal-results.spec.ts**

Replace the "scenario tabs switch table data" test. Use 'Bossing (50% PDR)' instead of 'Unbuffed':

```typescript
  test('scenario tabs switch table data', async ({ page }) => {
    const table = page.getByTestId('delta-table');
    const buffedFirst = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();

    await page.getByRole('button', { name: 'Bossing (50% PDR)' }).click();
    const bossingFirst = await table.locator('tbody tr:first-child td:nth-child(5)').textContent();

    expect(bossingFirst).not.toBe(buffedFirst);
  });
```

**Step 3: Run e2e tests**

Run: `cd web && npx playwright test`
Expected: All pass

**Step 4: Commit**

```
update e2e tests for buff toggles
```

---

### Task 8: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `ROADMAP.md`

**Step 1: Update CLAUDE.md**

Find the scenarios section and replace with:

```
- **Buffed** — all buffs on (MW, SE, SI, Echo, attack potions). Primary comparison metric.
- **Bossing (50% PDR)** — fully buffed with 50% Physical Damage Reduction applied. Shows sustained bossing DPS.
- **Bossing (KB)** — bossing with knockback modeling. Accounts for DPS lost to boss attacks interrupting skills.

Individual buffs (SE, Echo, SI, MW, Attack Potion) can be toggled on/off in the web UI, composing onto any selected scenario.
```

Also update the "5 default scenarios" reference in any summary sections and the "Multi-scenario support" description.

**Step 2: Update ROADMAP.md**

Update the milestone that mentions "4 scenarios (Buffed, Unbuffed, No-Echo, Bossing 50% PDR) + composable element toggles" to reflect the new state:

```
- 3 scenarios (Buffed, Bossing 50% PDR, Bossing KB) + composable buff & element toggles
```

**Step 3: Commit**

```
update docs for individual buff toggles
```

---

### Task 9: Final verification

**Step 1: Run all engine tests**

Run: `npx vitest run`
Expected: All pass

**Step 2: Run all web tests**

Run: `cd web && npx vitest run`
Expected: All pass

**Step 3: Type check everything**

Run: `npm run type-check:all`
Expected: No errors

**Step 4: Run e2e tests**

Run: `cd web && npx playwright test`
Expected: All pass

**Step 5: Manual smoke test**

Run: `cd web && npm run dev`
- Verify buff toggles appear in dashboard filter bar
- Click SE off → DPS values decrease
- Click SE back on → DPS returns to baseline
- Toggle all buffs off → significant DPS drop
- Switch to Bossing (50% PDR) scenario with some buffs off → both PDR and buff overrides apply
- Verify element toggles still work independently
