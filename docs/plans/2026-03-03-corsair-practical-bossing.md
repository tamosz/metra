# Corsair Practical Bossing Estimate — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Practical Bossing" bar for Corsair that shows weighted 80/20 Cannon/RF DPS, with a hover disclaimer explaining the assumptions.

**Architecture:** New `mixedRotations` field on `ClassSkillData` defines time-weighted skill mixes. `simulate.ts` computes synthetic results by looking up already-computed individual skill DPS and weighting them. Web UI shows an info tooltip on the mixed rotation entry. Individual Cannon and RF bars remain unchanged.

**Tech Stack:** TypeScript, Vitest, React (web layer)

---

### Task 1: Add MixedRotation types

**Files:**
- Modify: `src/data/types.ts:101-136`

**Step 1: Write the type definitions**

Add after the `SkillEntry` interface (after line 96), before `StatName`:

```typescript
/** A component of a mixed rotation: a skill and what fraction of time is spent on it. */
export interface MixedRotationComponent {
  /** Skill name (must match a SkillEntry.name in the same class). */
  skill: string;
  /** Fraction of time spent on this skill (0–1). All weights in a rotation should sum to 1. */
  weight: number;
}

/** A time-weighted mix of skills, representing a practical rotation estimate. */
export interface MixedRotation {
  /** Display name for the rotation (appears in charts/tables). */
  name: string;
  /** Tooltip text explaining the assumptions behind the rotation estimate. */
  description: string;
  /** Component skills and their time weights. */
  components: MixedRotationComponent[];
}
```

Then add to `ClassSkillData` (after `skills: SkillEntry[];` on line 135):

```typescript
  /** Optional mixed rotation estimates (time-weighted skill blends, not fixed rotation cycles). */
  mixedRotations?: MixedRotation[];
```

**Step 2: Add `description` to `ScenarioResult`**

Modify `src/proposals/types.ts:46-52`. Add a `description` field:

```typescript
export interface ScenarioResult {
  className: string;
  skillName: string;
  tier: string;
  scenario: string;
  dps: DpsResult;
  /** Tooltip description for mixed rotation entries. */
  description?: string;
}
```

**Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS (new types are additive)

**Step 4: Commit**

```
add mixed rotation types
```

---

### Task 2: Add mixed rotation data to Corsair

**Files:**
- Modify: `data/skills/sair.json`

**Step 1: Add `mixedRotations` field**

Add after the `"skills"` array closing bracket (after line 31, before the final `}`):

```json
  "mixedRotations": [
    {
      "name": "Practical Bossing",
      "description": "Estimated 80/20 Cannon/RF split — assumes typical endgame bossing with periodic Battleship destruction (90s cooldown at level 1, 164k HP at level 200)",
      "components": [
        { "skill": "Battleship Cannon", "weight": 0.8 },
        { "skill": "Rapid Fire", "weight": 0.2 }
      ]
    }
  ]
```

**Step 2: Validate JSON parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/skills/sair.json','utf8')); console.log('ok')"`
Expected: `ok`

**Step 3: Commit**

```
add corsair practical bossing rotation data (80/20 cannon/rf)
```

---

### Task 3: Add mixed rotation processing to simulate.ts (TDD)

**Files:**
- Modify: `src/proposals/simulate.ts`
- Create: `src/proposals/simulate.test.ts`

**Step 1: Write the failing test**

Create `src/proposals/simulate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { runSimulation } from './simulate.js';
import type { SimulationConfig } from './simulate.js';
import type {
  ClassSkillData,
  WeaponData,
  AttackSpeedData,
  MWData,
  CharacterBuild,
} from '../data/types.js';

function makeTestFixtures() {
  const classData: ClassSkillData = {
    className: 'TestClass',
    mastery: 0.6,
    primaryStat: 'DEX',
    secondaryStat: 'STR',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 140,
    seCritFormula: 'addBeforeMultiply',
    damageFormula: 'standard',
    skills: [
      {
        name: 'Skill A',
        basePower: 380,
        multiplier: 1.2,
        hitCount: 4,
        speedCategory: 'Battleship Cannon',
        weaponType: 'Gun',
      },
      {
        name: 'Skill B',
        basePower: 200,
        multiplier: 1.2,
        hitCount: 1,
        speedCategory: 'Hurricane',
        weaponType: 'Gun',
      },
    ],
    mixedRotations: [
      {
        name: 'Mixed A+B',
        description: 'Test mixed rotation',
        components: [
          { skill: 'Skill A', weight: 0.8 },
          { skill: 'Skill B', weight: 0.2 },
        ],
      },
    ],
  };

  const build: CharacterBuild = {
    className: 'TestClass',
    baseStats: { STR: 4, DEX: 700, INT: 4, LUK: 4 },
    gearStats: { STR: 40, DEX: 200, INT: 0, LUK: 0 },
    totalWeaponAttack: 100,
    weaponType: 'Gun',
    weaponSpeed: 5,
    attackPotion: 60,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
  };

  const weaponData: WeaponData = {
    types: [
      { name: 'Gun', slashMultiplier: 3.6, stabMultiplier: 3.6 },
    ],
  };

  const attackSpeedData: AttackSpeedData = {
    categories: ['Battleship Cannon', 'Hurricane'],
    entries: [
      { speed: 2, times: { 'Battleship Cannon': 0.6, Hurricane: 0.12 } },
    ],
  };

  const mwData: MWData = [{ level: 20, multiplier: 1.1 }];

  return { classData, build, weaponData, attackSpeedData, mwData };
}

describe('mixed rotations', () => {
  it('creates a weighted DPS entry from component skills', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeTestFixtures();

    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);

    const config: SimulationConfig = {
      classes: ['testclass'],
      tiers: ['high'],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    expect(skillA).toBeDefined();
    expect(skillB).toBeDefined();
    expect(mixed).toBeDefined();

    // Mixed DPS should be 80% of A + 20% of B
    const expectedDps = skillA!.dps.dps * 0.8 + skillB!.dps.dps * 0.2;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
    expect(mixed!.description).toBe('Test mixed rotation');
    expect(mixed!.className).toBe('TestClass');
    expect(mixed!.tier).toBe('high');
  });

  it('skips mixed rotation when component skill is hidden', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeTestFixtures();

    // Mark Skill A as hidden
    classData.skills[0].hidden = true;

    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);

    const config: SimulationConfig = {
      classes: ['testclass'],
      tiers: ['high'],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const mixed = results.find(r => r.skillName === 'Mixed A+B');
    // Should still produce the mixed result — hidden only means the individual
    // skill doesn't show, but it still participates in rotations
    // Actually, hidden skills are skipped in the loop, so we need to compute
    // them separately for mixed rotations. Let's test what happens.
    // For now, if a component is hidden, the mixed rotation should still work
    // by computing the hidden skill's DPS internally.
    expect(mixed).toBeDefined();
  });

  it('applies element modifiers to mixed rotation components', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeTestFixtures();

    // Give Skill A an element
    classData.skills[0].element = 'Fire';

    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);

    const config: SimulationConfig = {
      classes: ['testclass'],
      tiers: ['high'],
      scenarios: [{ name: 'Test', elementModifiers: { Fire: 1.5 } }],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    expect(mixed).toBeDefined();
    // Mixed should use the element-modified DPS of Skill A
    const expectedDps = skillA!.dps.dps * 0.8 + skillB!.dps.dps * 0.2;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: FAIL — no mixed rotation result found

**Step 3: Implement mixed rotation processing in simulate.ts**

Add a new function and integrate it into `runSimulation`. After the `aggregateComboGroups` call (line 167-168), add mixed rotation processing.

Import `MixedRotation` at the top of simulate.ts (line 3):

```typescript
import type {
  ClassSkillData,
  CharacterBuild,
  WeaponData,
  AttackSpeedData,
  MWData,
  SkillEntry,
  MixedRotation,
} from '../data/types.js';
```

Add this function after `aggregateComboGroups` (after line 223):

```typescript
/**
 * Process mixed rotations: create synthetic results by weighting
 * already-computed individual skill DPS values.
 * Unlike comboGroups (fixed rotation cycles), mixed rotations represent
 * time-weighted estimates of how much each skill is used in practice.
 */
function processMixedRotations(
  mixedRotations: MixedRotation[],
  allSkillResults: Map<string, ScenarioResult>,
  className: string,
  tier: string,
  scenario: string,
): ScenarioResult[] {
  const output: ScenarioResult[] = [];

  for (const rotation of mixedRotations) {
    const componentResults: { result: ScenarioResult; weight: number }[] = [];
    let valid = true;

    for (const component of rotation.components) {
      const result = allSkillResults.get(component.skill);
      if (!result) {
        valid = false;
        break;
      }
      componentResults.push({ result, weight: component.weight });
    }

    if (!valid || componentResults.length === 0) continue;

    const weightedDps = componentResults.reduce(
      (sum, { result, weight }) => sum + result.dps.dps * weight,
      0,
    );
    const weightedAvgDamage = componentResults.reduce(
      (sum, { result, weight }) => sum + result.dps.averageDamage * weight,
      0,
    );

    const first = componentResults[0].result;
    output.push({
      className,
      skillName: rotation.name,
      tier,
      scenario,
      description: rotation.description,
      dps: {
        ...first.dps,
        skillName: rotation.name,
        dps: weightedDps,
        averageDamage: weightedAvgDamage,
      },
    });
  }

  return output;
}
```

Now modify the inner loop in `runSimulation` to collect individual skill results for mixed rotation lookup. Replace the block from line 112 to line 168 with:

```typescript
        // Compute DPS for each individual skill
        const skillResults: { skill: SkillEntry; result: ScenarioResult }[] = [];
        // Also index by skill name for mixed rotation lookups
        const skillResultsByName = new Map<string, ScenarioResult>();

        for (const skill of classData.skills) {
          const dps = calculateSkillDps(
            effectiveBuild,
            classData,
            skill,
            weaponData,
            attackSpeedData,
            mwData
          );

          let effectiveDps = scenario.pdr != null ? applyPdr(dps, scenario.pdr) : dps;
          if (scenario.elementModifiers && skill.element) {
            const mod = scenario.elementModifiers[skill.element] ?? 1;
            if (mod !== 1) effectiveDps = applyElementModifier(effectiveDps, mod);
          } else if (scenario.elementModifiers && skill.elementOptions) {
            const bestMod = Math.max(
              ...skill.elementOptions.map(e => scenario.elementModifiers![e] ?? 1)
            );
            if (bestMod !== 1) effectiveDps = applyElementModifier(effectiveDps, bestMod);
          }
          if (scenario.targetCount != null && scenario.targetCount > 1) {
            const effectiveTargets = Math.min(skill.maxTargets ?? 1, scenario.targetCount);
            if (effectiveTargets > 1) effectiveDps = applyTargetCount(effectiveDps, effectiveTargets);
          }
          if (scenario.bossAttackInterval != null && scenario.bossAttackInterval > 0) {
            const dodgeChance = calculateDodgeChance(
              effectiveBuild.avoidability ?? 0,
              scenario.bossAccuracy ?? Infinity
            );
            const kbProb = calculateKnockbackProbability(
              dodgeChance,
              classData.stanceRate ?? 0,
              classData.shadowShifterRate ?? 0
            );
            const recovery = getKnockbackRecovery(skill, effectiveDps.attackTime);
            const uptime = calculateKnockbackUptime(kbProb, scenario.bossAttackInterval, recovery);
            effectiveDps = applyKnockbackUptime(effectiveDps, uptime);
          }

          const result: ScenarioResult = {
            className: classData.className,
            skillName: skill.name,
            tier,
            scenario: scenario.name,
            dps: effectiveDps,
          };

          // Store for mixed rotation lookups (all skills, including hidden)
          skillResultsByName.set(skill.name, result);

          if (!skill.hidden) {
            skillResults.push({ skill, result });
          }
        }

        // Aggregate comboGroup skills: sum DPS for skills sharing the same group
        const grouped = aggregateComboGroups(skillResults);
        results.push(...grouped);

        // Process mixed rotations (time-weighted skill blends)
        if (classData.mixedRotations) {
          const mixedResults = processMixedRotations(
            classData.mixedRotations,
            skillResultsByName,
            classData.className,
            tier,
            scenario.name,
          );
          results.push(...mixedResults);
        }
```

Key change: compute DPS for ALL skills (including hidden) and store in `skillResultsByName`, but only add non-hidden skills to `skillResults` for combo aggregation. This ensures mixed rotations can reference any skill.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/proposals/simulate.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All existing tests pass

**Step 6: Commit**

```
add mixed rotation processing to simulation engine
```

---

### Task 4: Verify Corsair practical bossing DPS (integration)

**Files:**
- Modify: `src/proposals/simulate.test.ts` (or check via CLI)

**Step 1: Run simulation and verify output**

Run: `npm run simulate`
Expected: "Practical Bossing" appears in the Corsair section with DPS = Cannon × 0.8 + RF × 0.2.

At high tier: ~350,586 × 0.8 + ~241,520 × 0.2 = ~280,469 + ~48,304 = ~328,773

Verify the value is in the right ballpark.

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Commit**

```
verify corsair practical bossing output
```

(Only commit if test changes were made; skip if just verification.)

---

### Task 5: Add tooltip for mixed rotation entries in the web app

**Files:**
- Modify: `web/src/components/Dashboard.tsx:164-257` (RankingTable)
- Modify: `web/src/components/DpsChart.tsx:93-108` (chart tooltip)

**Step 1: Pass description through to RankingTable**

The `RankingTable` component currently types its `data` prop inline (line 168). It needs to include the optional `description` field.

Update the RankingTable props type at line 168:

```typescript
  data: { className: string; skillName: string; tier: string; dps: { dps: number }; description?: string }[];
```

**Step 2: Add info icon next to skill name in RankingTable**

Import the Tooltip component at the top of Dashboard.tsx:

```typescript
import { Tooltip } from './Tooltip.js';
```

Update the skill name cell at line 239:

```tsx
<td className="px-3 py-2 text-text-secondary">
  {r.skillName}
  {r.description && <Tooltip text={r.description} />}
</td>
```

**Step 3: Add description to DpsChart tooltip**

In DpsChart.tsx, update the `chartData` mapping (line 22-29) to include `description`:

```typescript
  const chartData = data.map((r) => ({
    label: `${r.className} — ${r.skillName}`,
    sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
    uid: `${r.className} — ${r.skillName} [${r.tier}]`,
    dps: Math.round(r.dps.dps),
    className: r.className,
    description: (r as { description?: string }).description,
  }));
```

Update the tooltip content (lines 97-106) to show description when present:

```tsx
<div className="rounded-md border border-border-active bg-bg-surface p-3 text-xs">
  <div className="font-semibold" style={{ color: getClassColor(d.className) }}>
    {d.className}
  </div>
  <div className="text-text-secondary">{d.sublabel}</div>
  <div className="mt-1 tabular-nums">
    {d.dps.toLocaleString()} DPS
  </div>
  {d.description && (
    <div className="mt-1.5 border-t border-border-subtle pt-1.5 text-text-dim leading-relaxed">
      {d.description}
    </div>
  )}
</div>
```

**Step 4: Run web type-check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

**Step 5: Run web tests**

Run: `cd web && npm test`
Expected: All tests pass

**Step 6: Verify visually**

Run: `cd web && npm run dev`
Check: "Practical Bossing" bar appears for Corsair. Hover shows description in chart tooltip. Ranking table shows "?" tooltip next to skill name.

**Step 7: Commit**

```
add tooltip for mixed rotation entries in web dashboard
```

---

### Task 6: Final verification and cleanup

**Step 1: Run full engine tests**

Run: `npx vitest run`
Expected: All pass

**Step 2: Run web tests**

Run: `cd web && npm test`
Expected: All pass

**Step 3: Run both type-checks**

Run: `npm run type-check:all`
Expected: PASS

**Step 4: Commit all remaining changes and push**

Push to main per personal project rules.
