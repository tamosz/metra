# Chain Lightning Bounce Decay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Model Chain Lightning's compounding 70% bounce decay so multi-target DPS reflects actual damage output instead of naive linear scaling.

**Architecture:** Add an optional `bounceDecay` field to `SkillEntry`. When present, `simulate.ts` uses a geometric series instead of flat multiplication for multi-target scaling: `multiplier = (1 - decay^n) / (1 - decay)`. For 6 targets at 0.7 decay this gives ~2.94× instead of 6×.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add bounceDecay to SkillEntry type

**Files:**
- Modify: `src/data/types.ts:56-110` (SkillEntry interface)

**Step 1: Add the field**

Add after the `maxTargets` field (line 93):

```typescript
  /** Per-bounce damage decay multiplier for skills like Chain Lightning.
   *  Each bounce deals this fraction of the previous bounce's damage (e.g., 0.7 = 70%).
   *  When set, multi-target scaling uses geometric series instead of flat multiplication. */
  bounceDecay?: number;
```

**Step 2: Commit**

```bash
git add src/data/types.ts
git commit -m "add bounceDecay field to SkillEntry"
```

---

### Task 2: Use bounceDecay in multi-target scaling

**Files:**
- Modify: `src/proposals/simulate.ts:56-62` (applyTargetCount function)
- Modify: `src/proposals/simulate.ts:141-143` (call site that passes effectiveTargets)
- Test: `src/proposals/simulate.test.ts`

**Step 1: Write the failing test**

Add a new test after the existing `'high-maxTargets skill scales correctly'` test (around line 728):

```typescript
  it('applies bounce decay for Chain Lightning multi-target scaling', () => {
    const config: SimulationConfig = {
      classes: ['archmage-il'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 6', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const chainBuffed = results.find(
      r => r.skillName === 'Chain Lightning' && r.scenario === 'Buffed'
    )!;
    const chainTraining = results.find(
      r => r.skillName === 'Chain Lightning' && r.scenario === 'Training 6'
    )!;

    // Geometric series: (1 - 0.7^6) / (1 - 0.7) ≈ 2.9412
    const expectedMultiplier = (1 - 0.7 ** 6) / (1 - 0.7);
    expect(chainTraining.dps.dps).toBeCloseTo(
      chainBuffed.dps.dps * expectedMultiplier, 0
    );

    // Blizzard has no bounceDecay — still uses flat scaling
    const blizzBuffed = results.find(
      r => r.skillName === 'Blizzard' && r.scenario === 'Buffed'
    )!;
    const blizzTraining = results.find(
      r => r.skillName === 'Blizzard' && r.scenario === 'Training 6'
    )!;
    expect(blizzTraining.dps.dps).toBeCloseTo(blizzBuffed.dps.dps * 6, 0);
  });
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/proposals/simulate.test.ts -t "applies bounce decay"`
Expected: FAIL — Chain Lightning still scales by 6× instead of ~2.94×

**Step 3: Pass bounceDecay through to applyTargetCount**

In `simulate.ts`, change the `applyTargetCount` function signature and body:

```typescript
/**
 * Apply multi-target scaling to a DPS result.
 * effectiveTargets = min(skill.maxTargets, scenario.targetCount).
 * When bounceDecay is set, uses geometric series: (1 - decay^n) / (1 - decay).
 */
function applyTargetCount(dps: DpsResult, effectiveTargets: number, bounceDecay?: number): DpsResult {
  let multiplier: number;
  if (bounceDecay != null && bounceDecay > 0 && bounceDecay < 1) {
    multiplier = (1 - bounceDecay ** effectiveTargets) / (1 - bounceDecay);
  } else {
    multiplier = effectiveTargets;
  }
  return { ...dps, dps: dps.dps * multiplier, averageDamage: dps.averageDamage * multiplier, uncappedDps: dps.uncappedDps * multiplier };
}
```

At the call site (~line 143), pass `skill.bounceDecay`:

```typescript
            if (effectiveTargets > 1) effectiveDps = applyTargetCount(effectiveDps, effectiveTargets, skill.bounceDecay);
```

**Step 4: Run test to verify it still fails**

The test will still fail because `archmage-il.json` doesn't have `bounceDecay` yet. That's expected — we add the data in the next task.

**Step 5: Commit engine change**

```bash
git add src/proposals/simulate.ts src/proposals/simulate.test.ts
git commit -m "support bounce decay in multi-target scaling"
```

---

### Task 3: Add bounceDecay to Chain Lightning data and fix tests

**Files:**
- Modify: `data/skills/archmage-il.json`
- Modify: `src/proposals/simulate.test.ts` (update existing test that asserts 6× scaling)

**Step 1: Add bounceDecay to Chain Lightning**

In `data/skills/archmage-il.json`, add `"bounceDecay": 0.7` to the Chain Lightning skill entry:

```json
    {
      "name": "Chain Lightning",
      "source": "dmg sheet B37: basePower 210, C37: 0.69s. Single-target DPS skill.",
      "basePower": 210,
      "multiplier": 1,
      "hitCount": 1,
      "speedCategory": "Chain Lightning",
      "weaponType": "Staff",
      "element": "Lightning",
      "maxTargets": 6,
      "bounceDecay": 0.7
    },
```

**Step 2: Update the existing test assertion**

The existing test `'high-maxTargets skill scales correctly'` (line 723-724) asserts `chainTraining.dps.dps` equals `chainBuffed.dps.dps * 6`. Update it to use the geometric series:

```typescript
    // Chain Lightning maxTargets: 6, targetCount: 6, bounceDecay: 0.7 → geometric series ≈ 2.94x
    const clExpected = (1 - 0.7 ** 6) / (1 - 0.7);
    expect(chainTraining.dps.dps).toBeCloseTo(chainBuffed.dps.dps * clExpected, 0);
```

**Step 3: Run all tests**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: All tests PASS including the new bounce decay test and the updated existing test.

**Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass. Check snapshot tests — if `integration.test.ts.snap` contains archmage-il multi-target DPS values, update the snapshot with `npx vitest run -u`.

**Step 5: Commit**

```bash
git add data/skills/archmage-il.json src/proposals/simulate.test.ts
git commit -m "add bounce decay to chain lightning"
```

---

### Task 4: Update formulas documentation (web)

**Files:**
- Check: `web/src/components/formulas/DpsFormulaSection.tsx` — if it documents multi-target scaling, add a note about bounce decay

**Step 1: Check if DPS formula section mentions multi-target**

Read `web/src/components/formulas/DpsFormulaSection.tsx` and search for `targetCount` or `maxTargets` references. If the section explains multi-target scaling, add a note like:

> Skills with bounce decay (e.g., Chain Lightning) use a geometric series instead of flat multiplication: `totalMultiplier = (1 - decay^n) / (1 - decay)`.

If multi-target isn't documented in the formulas page, skip this step.

**Step 2: Type-check the web app**

Run: `cd web && npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit (if changes were made)**

```bash
git add web/src/components/formulas/DpsFormulaSection.tsx
git commit -m "document bounce decay in formula reference"
```
