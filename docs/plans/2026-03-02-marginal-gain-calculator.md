# Marginal Gain Calculator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "What to upgrade next?" section to the Build Explorer that shows DPS gain per +1 of each stat axis.

**Architecture:** New pure function in `src/engine/marginal.ts` computes DPS deltas by perturbing one stat at a time. New React component `MarginalGainsTable` renders the results below the existing DPS table in the Build Explorer.

**Tech Stack:** TypeScript engine function + React component (Tailwind CSS). No new dependencies.

---

### Task 1: Engine — marginal gain calculation

**Files:**
- Create: `src/engine/marginal.ts`
- Create: `src/engine/marginal.test.ts`

**Step 1: Write the failing test**

Create `src/engine/marginal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateMarginalGains } from './marginal.js';
import type { CharacterBuild, ClassSkillData, SkillEntry, WeaponData, AttackSpeedData, MWData } from '../data/types.js';
import { loadWeapons, loadAttackSpeed, loadMW, loadClassSkills, loadGearTemplate } from '../data/loader.js';

const weaponData = loadWeapons();
const attackSpeedData = loadAttackSpeed();
const mwData = loadMW();

describe('calculateMarginalGains', () => {
  it('returns gains for WATK, primary, and secondary stats', () => {
    const classData = loadClassSkills('hero');
    const build = loadGearTemplate('hero', 'high');
    const skill = classData.skills.find(s => s.name === 'Brandish (Sword)')!;

    const gains = calculateMarginalGains(build, classData, skill, weaponData, attackSpeedData, mwData);

    // Should have 3 entries: WATK, STR (primary), DEX (secondary)
    expect(gains).toHaveLength(3);
    expect(gains.map(g => g.stat)).toEqual(expect.arrayContaining(['WATK', 'STR', 'DEX']));

    // All gains should be positive
    for (const g of gains) {
      expect(g.dpsGain).toBeGreaterThan(0);
      expect(g.percentGain).toBeGreaterThan(0);
      expect(g.currentValue).toBeGreaterThan(0);
    }

    // Should be sorted by dpsGain descending
    for (let i = 1; i < gains.length; i++) {
      expect(gains[i - 1].dpsGain).toBeGreaterThanOrEqual(gains[i].dpsGain);
    }
  });

  it('shows WATK for mages (maps to MATK internally)', () => {
    const classData = loadClassSkills('archmage-il');
    const build = loadGearTemplate('archmage-il', 'high');
    const skill = classData.skills.find(s => s.name === 'Chain Lightning')!;

    const gains = calculateMarginalGains(build, classData, skill, weaponData, attackSpeedData, mwData);

    // Mages: WATK (displayed as MATK conceptually, but field is totalWeaponAttack),
    // INT (primary), LUK (secondary)
    expect(gains.map(g => g.stat)).toEqual(expect.arrayContaining(['WATK', 'INT', 'LUK']));
  });

  it('lists each secondary stat separately for multi-secondary classes', () => {
    const classData = loadClassSkills('shadower');
    const build = loadGearTemplate('shadower', 'high');
    const skill = classData.skills.find(s => s.name === 'Savage Blow')!;

    const gains = calculateMarginalGains(build, classData, skill, weaponData, attackSpeedData, mwData);

    // Shadower: WATK, LUK (primary), STR (secondary), DEX (secondary)
    expect(gains).toHaveLength(4);
    expect(gains.map(g => g.stat)).toEqual(expect.arrayContaining(['WATK', 'LUK', 'STR', 'DEX']));
  });

  it('returns zero gain for fixedDamage skills', () => {
    const classData = loadClassSkills('marksman');
    const build = loadGearTemplate('marksman', 'high');
    const snipe = classData.skills.find(s => s.name === 'Snipe')!;

    const gains = calculateMarginalGains(build, classData, snipe, weaponData, attackSpeedData, mwData);

    // Snipe has fixedDamage — all stat gains should be 0
    for (const g of gains) {
      expect(g.dpsGain).toBe(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/marginal.test.ts`
Expected: FAIL — module `./marginal.js` not found.

**Step 3: Write the implementation**

Create `src/engine/marginal.ts`:

```typescript
import type {
  CharacterBuild,
  ClassSkillData,
  SkillEntry,
  WeaponData,
  AttackSpeedData,
  MWData,
  StatName,
} from '../data/types.js';
import { calculateSkillDps } from './dps.js';

export interface MarginalGain {
  /** Display name: "WATK", "STR", "DEX", etc. */
  stat: string;
  /** Current value of this stat in the build. */
  currentValue: number;
  /** Absolute DPS increase from +1 to this stat. */
  dpsGain: number;
  /** Percentage DPS increase from +1 to this stat. */
  percentGain: number;
}

/**
 * Compute the DPS gain from +1 to each stat axis for a given skill.
 *
 * Stat axes:
 * - WATK (+1 totalWeaponAttack)
 * - Primary stat (+1 gearStats[primaryStat])
 * - Each secondary stat (+1 gearStats[secondaryStat] — separate entries for arrays)
 *
 * Returns results sorted by dpsGain descending.
 */
export function calculateMarginalGains(
  build: CharacterBuild,
  classData: ClassSkillData,
  skill: SkillEntry,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData
): MarginalGain[] {
  const baseDps = calculateSkillDps(build, classData, skill, weaponData, attackSpeedData, mwData).dps;

  const gains: MarginalGain[] = [];

  // WATK
  const watkBuild = { ...build, totalWeaponAttack: build.totalWeaponAttack + 1 };
  const watkDps = calculateSkillDps(watkBuild, classData, skill, weaponData, attackSpeedData, mwData).dps;
  gains.push({
    stat: 'WATK',
    currentValue: build.totalWeaponAttack,
    dpsGain: watkDps - baseDps,
    percentGain: baseDps > 0 ? ((watkDps - baseDps) / baseDps) * 100 : 0,
  });

  // Collect all stat keys to perturb (primary + each secondary, deduplicated)
  const secondaryKeys: StatName[] = Array.isArray(classData.secondaryStat)
    ? classData.secondaryStat
    : [classData.secondaryStat];
  const allStatKeys: StatName[] = [classData.primaryStat, ...secondaryKeys.filter(k => k !== classData.primaryStat)];

  for (const statKey of allStatKeys) {
    const perturbedBuild: CharacterBuild = {
      ...build,
      gearStats: { ...build.gearStats, [statKey]: build.gearStats[statKey] + 1 },
    };
    const newDps = calculateSkillDps(perturbedBuild, classData, skill, weaponData, attackSpeedData, mwData).dps;
    gains.push({
      stat: statKey,
      currentValue: build.gearStats[statKey],
      dpsGain: newDps - baseDps,
      percentGain: baseDps > 0 ? ((newDps - baseDps) / baseDps) * 100 : 0,
    });
  }

  gains.sort((a, b) => b.dpsGain - a.dpsGain);
  return gains;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/marginal.test.ts`
Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
git add src/engine/marginal.ts src/engine/marginal.test.ts
git commit -m "add marginal gain calculator to engine"
```

---

### Task 2: Export from engine index and core.ts

**Files:**
- Modify: `src/engine/index.ts`
- Modify: `src/core.ts`

**Step 1: Add export to engine index**

In `src/engine/index.ts`, add at the end:

```typescript
export { calculateMarginalGains, type MarginalGain } from './marginal.js';
```

**Step 2: Add export to core.ts**

In `src/core.ts`, add after the existing engine exports (around line 29):

```typescript
export { calculateMarginalGains, type MarginalGain } from './engine/marginal.js';
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: no errors

**Step 4: Commit**

```bash
git add src/engine/index.ts src/core.ts
git commit -m "export marginal gain calculator from engine and core"
```

---

### Task 3: Web component — MarginalGainsTable

**Files:**
- Create: `web/src/components/MarginalGainsTable.tsx`

**Step 1: Create the component**

The component takes the build explorer state, finds the best skill, computes marginal gains, and renders a table. It uses the same data bundle imports that `useBuildExplorer.ts` uses.

```tsx
import { useMemo } from 'react';
import { calculateMarginalGains, type MarginalGain } from '@engine/engine/marginal.js';
import { calculateSkillDps } from '@engine/engine/dps.js';
import type { CharacterBuild, ClassSkillData, SkillEntry } from '@engine/data/types.js';
import { weaponData, attackSpeedData, mwData } from '../data/bundle.js';
import { formatDps } from '../utils/format.js';

interface MarginalGainsTableProps {
  build: CharacterBuild;
  classData: ClassSkillData;
}

export function MarginalGainsTable({ build, classData }: MarginalGainsTableProps) {
  const { bestSkill, gains } = useMemo(() => {
    // Find the highest-DPS skill (aggregate comboGroups)
    let bestSingle: SkillEntry | null = null;
    let bestDps = 0;

    const comboSkills = new Map<string, { skills: SkillEntry[]; totalDps: number }>();

    for (const skill of classData.skills) {
      const dps = calculateSkillDps(build, classData, skill, weaponData, attackSpeedData, mwData).dps;
      if (skill.comboGroup) {
        const existing = comboSkills.get(skill.comboGroup);
        if (existing) {
          existing.skills.push(skill);
          existing.totalDps += dps;
        } else {
          comboSkills.set(skill.comboGroup, { skills: [skill], totalDps: dps });
        }
      } else if (dps > bestDps) {
        bestDps = dps;
        bestSingle = skill;
      }
    }

    // Check if any combo group beats the best single skill
    let bestComboGroup: string | null = null;
    for (const [groupName, group] of comboSkills) {
      if (group.totalDps > bestDps) {
        bestDps = group.totalDps;
        bestComboGroup = groupName;
        bestSingle = null;
      }
    }

    // Calculate marginal gains for the best skill/combo
    let marginalGains: MarginalGain[];
    let skillLabel: string;

    if (bestComboGroup) {
      const group = comboSkills.get(bestComboGroup)!;
      skillLabel = bestComboGroup;
      // Sum marginal gains across all sub-skills in the combo
      const gainsBySubSkill = group.skills.map(skill =>
        calculateMarginalGains(build, classData, skill, weaponData, attackSpeedData, mwData)
      );
      // Aggregate: sum dpsGain for each stat across sub-skills
      const statMap = new Map<string, MarginalGain>();
      for (const subGains of gainsBySubSkill) {
        for (const g of subGains) {
          const existing = statMap.get(g.stat);
          if (existing) {
            existing.dpsGain += g.dpsGain;
          } else {
            statMap.set(g.stat, { ...g });
          }
        }
      }
      // Recompute percentGain from aggregated dpsGain
      marginalGains = [...statMap.values()].map(g => ({
        ...g,
        percentGain: bestDps > 0 ? (g.dpsGain / bestDps) * 100 : 0,
      }));
      marginalGains.sort((a, b) => b.dpsGain - a.dpsGain);
    } else if (bestSingle) {
      skillLabel = bestSingle.name;
      marginalGains = calculateMarginalGains(build, classData, bestSingle, weaponData, attackSpeedData, mwData);
    } else {
      return { bestSkill: null, gains: [] };
    }

    return { bestSkill: skillLabel, gains: marginalGains };
  }, [build, classData]);

  if (!bestSkill || gains.length === 0) return null;

  const th = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium text-left';
  const bestGain = gains[0];

  return (
    <div className="mt-6">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-dim">
        What to upgrade next?
      </div>
      <div className="mb-2 text-[11px] text-text-faint">
        Based on {bestSkill}
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className={th}>Stat</th>
            <th className={`${th} text-right`}>Current</th>
            <th className={`${th} text-right`}>+1 DPS</th>
            <th className={`${th} text-right`}>+1 %</th>
          </tr>
        </thead>
        <tbody>
          {gains.map((g) => {
            const isBest = g === bestGain && g.dpsGain > 0;
            return (
              <tr
                key={g.stat}
                className={`border-b border-border-subtle ${isBest ? 'bg-accent/5' : 'hover:bg-white/[0.03]'}`}
              >
                <td className={`px-3 py-2 ${isBest ? 'text-accent font-medium' : 'text-text-secondary'}`}>
                  {g.stat}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-dim">
                  {g.currentValue.toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${isBest ? 'text-accent' : ''}`}>
                  +{formatDps(g.dpsGain)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-dim">
                  +{g.percentGain.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Verify types compile**

Run: `cd web && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add web/src/components/MarginalGainsTable.tsx
git commit -m "add marginal gains table component"
```

---

### Task 4: Integrate into Build Explorer

**Files:**
- Modify: `web/src/components/BuildExplorer.tsx:139-148`

**Step 1: Add import and render the component**

In `web/src/components/BuildExplorer.tsx`, add the import at the top:

```typescript
import { MarginalGainsTable } from './MarginalGainsTable.js';
```

Then inside the grid where `BuildDpsResults` is rendered (around line 146), add the `MarginalGainsTable` below it:

```tsx
<div>
  <BuildDpsResults state={state} />
  {state.effectiveBuild && state.classData && (
    <MarginalGainsTable
      build={state.effectiveBuild}
      classData={state.classData}
    />
  )}
</div>
```

**Step 2: Verify the web app builds**

Run: `cd web && npx tsc --noEmit && npx vite build`
Expected: successful build

**Step 3: Run all tests to make sure nothing broke**

Run: `npx vitest run && cd web && npx vitest run`
Expected: all tests pass

**Step 4: Commit**

```bash
git add web/src/components/BuildExplorer.tsx
git commit -m "integrate marginal gains table into build explorer"
```

---

### Task 5: Manual verification and push

**Step 1: Start the dev server and verify visually**

Run: `cd web && npm run dev`

Navigate to the Build Explorer, pick Hero / High tier. Below the DPS results table you should see:

```
WHAT TO UPGRADE NEXT?
Based on Brandish (Sword)
Stat     Current   +1 DPS    +1 %
WATK     203       +1,412    +0.57%
STR      999       +892      +0.36%
DEX      133       +187      +0.08%
```

Verify:
- Switching classes updates the table
- Changing tiers updates the table
- Overriding stats recalculates (e.g., lowering WATK should increase WATK's marginal value)
- Mage classes show INT/LUK
- Shadower shows LUK/STR/DEX

**Step 2: Push**

```bash
git push
```
