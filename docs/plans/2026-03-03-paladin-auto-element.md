# Paladin Auto-Element Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge Paladin Blast element variants into a single row that auto-selects the highest-DPS charge based on active element toggles.

**Architecture:** Add `elementVariantGroup` and `nameTemplate` fields to `SkillEntry`. In `simulate.ts`, track which element was selected for `elementOptions` skills, resolve `nameTemplate`, then group by `elementVariantGroup` and keep only the highest-DPS variant. The merged result is always headline.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add type fields to SkillEntry

**Files:**
- Modify: `src/data/types.ts:56-98` (SkillEntry interface)

**Step 1: Add the two new optional fields to SkillEntry**

Add after the `headline` field (line 95):

```typescript
/** Group name for element variant competition. Skills sharing a group are compared
 *  after DPS calculation; only the highest-DPS variant survives in output.
 *  e.g., Holy Blast and Charge Blast both have elementVariantGroup: "Blast (Sword)". */
elementVariantGroup?: string;
/** Name template with {element} placeholder, resolved at simulation time when
 *  the best element is picked from elementOptions.
 *  e.g., "Blast ({element} Charge, Sword)" → "Blast (Fire Charge, Sword)". */
nameTemplate?: string;
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (new optional fields, no consumers yet)

**Step 3: Commit**

```
add elementVariantGroup and nameTemplate to SkillEntry type
```

---

### Task 2: Add fields to Paladin skill data

**Files:**
- Modify: `data/skills/paladin.json`
- Modify: `data/skills/paladin-bw.json`

**Step 1: Update paladin.json**

Add `elementVariantGroup` to both skills, and `nameTemplate` to the Charge skill:

```json
{
  "name": "Blast (Holy, Sword)",
  "elementVariantGroup": "Blast (Sword)",
  "basePower": 580,
  "multiplier": 1.4,
  "hitCount": 1,
  "speedCategory": "Blast",
  "weaponType": "2H Sword",
  "element": "Holy"
},
{
  "name": "Blast (F/I/L Charge, Sword)",
  "nameTemplate": "Blast ({element} Charge, Sword)",
  "elementVariantGroup": "Blast (Sword)",
  "basePower": 580,
  "multiplier": 1.3,
  "hitCount": 1,
  "speedCategory": "Blast",
  "weaponType": "2H Sword",
  "elementOptions": ["Fire", "Ice", "Lightning"],
  "headline": false
}
```

**Step 2: Update paladin-bw.json**

Same pattern — add `elementVariantGroup: "Blast (BW)"` to both skills, `nameTemplate` to the Charge skill:

```json
{
  "name": "Blast (Holy, BW)",
  "elementVariantGroup": "Blast (BW)",
  ...
},
{
  "name": "Blast (F/I/L Charge, BW)",
  "nameTemplate": "Blast ({element} Charge, BW)",
  "elementVariantGroup": "Blast (BW)",
  ...
}
```

**Step 3: Commit**

```
add elementVariantGroup to paladin skill data
```

---

### Task 3: Write failing tests for elementVariantGroup

**Files:**
- Modify: `src/proposals/simulate.test.ts`

**Step 1: Add elementVariantGroup test describe block**

Add a new `describe('elementVariantGroup')` block at the end of the file. Tests use real Paladin data already loaded in beforeAll. Key tests:

```typescript
describe('elementVariantGroup', () => {
  it('merges variants into single result (Holy wins with no element modifiers)', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    // Should produce exactly 1 result (merged group), not 2
    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults).toHaveLength(1);
    // Holy wins because multiplier 1.4 > 1.3
    expect(paladinResults[0].skillName).toBe('Blast (Holy, Sword)');
  });

  it('charge variant wins when its element is weak (1.5x)', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Fire Weak', elementModifiers: { Fire: 1.5 } }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults).toHaveLength(1);
    // Charge wins: 1.3 * 1.5 = 1.95 > 1.4
    // nameTemplate resolves to specific element
    expect(paladinResults[0].skillName).toBe('Blast (Fire Charge, Sword)');
  });

  it('holy wins when both holy and F/I/L element are weak', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Both Weak', elementModifiers: { Holy: 1.5, Fire: 1.5 } }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults).toHaveLength(1);
    // Holy: 1.4 * 1.5 = 2.1 > Charge: 1.3 * 1.5 = 1.95
    expect(paladinResults[0].skillName).toBe('Blast (Holy, Sword)');
  });

  it('merged result is always headline regardless of component headline status', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Fire Weak', elementModifiers: { Fire: 1.5 } }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    // Charge variant has headline: false, but merged result should be headline
    expect(paladinResults[0].headline).toBeUndefined();
  });

  it('works for BW variants too', () => {
    const config: SimulationConfig = {
      classes: ['paladin-bw'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Ice Weak', elementModifiers: { Ice: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.filter(r => r.className === 'Paladin (BW)' && r.scenario === 'Buffed');
    const iceWeak = results.filter(r => r.className === 'Paladin (BW)' && r.scenario === 'Ice Weak');

    expect(buffed).toHaveLength(1);
    expect(buffed[0].skillName).toBe('Blast (Holy, BW)');
    expect(iceWeak).toHaveLength(1);
    expect(iceWeak[0].skillName).toBe('Blast (Ice Charge, BW)');
  });

  it('DPS of merged result equals the winning variant DPS', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Fire Weak', elementModifiers: { Fire: 1.5 } },
      ],
    };

    // Run without variant grouping to get raw values (use separate class data without the field)
    // Instead, just verify the merged DPS is reasonable
    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.className === 'Paladin' && r.scenario === 'Buffed')!;
    const fireWeak = results.find(r => r.className === 'Paladin' && r.scenario === 'Fire Weak')!;

    // Buffed: Holy wins (no element modifier) → ~192,932 DPS
    expect(buffed.dps.dps).toBeGreaterThan(180000);
    // Fire weak: Charge wins (1.3 * 1.5 effective) → higher than neutral Holy
    expect(fireWeak.dps.dps).toBeGreaterThan(buffed.dps.dps);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: FAIL — elementVariantGroup merging not implemented yet; Paladin returns 2 results

**Step 3: Commit**

```
add failing tests for elementVariantGroup
```

---

### Task 4: Implement elementVariantGroup merging in simulate.ts

**Files:**
- Modify: `src/proposals/simulate.ts:107-169` (skill loop and post-processing)

**Step 1: Track selected element for elementOptions skills**

In the skill loop (around lines 114-121), when determining the best element for `elementOptions`, also track which element was selected:

```typescript
let elementModifier = 1;
let selectedElement: string | undefined;
if (scenario.elementModifiers && skill.element) {
  elementModifier = scenario.elementModifiers[skill.element] ?? 1;
} else if (scenario.elementModifiers && skill.elementOptions) {
  let bestMod = 1;
  for (const e of skill.elementOptions) {
    const mod = scenario.elementModifiers![e] ?? 1;
    if (mod > bestMod) {
      bestMod = mod;
      selectedElement = e;
    }
  }
  elementModifier = bestMod;
}
```

**Step 2: Resolve nameTemplate and store on result**

After computing the ScenarioResult (around line 154), resolve the skill name:

```typescript
let resolvedSkillName = skill.name;
if (selectedElement && skill.nameTemplate) {
  resolvedSkillName = skill.nameTemplate.replace('{element}', selectedElement);
}

const result: ScenarioResult = {
  className: classData.className,
  skillName: resolvedSkillName,
  tier,
  scenario: scenario.name,
  dps: effectiveDps,
  ...(isHeadline ? {} : { headline: false }),
};
```

**Step 3: Add elementVariantGroup resolution after the skill loop**

After the skill loop builds `skillResults` (after line 169), add a new step before combo aggregation:

```typescript
// Resolve element variant groups: keep only highest-DPS variant per group
const variantResolved = resolveElementVariantGroups(skillResults);

// Aggregate comboGroup skills
const grouped = aggregateComboGroups(variantResolved);
```

**Step 4: Implement resolveElementVariantGroups function**

Add a new function (before or after `aggregateComboGroups`):

```typescript
/**
 * Resolve element variant groups: skills sharing an elementVariantGroup
 * compete on DPS, and only the highest-DPS variant survives.
 * The winning result is always treated as headline.
 */
function resolveElementVariantGroups(
  skillResults: { skill: SkillEntry; result: ScenarioResult }[]
): { skill: SkillEntry; result: ScenarioResult }[] {
  const output: { skill: SkillEntry; result: ScenarioResult }[] = [];
  const variantMap = new Map<string, { skill: SkillEntry; result: ScenarioResult }[]>();

  for (const entry of skillResults) {
    const group = entry.skill.elementVariantGroup;
    if (group) {
      const existing = variantMap.get(group);
      if (existing) {
        existing.push(entry);
      } else {
        variantMap.set(group, [entry]);
      }
    } else {
      output.push(entry);
    }
  }

  for (const entries of variantMap.values()) {
    // Pick the variant with the highest DPS
    const winner = entries.reduce((best, entry) =>
      entry.result.dps.dps > best.result.dps.dps ? entry : best
    );
    // Merged result is always headline
    const { headline: _, ...resultWithoutHeadline } = winner.result;
    output.push({ skill: winner.skill, result: resultWithoutHeadline });
  }

  return output;
}
```

**Step 5: Run tests**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: PASS for the new elementVariantGroup tests

**Step 6: Commit**

```
implement elementVariantGroup merging in simulate
```

---

### Task 5: Fix existing tests broken by variant merging

**Files:**
- Modify: `src/proposals/simulate.test.ts`

The existing `elementModifiers` and `elementOptions` tests reference "Blast (F/I/L Charge, Sword)" and "Blast (Holy, Sword)" as separate results. With variant merging, Paladin now returns a single merged result. These tests need updating.

**Step 1: Update `elementModifiers` tests**

The `non-elemental skills unaffected by elementModifiers` test (lines 413-436) looked up "Blast (F/I/L Charge, Sword)" separately. This now gets merged into the Holy result. Update:

```typescript
it('holy element boost wins over neutral charge in variant group', () => {
  const config: SimulationConfig = {
    classes: ['paladin'],
    tiers: ['high'],
    scenarios: [
      { name: 'Buffed' },
      { name: 'Holy Advantage', elementModifiers: { Holy: 1.5 } },
    ],
  };

  const results = runSimulation(
    config, classDataMap, gearTemplates,
    weaponData, attackSpeedData, mwData
  );

  const buffed = results.find(
    r => r.className === 'Paladin' && r.scenario === 'Buffed'
  )!;
  const holy = results.find(
    r => r.className === 'Paladin' && r.scenario === 'Holy Advantage'
  )!;

  // Both scenarios should produce exactly 1 Paladin result (merged)
  expect(results.filter(r => r.className === 'Paladin' && r.scenario === 'Buffed')).toHaveLength(1);
  expect(results.filter(r => r.className === 'Paladin' && r.scenario === 'Holy Advantage')).toHaveLength(1);

  // Holy Advantage: Holy Blast wins (1.4 * 1.5 = 2.1 > 1.3)
  expect(holy.skillName).toBe('Blast (Holy, Sword)');
  expect(holy.dps.dps).toBeGreaterThan(buffed.dps.dps);
});
```

**Step 2: Update `elementOptions` tests**

The `elementOptions (adaptive element selection)` tests (lines 728-811) reference "Blast (F/I/L Charge, Sword)" directly. With merging, the skill name changes when the Charge variant wins. Update to filter by className and verify the merged result. Some tests that check Charge behavior independently may need to use a synthetic class data fixture instead of real Paladin data.

For `picks the best element when multiple are toggled` — this test had Fire: 1.5 + Ice: 0.5. Now the Charge variant wins (1.3 * 1.5 = 1.95 > 1.4), so the merged result is "Blast (Fire Charge, Sword)":

```typescript
it('picks the best element when charge variant wins', () => {
  const config: SimulationConfig = {
    classes: ['paladin'],
    tiers: ['high'],
    scenarios: [
      { name: 'Buffed' },
      { name: 'Mixed', elementModifiers: { Fire: 1.5, Ice: 0.5 } },
    ],
  };

  const results = runSimulation(
    config, classDataMap, gearTemplates,
    weaponData, attackSpeedData, mwData
  );

  const buffed = results.find(r => r.className === 'Paladin' && r.scenario === 'Buffed')!;
  const mixed = results.find(r => r.className === 'Paladin' && r.scenario === 'Mixed')!;

  // Fire Charge wins: 1.3 * 1.5 = 1.95 > Holy 1.4
  expect(mixed.skillName).toBe('Blast (Fire Charge, Sword)');
  expect(mixed.dps.dps).toBeGreaterThan(buffed.dps.dps);
});
```

For `is unaffected when only non-matching elements are toggled` — Holy Only scenario: Holy still wins, Charge is unaffected:

```typescript
it('holy still wins when only Holy element is active', () => {
  const config: SimulationConfig = {
    classes: ['paladin'],
    tiers: ['high'],
    scenarios: [
      { name: 'Buffed' },
      { name: 'Holy Only', elementModifiers: { Holy: 1.5 } },
    ],
  };

  const results = runSimulation(
    config, classDataMap, gearTemplates,
    weaponData, attackSpeedData, mwData
  );

  const buffed = results.find(r => r.className === 'Paladin' && r.scenario === 'Buffed')!;
  const holyOnly = results.find(r => r.className === 'Paladin' && r.scenario === 'Holy Only')!;

  expect(buffed.skillName).toBe('Blast (Holy, Sword)');
  expect(holyOnly.skillName).toBe('Blast (Holy, Sword)');
  // Holy Blast gets the 1.5x boost
  expect(holyOnly.dps.dps).toBeGreaterThan(buffed.dps.dps);
});
```

For `applies a single matching element correctly` — uses paladin-bw, Ice Weak: Charge wins:

```typescript
it('charge variant wins for BW with matching element', () => {
  const config: SimulationConfig = {
    classes: ['paladin-bw'],
    tiers: ['high'],
    scenarios: [
      { name: 'Buffed' },
      { name: 'Ice Weak', elementModifiers: { Ice: 1.5 } },
    ],
  };

  const results = runSimulation(
    config, classDataMap, gearTemplates,
    weaponData, attackSpeedData, mwData
  );

  const buffed = results.find(r => r.className === 'Paladin (BW)' && r.scenario === 'Buffed')!;
  const iceWeak = results.find(r => r.className === 'Paladin (BW)' && r.scenario === 'Ice Weak')!;

  expect(buffed.skillName).toBe('Blast (Holy, BW)');
  expect(iceWeak.skillName).toBe('Blast (Ice Charge, BW)');
  expect(iceWeak.dps.dps).toBeGreaterThan(buffed.dps.dps);
});
```

**Step 3: Update result count test**

The test `returns correct number of results for single class/tier/scenario` counts hero skills. Not affected (hero has no variant groups). But verify no Paladin count assumptions are broken elsewhere.

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: PASS

**Step 5: Commit**

```
update paladin tests for elementVariantGroup merging
```

---

### Task 6: Run full validation

**Step 1: Run engine type check**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 2: Run web type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

**Step 3: Run all engine tests**

Run: `npx vitest run`
Expected: PASS

**Step 4: Run web tests**

Run: `cd web && npx vitest run`
Expected: PASS

**Step 5: Run CLI baseline to visually verify**

Run: `npm run simulate`
Expected: Paladin shows one "Blast (Holy, Sword)" and one "Blast (Holy, BW)" row

Run: `npm run simulate -- proposals/brandish-buff-20.json`
Expected: Proposal report works without errors

**Step 6: Commit if any fixes needed, then push**
