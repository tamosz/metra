# CGS Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the tier dropdown with tier preset buttons and 3 editable CGS (Cape/Glove/Shoe WATK) stepper inputs, so users can fine-tune funding within a tier and see DPS update in real time.

**Architecture:** CGS defaults are a constant mapping tier → { cape, glove, shoe }. A utility function computes the WATK delta between default and user CGS, then adjusts `totalWeaponAttack` on non-mage gear templates. `useSimulation` applies this before running the engine. A new `TierPresets` component replaces the `FilterGroup` tier dropdown.

**Tech Stack:** React, TypeScript, Vitest, Tailwind CSS (existing stack — no additions)

---

### Task 1: CGS defaults constant and WATK adjustment utility

**Files:**
- Create: `web/src/utils/cgs.ts`
- Test: `web/src/utils/cgs.test.ts`

**Step 1: Write the test file**

```ts
// web/src/utils/cgs.test.ts
import { describe, it, expect } from 'vitest';
import { CGS_DEFAULTS, applyCgsOverride } from './cgs.js';
import type { CharacterBuild, ClassSkillData } from '@engine/data/types.js';

function makeBuild(className: string, watk: number): CharacterBuild {
  return {
    className,
    baseStats: { STR: 100, DEX: 100, INT: 4, LUK: 4 },
    gearStats: { STR: 50, DEX: 50, INT: 0, LUK: 0 },
    totalWeaponAttack: watk,
    weaponType: '2H Sword',
    weaponSpeed: 5,
    attackPotion: 100,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
  };
}

function makeClassData(name: string, formula?: string): ClassSkillData {
  return {
    className: name,
    mastery: 0.6,
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 140,
    damageFormula: formula as ClassSkillData['damageFormula'],
    skills: [],
  };
}

describe('CGS_DEFAULTS', () => {
  it('has correct values for all base tiers', () => {
    expect(CGS_DEFAULTS.low).toEqual({ cape: 10, glove: 12, shoe: 10 });
    expect(CGS_DEFAULTS.mid).toEqual({ cape: 15, glove: 16, shoe: 13 });
    expect(CGS_DEFAULTS.high).toEqual({ cape: 20, glove: 18, shoe: 16 });
    expect(CGS_DEFAULTS.perfect).toEqual({ cape: 22, glove: 22, shoe: 18 });
  });
});

describe('applyCgsOverride', () => {
  it('adjusts totalWeaponAttack by CGS delta', () => {
    const templates = new Map([['hero-high', makeBuild('Hero', 198)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 22, glove: 18, shoe: 16, // +2 cape = +2 total
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(200);
  });

  it('does not modify mage templates', () => {
    const templates = new Map([['archmage-il-high', makeBuild('Archmage I/L', 145)]]);
    const classDataMap = new Map([['archmage-il', makeClassData('Archmage I/L', 'magic')]]);
    const result = applyCgsOverride(templates, classDataMap, ['archmage-il'], 'high', {
      cape: 25, glove: 25, shoe: 25, // big change
    });
    expect(result.get('archmage-il-high')!.totalWeaponAttack).toBe(145); // unchanged
  });

  it('returns templates unchanged when CGS matches defaults', () => {
    const templates = new Map([['hero-high', makeBuild('Hero', 198)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 20, glove: 18, shoe: 16, // exact defaults
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(198);
  });

  it('handles negative delta (lower CGS)', () => {
    const templates = new Map([['hero-high', makeBuild('Hero', 198)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 15, glove: 15, shoe: 15, // -9 total
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(189);
  });

  it('only modifies templates for the specified tier', () => {
    const templates = new Map([
      ['hero-high', makeBuild('Hero', 198)],
      ['hero-low', makeBuild('Hero', 163)],
    ]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 25, glove: 18, shoe: 16, // +5 cape
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(203);
    expect(result.get('hero-low')!.totalWeaponAttack).toBe(163); // unchanged
  });

  it('returns original map for unknown tier', () => {
    const templates = new Map([['hero-custom', makeBuild('Hero', 200)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'custom', {
      cape: 20, glove: 20, shoe: 20,
    });
    // Unknown tier has no defaults — cannot compute delta, return unchanged
    expect(result).toBe(templates);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/utils/cgs.test.ts`
Expected: FAIL — module `./cgs.js` not found

**Step 3: Write the implementation**

```ts
// web/src/utils/cgs.ts
import type { CharacterBuild, ClassSkillData } from '@engine/data/types.js';

export interface CgsValues {
  cape: number;
  glove: number;
  shoe: number;
}

export const CGS_DEFAULTS: Record<string, CgsValues> = {
  low: { cape: 10, glove: 12, shoe: 10 },
  mid: { cape: 15, glove: 16, shoe: 13 },
  high: { cape: 20, glove: 18, shoe: 16 },
  perfect: { cape: 22, glove: 22, shoe: 18 },
};

/**
 * Apply a CGS override to gear templates for a specific tier.
 * Computes the WATK delta between the tier's default CGS and the user's values,
 * then adjusts totalWeaponAttack on all non-mage templates at that tier.
 * Returns the original map if no adjustment is needed.
 */
export function applyCgsOverride(
  templates: Map<string, CharacterBuild>,
  classDataMap: Map<string, ClassSkillData>,
  classNames: string[],
  tier: string,
  cgs: CgsValues,
): Map<string, CharacterBuild> {
  const defaults = CGS_DEFAULTS[tier];
  if (!defaults) return templates;

  const defaultSum = defaults.cape + defaults.glove + defaults.shoe;
  const userSum = cgs.cape + cgs.glove + cgs.shoe;
  const delta = userSum - defaultSum;

  if (delta === 0) return templates;

  const result = new Map(templates);
  for (const className of classNames) {
    const key = `${className}-${tier}`;
    const build = result.get(key);
    if (!build) continue;

    const classData = classDataMap.get(className);
    if (classData?.damageFormula === 'magic') continue;

    result.set(key, {
      ...build,
      totalWeaponAttack: build.totalWeaponAttack + delta,
    });
  }
  return result;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/utils/cgs.test.ts`
Expected: all 6 tests PASS

**Step 5: Commit**

```bash
git add web/src/utils/cgs.ts web/src/utils/cgs.test.ts
git commit -m "add cgs defaults and watk adjustment utility"
```

---

### Task 2: Add CGS override to useSimulation

**Files:**
- Modify: `web/src/hooks/useSimulation.ts`

**Step 1: Add CgsValues import and new parameter**

Add import at top of `web/src/hooks/useSimulation.ts`:
```ts
import { applyCgsOverride, type CgsValues } from '../utils/cgs.js';
```

Add `cgsOverride` parameter to `useSimulation`:
```ts
export function useSimulation(
  customTiers: CustomTier[] = [],
  targetCount?: number,
  elementModifiers?: Record<string, number>,
  buffOverrides?: BuffOverrides,
  kbConfig?: KbConfig,
  cgsOverride?: { tier: string; values: CgsValues },
): SimulationData {
```

**Step 2: Apply CGS override after custom tier merge**

After the custom tier merge block (after `customTierNames.set(ct.id, ct.name);`), add:
```ts
    // Apply CGS override if provided
    let finalTemplates = mergedTemplates;
    if (cgsOverride) {
      finalTemplates = applyCgsOverride(
        mergedTemplates,
        classDataMap,
        classNames,
        cgsOverride.tier,
        cgsOverride.values,
      );
    }
```

Then change the `runSimulation` call to use `finalTemplates` instead of `mergedTemplates`.

**Step 3: Add `cgsOverride` to the useMemo dependency array**

Change the deps from:
```ts
  }, [customTiers, targetCount, elementModifiers, buffOverrides, kbConfig]);
```
to:
```ts
  }, [customTiers, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride]);
```

**Step 4: Run existing tests to verify nothing breaks**

Run: `cd web && npx vitest run`
Expected: all existing tests PASS (no callers pass cgsOverride yet, so behavior unchanged)

**Step 5: Commit**

```bash
git add web/src/hooks/useSimulation.ts
git commit -m "add cgs override support to useSimulation"
```

---

### Task 3: Create TierPresets component

This task creates both the `CgsInput` stepper and the `TierPresets` container.

**Files:**
- Create: `web/src/components/TierPresets.tsx`

**Step 1: Write the component**

```tsx
// web/src/components/TierPresets.tsx
import { useCallback } from 'react';
import { CGS_DEFAULTS, type CgsValues } from '../utils/cgs.js';
import { TIER_ORDER } from '@engine/data/types.js';
import { useSpinner } from '../hooks/useSpinner.js';

interface TierPresetsProps {
  tiers: string[];
  selectedTier: string;
  cgsValues: CgsValues;
  onTierChange: (tier: string) => void;
  onCgsChange: (values: CgsValues) => void;
  /** Custom tier display names (id → name). */
  customTierNames: Map<string, string>;
}

function tierDisplayName(tier: string, customTierNames: Map<string, string>): string {
  const custom = customTierNames.get(tier);
  if (custom) return custom;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/** Check if current CGS values match any tier's defaults. */
function matchesTierDefaults(tier: string, cgs: CgsValues): boolean {
  const defaults = CGS_DEFAULTS[tier];
  if (!defaults) return false;
  return defaults.cape === cgs.cape && defaults.glove === cgs.glove && defaults.shoe === cgs.shoe;
}

export function TierPresets({
  tiers,
  selectedTier,
  cgsValues,
  onTierChange,
  onCgsChange,
  customTierNames,
}: TierPresetsProps) {
  const cgsMatchesSelected = matchesTierDefaults(selectedTier, cgsValues);

  const handleTierClick = (tier: string) => {
    onTierChange(tier);
    const defaults = CGS_DEFAULTS[tier];
    if (defaults) {
      onCgsChange({ ...defaults });
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Tier</span>
        <div className="flex gap-0.5">
          {tiers.map((t) => {
            const isSelected = t === selectedTier;
            const activeStyle = isSelected && cgsMatchesSelected
              ? 'border border-border-active bg-bg-active text-text-bright'
              : isSelected
                ? 'border border-amber-700/50 bg-amber-950/30 text-amber-400'
                : 'border border-transparent bg-transparent text-text-dim hover:text-text-muted';
            return (
              <button
                key={t}
                onClick={() => handleTierClick(t)}
                className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${activeStyle}`}
              >
                {tierDisplayName(t, customTierNames)}
              </button>
            );
          })}
        </div>
      </div>

      <CgsInput label="Cape" value={cgsValues.cape} onChange={(v) => onCgsChange({ ...cgsValues, cape: v })} />
      <CgsInput label="Glove" value={cgsValues.glove} onChange={(v) => onCgsChange({ ...cgsValues, glove: v })} />
      <CgsInput label="Shoe" value={cgsValues.shoe} onChange={(v) => onCgsChange({ ...cgsValues, shoe: v })} />
    </div>
  );
}

function CgsInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const clamp = (n: number) => Math.max(0, n);

  const decrement = useCallback(() => {
    onChange(clamp(value - 1));
  }, [value, onChange]);

  const increment = useCallback(() => {
    onChange(clamp(value + 1));
  }, [value, onChange]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded border border-border-default">
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...decSpinner}
        >
          &minus;
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(clamp(v));
          }}
          className="w-[36px] border-x border-border-default bg-bg-raised px-1 py-1 text-center text-sm tabular-nums text-text-primary focus:border-border-active transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...incSpinner}
        >
          +
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify types compile**

Run: `cd web && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add web/src/components/TierPresets.tsx
git commit -m "add tier presets component with cgs stepper inputs"
```

---

### Task 4: Wire Dashboard and App.tsx

**Files:**
- Modify: `web/src/App.tsx`
- Modify: `web/src/components/Dashboard.tsx`

**Step 1: Lift selectedTier and cgsValues to App.tsx**

In `web/src/App.tsx`, add imports and state:

```ts
import { CGS_DEFAULTS, type CgsValues } from './utils/cgs.js';
```

Add state (near the other `useState` calls):
```ts
const [selectedTier, setSelectedTier] = useState('high');
const [cgsValues, setCgsValues] = useState<CgsValues>({ ...CGS_DEFAULTS.high });
```

Update `useSimulation` call — add the `cgsOverride` parameter:
```ts
const simulation = useSimulation(
  customTiersState.tiers,
  targetCount > 1 ? targetCount : undefined,
  Object.keys(elementModifiers).length > 0 ? elementModifiers : undefined,
  Object.keys(buffOverrides).length > 0 ? buffOverrides : undefined,
  kbEnabled ? { bossAttackInterval, bossAccuracy } : undefined,
  { tier: selectedTier, values: cgsValues },
);
```

Add new props to Dashboard:
```tsx
<Dashboard
  simulation={simulation}
  customTiers={customTiersState}
  baseTiers={baseTiers}
  selectedTier={selectedTier}
  setSelectedTier={setSelectedTier}
  cgsValues={cgsValues}
  setCgsValues={setCgsValues}
  targetCount={targetCount}
  setTargetCount={setTargetCount}
  /* ... rest unchanged ... */
/>
```

**Step 2: Update Dashboard props and replace tier FilterGroup**

In `web/src/components/Dashboard.tsx`:

Update `DashboardProps` interface — add:
```ts
selectedTier: string;
setSelectedTier: (tier: string) => void;
cgsValues: CgsValues;
setCgsValues: (values: CgsValues) => void;
```

Add import:
```ts
import { TierPresets } from './TierPresets.js';
import type { CgsValues } from '../utils/cgs.js';
```

Remove the local `const [selectedTier, setSelectedTier] = useState<string | 'all'>('all');` — it's now a prop.

In the filter bar, replace the tier `FilterGroup` (lines 85-93) with:
```tsx
<TierPresets
  tiers={tiers}
  selectedTier={selectedTier}
  cgsValues={cgsValues}
  onTierChange={setSelectedTier}
  onCgsChange={setCgsValues}
  customTierNames={customTierNames}
/>
```

Update the `filtered` useMemo — remove the `selectedTier !== 'all'` check since there's no "all" option:
```ts
.filter((r) => {
  if (r.scenario !== activeScenario) return false;
  if (r.tier !== selectedTier) return false;
  if (!showAllSkills && r.headline === false) return false;
  return true;
})
```

Remove the `tierDisplayName` function from Dashboard.tsx (it's now in TierPresets.tsx). It's still used by `RankingTable` — since we're in single-tier mode, the tier column becomes less useful, but keep it for now. Pass `customTierNames` to RankingTable as before.

**Step 3: Remove FilterGroup import if no longer used**

Check if `FilterGroup` is still imported elsewhere in Dashboard. After removing the tier dropdown, if no other FilterGroup exists in Dashboard, remove the import. (It's likely still used elsewhere in the codebase, so just remove from Dashboard.)

**Step 4: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: no errors

**Step 5: Run all web tests**

Run: `cd web && npx vitest run`
Expected: all tests PASS

**Step 6: Commit**

```bash
git add web/src/App.tsx web/src/components/Dashboard.tsx
git commit -m "wire cgs editor into dashboard and app"
```

---

### Task 5: Visual verification and cleanup

**Step 1: Run the dev server and verify**

Run: `cd web && npm run dev`

Verify:
- Tier buttons appear (Low, Mid, High, Perfect) with High selected by default
- Three CGS stepper inputs appear (Cape: 20, Glove: 18, Shoe: 16)
- Clicking a different tier changes the CGS values to that tier's defaults
- Clicking +/- on a CGS input updates the value and the DPS chart re-renders
- When CGS values don't match the selected tier's defaults, the tier button style changes (amber tint)
- Mage DPS values don't change when CGS is adjusted

**Step 2: Run full test suite**

Run: `npx vitest run && cd web && npx vitest run`
Expected: all tests PASS

**Step 3: Run type checks**

Run: `npm run type-check:all`
Expected: no errors

**Step 4: Commit any cleanup**

If any minor adjustments were needed during verification, commit them.
