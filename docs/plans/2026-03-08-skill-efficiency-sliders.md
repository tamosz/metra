# Skill Efficiency Sliders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add configurable skill efficiency sliders so players can adjust Corsair's Cannon/RF split and DrK's Berserk uptime instead of using hardcoded assumptions.

**Architecture:** Extend `ScenarioConfig` with `efficiencyOverrides` to override mixed rotation weights at simulation time. Split DrK's Crusher into zerked/unzerked variants with a new mixed rotation. Add a collapsible "Skill Efficiency" panel to the web filter bar that auto-discovers all mixed rotations.

**Tech Stack:** TypeScript engine changes, React components, Vitest tests.

---

### Task 1: Split DrK Crusher into zerked/unzerked variants

**Files:**
- Modify: `data/skills/drk.json`

**Step 1: Update drk.json**

Replace the single Crusher skill with two variants and a mixed rotation:

```json
{
  "source": "dmg sheet row 27, range calculator (mastery 0.8). Berserk 2.1x from royals.ms Update #68 (https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)",
  "className": "DrK",
  "mastery": 0.8,
  "primaryStat": "STR",
  "secondaryStat": "DEX",
  "sharpEyesCritRate": 0.15,
  "sharpEyesCritDamageBonus": 140,
  "seCritFormula": "addBeforeMultiply",
  "damageFormula": "standard",
  "stanceRate": 0.9,
  "skills": [
    {
      "name": "Spear Crusher (Zerked)",
      "basePower": 170,
      "multiplier": 2.1,
      "hitCount": 3,
      "speedCategory": "Crusher",
      "weaponType": "Spear",
      "attackType": "stab",
      "maxTargets": 3,
      "headline": false
    },
    {
      "name": "Spear Crusher",
      "basePower": 170,
      "multiplier": 1.0,
      "hitCount": 3,
      "speedCategory": "Crusher",
      "weaponType": "Spear",
      "attackType": "stab",
      "maxTargets": 3,
      "headline": false
    }
  ],
  "mixedRotations": [
    {
      "name": "Berserk Crusher",
      "description": "Weighted average of zerked (2.1x) and unzerked Crusher. Adjust Berserk uptime in the Skill Efficiency panel.",
      "components": [
        { "skill": "Spear Crusher (Zerked)", "weight": 0.9 },
        { "skill": "Spear Crusher", "weight": 0.1 }
      ]
    }
  ]
}
```

**Step 2: Run tests**

Run: `npx vitest run`
Expected: Some DrK-specific tests may fail because the skill name changed from "Spear Crusher" to "Berserk Crusher" in headline output. Fix any broken assertions.

**Step 3: Commit**

```
split drk crusher into zerked/unzerked variants with mixed rotation
```

---

### Task 2: Add `efficiencyOverrides` to ScenarioConfig

**Files:**
- Modify: `src/proposals/types.ts:28-43`

**Step 1: Add the field to ScenarioConfig**

Add after the `bossAccuracy` field:

```typescript
  /** Override mixed rotation weights. Key: "ClassName.Rotation Name", value: weight array matching component order. */
  efficiencyOverrides?: Record<string, number[]>;
```

**Step 2: Commit**

```
add efficiencyOverrides to ScenarioConfig
```

---

### Task 3: Wire efficiency overrides into processMixedRotations

**Files:**
- Modify: `src/proposals/simulate.ts:309-371` (processMixedRotations signature + weight override logic)
- Modify: `src/proposals/simulate.ts:191-199` (call site passes scenario)
- Test: `src/proposals/simulate.test.ts`

**Step 1: Write the failing test**

Add to the `mixed rotations` describe block in `simulate.test.ts`:

```typescript
  it('uses efficiencyOverrides when provided', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);
    const config: SimulationConfig = {
      classes: ['testclass'],
      tiers: ['high'],
      scenarios: [{
        name: 'Custom',
        efficiencyOverrides: { 'TestClass.Mixed A+B': [0.5, 0.5] },
      }],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    expect(mixed).toBeDefined();
    const expectedDps = skillA!.dps.dps * 0.5 + skillB!.dps.dps * 0.5;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
  });

  it('ignores malformed efficiencyOverrides (wrong array length)', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);
    const config: SimulationConfig = {
      classes: ['testclass'],
      tiers: ['high'],
      scenarios: [{
        name: 'Bad Override',
        efficiencyOverrides: { 'TestClass.Mixed A+B': [0.5] },  // wrong length
      }],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    // Should fall back to default 0.8/0.2 weights
    const expectedDps = skillA!.dps.dps * 0.8 + skillB!.dps.dps * 0.2;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
  });
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: FAIL — `efficiencyOverrides` doesn't exist on `ScenarioConfig` yet (added in Task 2), and `processMixedRotations` doesn't read it.

**Step 3: Implement the override logic**

Update `processMixedRotations` signature to accept the scenario:

```typescript
function processMixedRotations(
  mixedRotations: MixedRotation[],
  allSkillResults: Map<string, ScenarioResult>,
  className: string,
  tier: string,
  scenario: ScenarioConfig,
): ScenarioResult[] {
```

Inside the function, after `for (const rotation of mixedRotations) {`, add weight override resolution:

```typescript
    // Check for efficiency override
    const overrideKey = `${className}.${rotation.name}`;
    const override = scenario.efficiencyOverrides?.[overrideKey];
    const useOverride = override && override.length === rotation.components.length;
```

Change the weight lookup in the component loop from `component.weight` to:

```typescript
      componentResults.push({
        result,
        weight: useOverride ? override![idx] : component.weight,
      });
```

(Add `idx` via `.forEach` or index tracking in the loop.)

Update the call site at line ~192 to pass `scenario` instead of `scenario.name`:

```typescript
        const mixedResults = processMixedRotations(
          classData.mixedRotations,
          skillResultsByName,
          classData.className,
          tier,
          scenario,
        );
```

Inside the function, update the output push to use `scenario.name` instead of the `scenario` string parameter.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: PASS

**Step 5: Commit**

```
wire efficiency overrides into mixed rotation processing
```

---

### Task 4: Add efficiency overrides to SimulationControlsContext

**Files:**
- Modify: `web/src/context/SimulationControlsContext.tsx`

**Step 1: Add state to context**

Add to `SimulationControlsContextType` interface:

```typescript
  efficiencyOverrides: Record<string, number[]>;
  setEfficiencyOverrides: (overrides: Record<string, number[]>) => void;
```

Add state in provider:

```typescript
  const [efficiencyOverrides, setEfficiencyOverrides] = useState<Record<string, number[]>>({});
```

Add to the `value` useMemo and its dependency array.

**Step 2: Commit**

```
add efficiency overrides to simulation controls context
```

---

### Task 5: Pass efficiency overrides through useSimulation

**Files:**
- Modify: `web/src/hooks/useSimulation.ts:27-92`

**Step 1: Add parameter and wire into scenarios**

Add `efficiencyOverrides` as a new parameter to `useSimulation`:

```typescript
export function useSimulation(
  targetCount?: number,
  elementModifiers?: Record<string, number>,
  buffOverrides?: BuffOverrides,
  kbConfig?: KbConfig,
  cgsOverride?: { tier: string; values: CgsValues },
  efficiencyOverrides?: Record<string, number[]>,
): SimulationData {
```

When building scenarios, add:

```typescript
  const hasEfficiencyOverrides = efficiencyOverrides && Object.keys(efficiencyOverrides).length > 0;
  // ... after building each scenario:
  if (hasEfficiencyOverrides) scenario.efficiencyOverrides = { ...efficiencyOverrides };
  // Same for the training scenario
```

Add `efficiencyOverrides` to the useMemo dependency array.

**Step 2: Update the call site**

Find where `useSimulation` is called (likely `App.tsx` or wherever the Dashboard gets its simulation data) and pass `efficiencyOverrides` from context.

**Step 3: Commit**

```
pass efficiency overrides through useSimulation hook
```

---

### Task 6: Build the EfficiencyPanel component

**Files:**
- Create: `web/src/components/EfficiencyPanel.tsx`

**Step 1: Implement the component**

The component should:
1. Import `discoveredData` from `../data/bundle.js` to scan all class data for `mixedRotations`
2. Import `useSimulationControls` for reading/writing `efficiencyOverrides`
3. Build a list of all configurable rotations: `{ className, rotationName, components, defaultWeights }`
4. Render a collapsible section with a chevron toggle
5. For each rotation, render a range slider (0–100) representing the first component's weight

UI structure:
```tsx
<div className="flex flex-col gap-1">
  <button onClick={toggle} className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-text-dim">
    Skill Efficiency
    <ChevronIcon expanded={expanded} />
  </button>
  {expanded && (
    <div className="flex flex-col gap-2 rounded border border-border-default bg-bg-raised p-2">
      {rotations.map(r => (
        <div key={`${r.className}.${r.rotationName}`} className="flex items-center gap-2">
          <span className="text-xs text-text-dim whitespace-nowrap">{r.className}:</span>
          <input type="range" min={0} max={100} value={...} onChange={...}
            className="h-1 w-24 accent-emerald-500" />
          <span className="text-xs tabular-nums text-text-muted w-24">{label}</span>
        </div>
      ))}
    </div>
  )}
</div>
```

For the label:
- DrK Berserk: `"90% zerked"` (show first component weight as percentage)
- Corsair Cannon/RF: `"80% Cannon / 20% RF"` (show both names)

Use the component names from `rotation.components` to build the label. For 2-component rotations, show both. For others, show the first component percentage.

When the slider changes, compute the new weights array (first component = slider/100, second = 1 - slider/100) and update `efficiencyOverrides` with key `"ClassName.RotationName"`. When slider matches the default weights, remove the key from overrides (so defaults don't pollute the config).

**Step 2: Commit**

```
add EfficiencyPanel component with auto-discovered sliders
```

---

### Task 7: Add EfficiencyPanel to Dashboard filter bar

**Files:**
- Modify: `web/src/components/Dashboard.tsx:56-81`

**Step 1: Import and render**

Add import:
```typescript
import { EfficiencyPanel } from './EfficiencyPanel.js';
```

Add after `<AllSkillsToggle>` in the filter bar div:
```tsx
<EfficiencyPanel />
```

**Step 2: Run the web app and verify**

Run: `cd web && npm run dev`
- Verify the "Skill Efficiency" section appears collapsed in the filter bar
- Expand it — should show DrK Berserk (90% default) and Corsair Cannon/RF (80% default) sliders
- Adjust sliders and confirm DPS rankings update
- Verify DrK shows "Berserk Crusher" as headline, individual Crusher variants hidden
- Verify Corsair still shows "Practical Bossing" as headline

**Step 3: Commit**

```
add efficiency panel to dashboard filter bar
```

---

### Task 8: Fix broken tests

**Files:**
- Modify: any test files that reference DrK's old "Spear Crusher" skill name in headline output

**Step 1: Run full test suite**

Run: `npx vitest run` and `cd web && npx vitest run`

**Step 2: Fix any failing tests**

DrK tests that previously expected `skillName === 'Spear Crusher'` now need to expect `'Berserk Crusher'` (the mixed rotation name). Individual skills are `headline: false`.

Also check that the DrK DPS value has changed slightly — the default is now 90% zerked instead of 100%, so the headline DPS will be ~10% × unzerked-portion lower. Update reference values in tests if needed.

**Step 3: Run tests again**

Run: `npx vitest run` and `cd web && npx vitest run`
Expected: all pass

**Step 4: Commit**

```
fix tests for drk berserk crusher mixed rotation
```

---

### Task 9: Type-check and final verification

**Step 1: Type-check everything**

Run: `npm run type-check:all`
Expected: no errors

**Step 2: Run all tests**

Run: `npx vitest run` and `cd web && npx vitest run`
Expected: all pass

**Step 3: Manual web verification**

Run: `cd web && npm run dev`
- Collapse/expand the efficiency panel
- Slide DrK Berserk to 0% — should show a much lower DPS
- Slide to 100% — should match the old "always zerked" value
- Slide Corsair to 100% Cannon — should match Battleship Cannon DPS
- Slide to 0% Cannon — should match Rapid Fire DPS
- Verify "Show All Skills" reveals the individual hidden skills

**Step 4: Commit any remaining fixes**

---

### Notes for implementer

- `processMixedRotations` is currently a private function in `simulate.ts`. It stays private — the override flows through `ScenarioConfig`.
- The auto-discovery approach means adding a mixed rotation to any class JSON automatically creates a slider. No UI code changes needed for future classes.
- DrK's default Berserk uptime is **90%**, not 100%. This was a deliberate design choice — 100% uptime isn't realistic.
- URL encoding of efficiency overrides is a nice-to-have but not in scope for this plan. Can be added later if needed.
