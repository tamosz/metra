# Elemental Weakness Toggles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded "Bossing (Undead, 50% PDR)" scenario with composable element weakness/strength toggles in the Dashboard filter bar.

**Architecture:** Element state is managed in `App` as `Record<string, number>` (element name → multiplier), passed into `useSimulation` which merges it into every scenario's `elementModifiers` before running the simulation. A new `ElementToggles` component renders five three-state buttons (neutral/weak/strong) in the filter bar. No engine changes needed — `ScenarioConfig.elementModifiers` already supports this.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Add missing element tags to Archmage F/P skill data

**Files:**
- Modify: `data/skills/archmage-fp.json`

**Step 1: Add element field to Paralyze and Meteor**

In `data/skills/archmage-fp.json`, add `"element": "Fire"` to the Paralyze skill object (after `"weaponType": "Staff"` on line 20) and `"element": "Fire"` to the Meteor skill object (after `"weaponType": "Staff"` on line 29). Both are Fire-element skills.

```json
{
  "name": "Paralyze",
  ...
  "weaponType": "Staff",
  "element": "Fire"
},
{
  "name": "Meteor",
  ...
  "weaponType": "Staff",
  "element": "Fire",
  "maxTargets": 15
}
```

**Step 2: Run tests to verify nothing breaks**

Run: `npx vitest run`
Expected: All tests pass. No existing tests depend on F/P lacking an element tag.

**Step 3: Commit**

```
add fire element to archmage f/p skills
```

---

### Task 2: Remove "Bossing (Undead, 50% PDR)" scenario

**Files:**
- Modify: `src/scenarios.ts:23-27` — remove the Undead scenario entry
- Modify: `web/src/utils/game-terms.ts:19` — remove the Undead scenario description

**Step 1: Remove the scenario from DEFAULT_SCENARIOS**

In `src/scenarios.ts`, delete the last entry (lines 23-27):
```typescript
  {
    name: 'Bossing (Undead, 50% PDR)',
    pdr: 0.5,
    elementModifiers: { Holy: 1.5 },
  },
```

**Step 2: Remove the scenario description**

In `web/src/utils/game-terms.ts`, delete line 19:
```typescript
  'Bossing (Undead, 50% PDR)': 'Fully buffed vs undead boss (50% PDR). Holy-element skills deal 1.5x damage.',
```

**Step 3: Run tests, fix any that reference the removed scenario**

Run: `npx vitest run`

Some tests in `src/integration.test.ts` or snapshot tests may reference "Bossing (Undead, 50% PDR)". Update them to remove expectations for this scenario. The CLI baseline output will also have one fewer scenario.

Run: `cd web && npm test`

Web tests may reference the scenario count or name. Fix accordingly.

**Step 4: Commit**

```
remove hardcoded undead bossing scenario

now composable via element toggles (next commit)
```

---

### Task 3: Thread elementModifiers through useSimulation

**Files:**
- Modify: `web/src/hooks/useSimulation.ts:24` — add `elementModifiers` parameter
- Modify: `web/src/App.tsx:18-22` — add element state, pass to useSimulation and Dashboard

**Step 1: Add elementModifiers param to useSimulation**

In `web/src/hooks/useSimulation.ts`, add parameter and merge into scenarios:

```typescript
export function useSimulation(
  customTiers: CustomTier[] = [],
  targetCount?: number,
  elementModifiers?: Record<string, number>
): SimulationData {
  return useMemo(() => {
    // ... existing discovery + custom tier code ...

    const scenarios: ScenarioConfig[] = DEFAULT_SCENARIOS.map((s) => {
      if (!elementModifiers || Object.keys(elementModifiers).length === 0) return s;
      return {
        ...s,
        elementModifiers: { ...s.elementModifiers, ...elementModifiers },
      };
    });
    if (targetCount != null && targetCount > 1) {
      const trainingScenario: ScenarioConfig = {
        name: `Training (${targetCount} mobs)`,
        targetCount,
      };
      if (elementModifiers && Object.keys(elementModifiers).length > 0) {
        trainingScenario.elementModifiers = { ...elementModifiers };
      }
      scenarios.push(trainingScenario);
    }

    // ... rest unchanged (config, results, return) ...
  }, [customTiers, targetCount, elementModifiers]);
}
```

Key change: instead of `[...DEFAULT_SCENARIOS]`, map over them and spread `elementModifiers` into each. Training scenario also gets the modifiers.

**Step 2: Add element state in App and pass it through**

In `web/src/App.tsx`, add state and pass to `useSimulation` and `Dashboard`:

```typescript
const [elementModifiers, setElementModifiers] = useState<Record<string, number>>({});
const simulation = useSimulation(
  customTiersState.tiers,
  targetCount > 1 ? targetCount : undefined,
  Object.keys(elementModifiers).length > 0 ? elementModifiers : undefined
);
```

Update the `<Dashboard>` props to include `elementModifiers` and `setElementModifiers`.

**Step 3: Update Dashboard props interface**

In `web/src/components/Dashboard.tsx`, add to `DashboardProps`:

```typescript
interface DashboardProps {
  simulation: SimulationData;
  customTiers: CustomTiersState;
  baseTiers: string[];
  targetCount: number;
  setTargetCount: (n: number) => void;
  elementModifiers: Record<string, number>;
  setElementModifiers: (mods: Record<string, number>) => void;
}
```

**Step 4: Run type-check and tests**

Run: `npm run type-check:all`
Run: `npx vitest run`
Run: `cd web && npm test`

All should pass (element toggles aren't rendered yet, just plumbed through).

**Step 5: Commit**

```
thread element modifiers through useSimulation
```

---

### Task 4: Build the ElementToggles component

**Files:**
- Create: `web/src/components/ElementToggles.tsx`

**Step 1: Create the component**

The component renders 5 element buttons. Each cycles through 3 states on click: neutral → weak (1.5x) → strong (0.5x) → neutral.

```typescript
const ELEMENTS = ['Holy', 'Fire', 'Ice', 'Lightning', 'Poison'] as const;

type ElementState = 'neutral' | 'weak' | 'strong';

function getState(modifiers: Record<string, number>, element: string): ElementState {
  const mod = modifiers[element];
  if (mod === 1.5) return 'weak';
  if (mod === 0.5) return 'strong';
  return 'neutral';
}

function nextState(current: ElementState): ElementState {
  if (current === 'neutral') return 'weak';
  if (current === 'weak') return 'strong';
  return 'neutral';
}

// Short labels for the buttons
const SHORT_LABELS: Record<string, string> = {
  Holy: 'Ho',
  Fire: 'Fi',
  Ice: 'Ic',
  Lightning: 'Li',
  Poison: 'Po',
};
```

Each button has three visual states:
- **Neutral**: same dim style as inactive FilterGroup buttons (`border-transparent bg-transparent text-text-dim`)
- **Weak**: green tint (`border-emerald-700/50 bg-emerald-950/40 text-emerald-400`)
- **Strong**: red tint (`border-red-700/50 bg-red-950/40 text-red-400`)

The component calls `onChange` with a new `Record<string, number>` — entries with 1.0 multiplier are omitted (same as neutral).

**Step 2: Verify it renders**

Run: `cd web && npm run dev`

Open browser, confirm the element buttons appear in the filter bar. Click through states and verify visual changes. (Manual check — no automated test yet.)

**Step 3: Commit**

```
add element toggle buttons to dashboard filter bar
```

---

### Task 5: Wire ElementToggles into Dashboard

**Files:**
- Modify: `web/src/components/Dashboard.tsx:67-84` — add `<ElementToggles>` to the filter bar

**Step 1: Add ElementToggles to the filter bar**

In `Dashboard.tsx`, import `ElementToggles` and add it after the `<TargetSpinner>` in the filter bar div (line 83):

```tsx
<div className="mb-6 flex items-center gap-4">
  <FilterGroup label="Scenario" ... />
  <FilterGroup label="Tier" ... />
  <TargetSpinner value={targetCount} onChange={setTargetCount} />
  <ElementToggles
    modifiers={elementModifiers}
    onChange={setElementModifiers}
  />
</div>
```

**Step 2: Verify end-to-end**

Run: `cd web && npm run dev`

1. Select "Bossing (50% PDR)" scenario
2. Toggle Holy to "weak" — Paladin and Bishop DPS should jump ~50%
3. Toggle Holy to "strong" — their DPS should drop ~50%
4. Toggle back to neutral — DPS returns to baseline
5. Try Ice weak — Archmage I/L Blizzard should increase

**Step 3: Run all tests**

Run: `npm run type-check:all && npx vitest run && cd web && npm test`

**Step 4: Commit**

```
wire element toggles into dashboard
```

---

### Task 6: Add tooltip descriptions for element states

**Files:**
- Modify: `web/src/components/ElementToggles.tsx` — add title/tooltip to buttons

**Step 1: Add tooltips showing current state**

Each button gets a `title` attribute describing its current state:
- Neutral: `"Holy: neutral (click to set weak)"`
- Weak: `"Holy: weak (1.5x damage) — click to set strong"`
- Strong: `"Holy: strong (0.5x damage) — click to reset"`

**Step 2: Run type-check**

Run: `npm run type-check:all`

**Step 3: Commit**

```
add tooltips to element toggle buttons
```

---

### Task 7: Update e2e tests

**Files:**
- Modify: `web/e2e/dashboard.spec.ts` (or relevant e2e file) — update scenario expectations, add element toggle test

**Step 1: Check existing e2e tests for Undead scenario references**

Search for "Undead" in `web/e2e/`. Remove or update any assertions that expect the "Bossing (Undead, 50% PDR)" scenario.

**Step 2: Add basic e2e test for element toggles**

Add a test that:
1. Navigates to dashboard
2. Finds the element toggle buttons
3. Clicks Holy to toggle to "weak"
4. Verifies the button changes appearance
5. Verifies Paladin DPS values change in the table

**Step 3: Run e2e tests**

Run: `cd web && npx playwright test`

**Step 4: Commit**

```
update e2e tests for element toggles
```
