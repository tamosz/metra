# Bullseye Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Corsair's Bullseye 1.2× damage modifier a toggleable buff instead of a hardcoded multiplier.

**Architecture:** Remove the baked-in 1.2× from `sair.json` skill `multiplier` fields, add a `bullseye` flag to `SkillEntry` and `CharacterBuild`, apply the 1.2× conditionally in the DPS pipeline. Wire the toggle through the existing buff override system (CLI flag + web UI toggle).

**Tech Stack:** TypeScript, Vitest, React

**Spec:** `docs/superpowers/specs/2026-03-16-bullseye-toggle-design.md`

---

## Chunk 1: Engine + Data

### Task 1: Add `bullseye` to types

**Files:**
- Modify: `packages/engine/src/types.ts:56-114` (SkillEntry) and `packages/engine/src/types.ts:180-218` (CharacterBuild)

- [ ] **Step 1: Add `bullseye` to `SkillEntry`**

In `packages/engine/src/types.ts`, add after the `knockbackRecovery` field (line 113):

```typescript
  /** If true, this skill benefits from Bullseye's 1.2× single-target damage amplification. */
  bullseye?: boolean;
```

- [ ] **Step 2: Add `bullseye` to `CharacterBuild`**

In `packages/engine/src/types.ts`, add after the `avoidability` field (line 217):

```typescript
  /** Whether Bullseye is active (1.2× damage for marked skills). Default: true when undefined. */
  bullseye?: boolean;
```

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/types.ts
git commit -m "add bullseye flag to SkillEntry and CharacterBuild types"
```

### Task 2: Update skill data

**Files:**
- Modify: `data/skills/sair.json`

- [ ] **Step 1: Update Battleship Cannon**

In `data/skills/sair.json`, change Battleship Cannon (the first skill entry):
- Remove `"multiplier": 1.2` (replace with `"multiplier": 1`)
- Add `"bullseye": true`
- Update `"description"` to remove the "Includes Bullseye" note — Bullseye is now a toggle, not baked in
- Update `"source"` to note the raw value: `"dmg D9=380, E9=380 (Bullseye applied via toggle), N9 hitCount=4, speed 2 → 0.60s"`

- [ ] **Step 2: Update Rapid Fire**

Same changes for Rapid Fire (the second skill entry):
- Remove `"multiplier": 1.2` (replace with `"multiplier": 1`)
- Add `"bullseye": true`
- Update `"description"` to remove the "Includes Bullseye" note
- Update `"source"` to note the raw value: `"dmg D10=200, E10=200 (Bullseye applied via toggle), Hurricane fixed 0.12s. KB recovery lower than Hurricane — Rapid Fire can fire mid-air (data/references/knockback.md)"`

- [ ] **Step 3: Commit**

```bash
git add data/skills/sair.json
git commit -m "remove baked-in bullseye from corsair skill multipliers"
```

### Task 3: Apply Bullseye in DPS pipeline (TDD)

**Files:**
- Modify: `packages/engine/src/dps.ts:70-94` (calculateCritDamage) and `packages/engine/src/dps.ts:249` (skillDamagePercent)
- Test: `src/engine/dps.test.ts`

The Bullseye 1.2× currently lives in `skill.multiplier`, which is used in 4 places:
1. `skillDamagePercent = skill.basePower * skill.multiplier` (line 249)
2. `critDamagePercent = skill.basePower * skill.multiplier * totalCritBonus / 100` (line 86, multiplicative)
3. `critDamagePercent = skill.basePower * skill.multiplier * (1 + totalCritBonus / 100)` (line 88, scaleOnBase)
4. `critDamagePercent = (skill.basePower + totalCritBonus) * skill.multiplier` (line 90, addBeforeMultiply)

All 4 must use the effective multiplier.

- [ ] **Step 1: Write failing tests**

Add a new `describe('Bullseye toggle')` block to `src/engine/dps.test.ts`. Build a minimal Corsair-like test fixture:

```typescript
describe('Bullseye toggle', () => {
  // Minimal Corsair-like fixtures for Bullseye tests
  const corsairClassData: ClassSkillData = {
    className: 'Corsair',
    mastery: 0.6,
    primaryStat: 'DEX',
    secondaryStat: 'STR',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 140,
    seCritFormula: 'addBeforeMultiply',
    damageFormula: 'standard',
    skills: [],
  };

  const corsairBuild: CharacterBuild = {
    className: 'Corsair',
    baseStats: { STR: 4, DEX: 535, INT: 4, LUK: 4 },
    gearStats: { STR: 25, DEX: 195, INT: 0, LUK: 0 },
    totalWeaponAttack: 150,
    weaponType: 'Gun',
    weaponSpeed: 6,
    attackPotion: 0,
    projectile: 0,
    echoActive: false,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
  };

  const cannonSkill: SkillEntry = {
    name: 'Battleship Cannon',
    basePower: 380,
    multiplier: 1,
    hitCount: 4,
    speedCategory: 'Battleship Cannon',
    weaponType: 'Gun',
    bullseye: true,
  };

  const cannonSkillNoBullseye: SkillEntry = {
    ...cannonSkill,
    bullseye: undefined,
  };

  it('applies 1.2x when skill.bullseye=true and build.bullseye is undefined (default on)', () => {
    const result = calculateSkillDps(corsairBuild, corsairClassData, cannonSkill, weaponData, attackSpeedData, mwData);
    // Same skill without bullseye flag — DPS should be lower by factor of 1.2
    const resultNoBullseye = calculateSkillDps(corsairBuild, corsairClassData, cannonSkillNoBullseye, weaponData, attackSpeedData, mwData);
    // With addBeforeMultiply crit formula, the ratio won't be exactly 1.2 because
    // crit formula is (basePower + bonus) * multiplier — but skillDamagePercent ratio is exactly 1.2
    expect(result.skillDamagePercent).toBeCloseTo(cannonSkillNoBullseye.basePower * 1.2, 5);
    expect(result.dps).toBeGreaterThan(resultNoBullseye.dps);
  });

  it('does NOT apply 1.2x when build.bullseye=false', () => {
    const buildOff = { ...corsairBuild, bullseye: false };
    const result = calculateSkillDps(buildOff, corsairClassData, cannonSkill, weaponData, attackSpeedData, mwData);
    const resultNoBullseye = calculateSkillDps(buildOff, corsairClassData, cannonSkillNoBullseye, weaponData, attackSpeedData, mwData);
    expect(result.skillDamagePercent).toBe(resultNoBullseye.skillDamagePercent);
    expect(result.dps).toBeCloseTo(resultNoBullseye.dps, 5);
  });

  it('does NOT apply 1.2x to skills without bullseye flag', () => {
    const plainSkill: SkillEntry = { ...cannonSkill, bullseye: undefined };
    const buildOn = { ...corsairBuild, bullseye: true };
    const result = calculateSkillDps(buildOn, corsairClassData, plainSkill, weaponData, attackSpeedData, mwData);
    const resultDefault = calculateSkillDps(corsairBuild, corsairClassData, plainSkill, weaponData, attackSpeedData, mwData);
    expect(result.dps).toBeCloseTo(resultDefault.dps, 5);
  });

  it('applies 1.2x to crit damage path too', () => {
    const result = calculateSkillDps(corsairBuild, corsairClassData, cannonSkill, weaponData, attackSpeedData, mwData);
    const resultNoBullseye = calculateSkillDps(corsairBuild, corsairClassData, cannonSkillNoBullseye, weaponData, attackSpeedData, mwData);
    // Crit damage should also be scaled by 1.2
    expect(result.critDamagePercent).toBeGreaterThan(resultNoBullseye.critDamagePercent);
    // For addBeforeMultiply: (380 + 140) * 1.2 = 624 vs (380 + 140) * 1.0 = 520
    expect(result.critDamagePercent).toBeCloseTo((380 + 140) * 1.2, 5);
    expect(resultNoBullseye.critDamagePercent).toBeCloseTo((380 + 140) * 1.0, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/dps.test.ts --reporter=verbose 2>&1 | tail -20`
Expected: FAIL — `skillDamagePercent` will be 380 (no Bullseye applied), test expects 456.

- [ ] **Step 3: Add `getEffectiveMultiplier` helper**

In `packages/engine/src/dps.ts`, add a small helper before `calculateCritDamage`:

```typescript
/** Bullseye multiplier constant. */
const BULLSEYE_MULTIPLIER = 1.2;

/**
 * Compute the effective skill multiplier, applying Bullseye if the skill
 * is flagged and the build has it enabled (default: on).
 */
function getEffectiveMultiplier(skill: SkillEntry, build: CharacterBuild): number {
  return skill.multiplier *
    (skill.bullseye && build.bullseye !== false ? BULLSEYE_MULTIPLIER : 1);
}
```

- [ ] **Step 4: Use `getEffectiveMultiplier` in `calculateCritDamage`**

Modify `calculateCritDamage` (line 70) to accept a `build` parameter:

```typescript
function calculateCritDamage(
  skill: SkillEntry,
  classData: ClassSkillData,
  sharpEyes: boolean,
  build: CharacterBuild
): { critDamagePercent: number; totalCritRate: number } {
```

Inside the function, compute the effective multiplier once and use it in all 3 crit formulas:

```typescript
  const effectiveMultiplier = getEffectiveMultiplier(skill, build);
```

Replace all 3 uses of `skill.multiplier` with `effectiveMultiplier`:
- Line 86: `critDamagePercent = skill.basePower * effectiveMultiplier * totalCritBonus / 100;`
- Line 88: `critDamagePercent = skill.basePower * effectiveMultiplier * (1 + totalCritBonus / 100);`
- Line 90: `critDamagePercent = (skill.basePower + totalCritBonus) * effectiveMultiplier;`

- [ ] **Step 5: Use `getEffectiveMultiplier` in `calculateSkillDps`**

In `calculateSkillDps` (line 249):

```typescript
  const effectiveMultiplier = getEffectiveMultiplier(skill, build);
  const skillDamagePercent = skill.basePower * effectiveMultiplier;
```

Update the `calculateCritDamage` call (line 250) to pass `build`:

```typescript
  const { critDamagePercent, totalCritRate } = calculateCritDamage(skill, classData, build.sharpEyes, build);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/engine/dps.test.ts --reporter=verbose 2>&1 | tail -30`
Expected: All Bullseye tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/engine/src/dps.ts src/engine/dps.test.ts
git commit -m "apply bullseye 1.2x conditionally in dps pipeline"
```

### Task 4: Regression test — verify Corsair DPS unchanged

**Files:**
- Test: `src/engine/dps.test.ts`

Since Bullseye defaults to on and the multiplier was removed from skill data, the net DPS should be identical to before this change. Run the full simulation and spot-check Corsair values.

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -40`
Expected: All tests pass. Any existing Corsair DPS assertions should still match because `build.bullseye` defaults to `true` (undefined = on).

- [ ] **Step 2: Run baseline simulation and check Corsair output**

Run: `npx tsx src/cli.ts 2>&1 | grep -i corsair`
Expected: Corsair DPS values unchanged from before (Battleship Cannon and Rapid Fire should show the same numbers).

- [ ] **Step 3: No commit needed — this is a verification step**

## Chunk 2: CLI + Web UI

### Task 5: Add `--no-bullseye` CLI flag

**Files:**
- Modify: `src/cli.ts`
- Test: `src/cli.test.ts`

- [ ] **Step 1: Add `bullseye` to `ScenarioConfig.overrides` Pick union**

In `src/proposals/types.ts`, update the `overrides` type (line 29-31):

```typescript
  overrides?: Partial<Pick<CharacterBuild,
    'sharpEyes' | 'echoActive' | 'speedInfusion' |
    'mwLevel' | 'attackPotion' | 'shadowPartner' | 'bullseye'>>;
```

- [ ] **Step 2: Parse `--no-bullseye` flag in CLI**

In `src/cli.ts`, in the `main()` function, after parsing `kbConfig` (around line 61):

```typescript
  const bullseyeOff = process.argv.includes('--no-bullseye');
```

Then when building the baseline scenario (around line 84-91), add the override:

```typescript
  if (bullseyeOff) {
    baseline.overrides = { ...baseline.overrides, bullseye: false };
  }
```

Also apply it to the training scenario (around line 92-97). After the training scenario is created, add:

```typescript
  if (targetCount != null && targetCount > 1) {
    const training: ScenarioConfig = {
      name: `Training (${targetCount} mobs)`,
      targetCount,
    };
    if (bullseyeOff) {
      training.overrides = { bullseye: false };
    }
    scenarios.push(training);
  }
```

The existing code already filters args starting with `--` (line 74), so `--no-bullseye` is automatically excluded from positional args.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/cli.test.ts --reporter=verbose 2>&1 | tail -20`
Expected: PASS (existing tests unaffected).

- [ ] **Step 4: Manual verification**

Run both commands and compare Corsair output:
```bash
npx tsx src/cli.ts 2>&1 | grep -i corsair
npx tsx src/cli.ts --no-bullseye 2>&1 | grep -i corsair
```
Expected: `--no-bullseye` shows lower Corsair DPS.

- [ ] **Step 5: Commit**

```bash
git add src/proposals/types.ts src/cli.ts
git commit -m "add --no-bullseye cli flag"
```

### Task 6: Add Bullseye toggle to web UI

**Files:**
- Modify: `web/src/components/BuffToggles.tsx`
- Modify: `web/src/components/Dashboard.tsx`

The `BuffToggles` component uses a `BuffOverrides` type (`Partial<Pick<CharacterBuild, ...>>`) and a `BUFFS` config array. The toggle logic: when a buff key is present in `overrides`, it's OFF (set to its off value). When absent, it uses the build default (ON).

For Bullseye this is inverted from most toggles — most buffs default to ON in the build and toggling OFF adds them to overrides. Bullseye is the same: default is ON (undefined = true), toggling OFF adds `bullseye: false` to overrides.

- [ ] **Step 1: Add `bullseye` to `BuffOverrides` type**

In `web/src/components/BuffToggles.tsx` (line 5):

```typescript
type BuffOverrides = Partial<Pick<CharacterBuild, 'sharpEyes' | 'echoActive' | 'speedInfusion' | 'mwLevel' | 'attackPotion' | 'bullseye'>>;
```

- [ ] **Step 2: Add Bullseye to BUFFS config**

In `web/src/components/BuffToggles.tsx`, add to the `BUFFS` array (after attackPotion, line 12):

```typescript
  { key: 'bullseye' as const, label: 'Bull', offValue: false as const, tooltip: 'Bullseye (Corsair)' },
```

- [ ] **Step 3: Add conditional visibility**

The Bullseye toggle should only appear when Corsair is in the results. Add a `visibleClassNames` prop to `BuffToggles`:

In `web/src/components/BuffToggles.tsx`:

```typescript
// Add a classFilter field to the buff config (optional, only for class-specific buffs)
const BUFFS = [
  { key: 'sharpEyes' as const, label: 'SE', offValue: false as const, tooltip: 'Sharp Eyes' },
  { key: 'echoActive' as const, label: 'Echo', offValue: false as const, tooltip: 'Echo of Hero' },
  { key: 'speedInfusion' as const, label: 'SI', offValue: false as const, tooltip: 'Speed Infusion' },
  { key: 'mwLevel' as const, label: 'MW', offValue: 0 as const, tooltip: 'Maple Warrior' },
  { key: 'attackPotion' as const, label: 'Pot', offValue: 0 as const, tooltip: 'Attack Potion' },
  { key: 'bullseye' as const, label: 'Bull', offValue: false as const, tooltip: 'Bullseye (Corsair)', classFilter: 'Corsair' },
] as const;
```

Update the `BuffToggles` component to accept a `visibleClassNames` prop:

```typescript
interface BuffTogglesProps {
  visibleClassNames?: Set<string>;
}

export function BuffToggles({ visibleClassNames }: BuffTogglesProps) {
```

In the render, filter out buffs whose `classFilter` doesn't match:

```typescript
  const visibleBuffs = BUFFS.filter((b) => {
    if (!('classFilter' in b) || !b.classFilter) return true;
    return !visibleClassNames || visibleClassNames.has(b.classFilter);
  });
```

Then map over `visibleBuffs` instead of `BUFFS`.

- [ ] **Step 4: Pass class names from Dashboard**

In `web/src/components/Dashboard.tsx`, compute the set of visible class names and pass to `BuffToggles`:

```typescript
  const visibleClassNames = useMemo(
    () => new Set(results.map((r) => r.className)),
    [results],
  );
```

Update the JSX (line 77):

```tsx
<BuffToggles visibleClassNames={visibleClassNames} />
```

- [ ] **Step 5: Run web tests**

Run: `cd web && npx vitest run --reporter=verbose 2>&1 | tail -20`
Expected: PASS.

- [ ] **Step 6: Run type check**

Run: `cd web && npx tsc --noEmit 2>&1 | tail -20`
Expected: No errors.

- [ ] **Step 7: Manual verification**

Run: `cd web && npm run dev`
- Verify the "Bull" toggle appears in the buff bar
- Verify toggling it off reduces Corsair DPS
- Verify other classes are unaffected
- Verify filter permalink includes bullseye state when toggled off

- [ ] **Step 8: Commit**

```bash
git add web/src/components/BuffToggles.tsx web/src/components/Dashboard.tsx
git commit -m "add bullseye toggle to web ui buff bar"
```

### Task 7: Final verification

- [ ] **Step 1: Run full test suite (root + web)**

```bash
npx vitest run && cd web && npx vitest run
```
Expected: All tests pass.

- [ ] **Step 2: Type check both projects**

```bash
cd /Users/tome/dev/metra && npx tsc --noEmit -p packages/engine/tsconfig.json && cd web && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Run formatter if configured**

Check for prettier/biome config and run on changed files.
