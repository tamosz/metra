# Gear Template Inheritance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce gear template boilerplate and cross-tier inconsistency via two-layer inheritance (tier defaults + class bases).

**Architecture:** The loader merges tier defaults → class base → tier file at load time. CGS slots are injected into the gear breakdown from tier defaults. Old flat templates keep working (no `.base.json` = no inheritance). The web bundle mirrors this logic.

**Tech Stack:** TypeScript, Vitest, Vite (import.meta.glob for web bundle)

---

### Task 1: Add tier defaults data file

Create `data/tier-defaults.json` with standardized potion and CGS values.

**Files:**
- Create: `data/tier-defaults.json`

**Step 1: Create the tier defaults file**

```json
{
  "low":     { "attackPotion": 60,  "potionName": "Stopper", "cgs": { "cape": 12, "glove": 10, "shoe": 10 } },
  "mid":     { "attackPotion": 60,  "potionName": "Stopper", "cgs": { "cape": 16, "glove": 15, "shoe": 13 } },
  "high":    { "attackPotion": 100, "potionName": "Apple",   "cgs": { "cape": 18, "glove": 20, "shoe": 16 } },
  "perfect": { "attackPotion": 100, "potionName": "Apple",   "cgs": { "cape": 22, "glove": 22, "shoe": 18 } }
}
```

**Step 2: Commit**

```bash
git add data/tier-defaults.json
git commit -m "add tier-defaults.json with standardized potion and CGS values"
```

---

### Task 2: Add merge utility and tests

Create a pure function that merges tier defaults + class base + tier file into a flat `CharacterBuild`. Test it in isolation with mock data before touching the loader.

**Files:**
- Create: `src/data/gear-merge.ts`
- Create: `src/data/gear-merge.test.ts`

**Step 1: Write the failing tests**

Test file `src/data/gear-merge.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from './gear-merge.js';

const tierDefaults: Record<string, TierDefaults> = {
  high: { attackPotion: 100, potionName: 'Apple', cgs: { cape: 18, glove: 20, shoe: 16 } },
};

const classBase: ClassBase = {
  className: 'Hero',
  weaponType: '2H Sword',
  weaponSpeed: 5,
  projectile: 0,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
};

const tierOverride: TierOverride = {
  extends: 'hero',
  source: 'test',
  baseStats: { STR: 999, DEX: 23, INT: 4, LUK: 4 },
  gearBreakdown: {
    weapon: { STR: 21, WATK: 140 },
    helmet: { STR: 21, DEX: 40 },
    ring1: { STR: 8, DEX: 5 },
  },
};

describe('mergeGearTemplate', () => {
  it('merges base + tier + defaults into a CharacterBuild', () => {
    const result = mergeGearTemplate(classBase, tierOverride, tierDefaults['high']);
    expect(result.className).toBe('Hero');
    expect(result.weaponType).toBe('2H Sword');
    expect(result.weaponSpeed).toBe(5);
    expect(result.attackPotion).toBe(100);
    expect(result.baseStats.STR).toBe(999);
    expect(result.echoActive).toBe(true);
    expect(result.sharpEyes).toBe(true);
  });

  it('injects CGS slots as WATK into breakdown before computing totals', () => {
    const result = mergeGearTemplate(classBase, tierOverride, tierDefaults['high']);
    // WATK: 140 (weapon) + 18 (cape) + 20 (glove) + 16 (shoe) = 194
    expect(result.totalWeaponAttack).toBe(194);
  });

  it('preserves CGS stats from tier file if they exist (no double-injection)', () => {
    const withCgs: TierOverride = {
      ...tierOverride,
      gearBreakdown: {
        ...tierOverride.gearBreakdown,
        cape: { STR: 5, WATK: 18 },
      },
    };
    const result = mergeGearTemplate(classBase, withCgs, tierDefaults['high']);
    // Cape already has WATK 18 from the tier file — should NOT add another 18
    // Total WATK: 140 (weapon) + 18 (cape from file) + 20 (glove injected) + 16 (shoe injected) = 194
    expect(result.totalWeaponAttack).toBe(194);
    // But cape should also have its STR
    expect(result.gearStats.STR).toBe(21 + 21 + 8 + 5); // weapon + helmet + ring1 + cape
  });

  it('uses cgsStatName for mages (INT instead of WATK)', () => {
    const mageBase: ClassBase = {
      ...classBase,
      className: 'Archmage I/L',
      weaponType: 'Staff',
      cgsStatName: 'INT',
    };
    const mageTier: TierOverride = {
      extends: 'archmage-il',
      source: 'test',
      baseStats: { STR: 4, DEX: 25, INT: 999, LUK: 4 },
      gearBreakdown: {
        weapon: { INT: 20, MATK: 145 },
      },
    };
    const result = mergeGearTemplate(mageBase, mageTier, tierDefaults['high']);
    // CGS injected as INT: cape 18, shoe 16, glove 20
    expect(result.gearStats.INT).toBe(20 + 18 + 16 + 20); // weapon + cape + shoe + glove
    // MATK only from weapon
    expect(result.totalWeaponAttack).toBe(145);
  });

  it('uses shadowPartner from base when present', () => {
    const nlBase: ClassBase = { ...classBase, shadowPartner: true };
    const result = mergeGearTemplate(nlBase, tierOverride, tierDefaults['high']);
    expect(result.shadowPartner).toBe(true);
  });

  it('tier override fields take precedence over base', () => {
    const overrideWithProjectile: TierOverride = { ...tierOverride, projectile: 30 };
    const result = mergeGearTemplate(classBase, overrideWithProjectile, tierDefaults['high']);
    expect(result.projectile).toBe(30);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/gear-merge.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the merge function**

Create `src/data/gear-merge.ts`:

```typescript
import type { CharacterBuild, StatName } from './types.js';
import { computeGearTotals } from './gear-utils.js';

export interface TierDefaults {
  attackPotion: number;
  potionName: string;
  cgs: { cape: number; glove: number; shoe: number };
}

export interface ClassBase {
  className: string;
  weaponType: string;
  weaponSpeed: number;
  projectile: number;
  echoActive: boolean;
  mwLevel: number;
  speedInfusion: boolean;
  sharpEyes: boolean;
  shadowPartner?: boolean;
  /** Stat name used for CGS slots. Default 'WATK'. Mages use 'INT'. */
  cgsStatName?: string;
}

export interface TierOverride {
  extends: string;
  source?: string;
  baseStats: CharacterBuild['baseStats'];
  gearBreakdown: Record<string, Record<string, number>>;
  /** Override projectile if it varies by tier (e.g., NL low vs perfect). */
  projectile?: number;
  /** Override any other CharacterBuild fields as needed. */
  [key: string]: unknown;
}

const CGS_SLOTS = ['cape', 'glove', 'shoe'] as const;

export function mergeGearTemplate(
  base: ClassBase,
  tier: TierOverride,
  defaults: TierDefaults
): CharacterBuild {
  const statName = base.cgsStatName ?? 'WATK';

  // Merge CGS into breakdown: only inject for slots NOT already in the tier file
  const breakdown = { ...tier.gearBreakdown };
  for (const slot of CGS_SLOTS) {
    if (breakdown[slot]) continue; // tier file already defines this slot
    breakdown[slot] = { [statName]: defaults.cgs[slot] };
  }

  const computed = computeGearTotals(breakdown);

  return {
    className: base.className,
    baseStats: tier.baseStats,
    gearStats: computed.gearStats,
    totalWeaponAttack: computed.totalWeaponAttack,
    weaponType: base.weaponType,
    weaponSpeed: base.weaponSpeed,
    attackPotion: defaults.attackPotion,
    projectile: tier.projectile ?? base.projectile,
    echoActive: base.echoActive,
    mwLevel: base.mwLevel,
    speedInfusion: base.speedInfusion,
    sharpEyes: base.sharpEyes,
    shadowPartner: base.shadowPartner,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/gear-merge.test.ts`
Expected: all 6 tests PASS

**Step 5: Commit**

```bash
git add src/data/gear-merge.ts src/data/gear-merge.test.ts
git commit -m "add gear template merge utility with tests"
```

---

### Task 3: Wire merge into the Node loader

Update `loadGearTemplate()` to detect `extends` in a tier file, load the base, load tier defaults, and merge. Flat templates without `extends` work as before.

**Files:**
- Modify: `src/data/loader.ts` — `loadGearTemplate()` function (lines 44-67)
- Modify: `src/data/loader.ts` — `discoverClassesAndTiers()` — filter out `.base.json` files from template list
- Test: `src/data/loader.test.ts` — existing tests must still pass

**Step 1: Write a test for inheritance-mode loading**

Add to `src/data/loader.test.ts`:

```typescript
it('loads inherited templates when extends field is present', () => {
  // This test will only pass after Hero is converted (Task 5).
  // For now, verify existing flat templates still work.
  const build = loadGearTemplate('hero-high');
  expect(build.className).toBe('Hero');
  expect(build.totalWeaponAttack).toBe(198);
  expect(build.attackPotion).toBe(100);
});
```

**Step 2: Update `loadGearTemplate()` in `src/data/loader.ts`**

Add a `loadTierDefaults()` helper (cached) and update `loadGearTemplate()`:

```typescript
import { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from './gear-merge.js';

let tierDefaultsCache: Record<string, TierDefaults> | null = null;

function loadTierDefaults(): Record<string, TierDefaults> {
  if (!tierDefaultsCache) {
    tierDefaultsCache = loadJson<Record<string, TierDefaults>>('tier-defaults.json');
  }
  return tierDefaultsCache;
}

function loadClassBase(className: string): ClassBase | null {
  const fullPath = resolve(DATA_DIR, `gear-templates/${className}.base.json`);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8')) as ClassBase;
  } catch {
    return null;
  }
}

export function loadGearTemplate(templateName: string): CharacterBuild {
  const raw = loadJson<Record<string, unknown>>(
    `gear-templates/${templateName}.json`
  );

  // Inheritance mode: tier file has "extends" pointing to a class base
  if (typeof raw.extends === 'string') {
    const baseName = raw.extends as string;
    const base = loadClassBase(baseName);
    if (!base) {
      throw new Error(
        `Gear template "${templateName}" extends "${baseName}" but no ${baseName}.base.json found`
      );
    }

    // Extract tier from templateName (everything after the class prefix)
    const tier = templateName.slice(baseName.length + 1);
    const allDefaults = loadTierDefaults();
    const defaults = allDefaults[tier];
    if (!defaults) {
      throw new Error(
        `Gear template "${templateName}" uses tier "${tier}" but no tier defaults found for it`
      );
    }

    return mergeGearTemplate(base, raw as unknown as TierOverride, defaults);
  }

  // Flat mode (backward compatible): no extends field
  const breakdown = raw.gearBreakdown as Record<string, Record<string, number>> | undefined;
  const computed = breakdown ? computeGearTotals(breakdown) : undefined;

  return {
    className: raw.className as string,
    baseStats: raw.baseStats as CharacterBuild['baseStats'],
    gearStats: computed?.gearStats ?? (raw.gearStats as CharacterBuild['gearStats']),
    totalWeaponAttack: computed?.totalWeaponAttack ?? (raw.totalWeaponAttack as number),
    weaponType: raw.weaponType as string,
    weaponSpeed: raw.weaponSpeed as number,
    attackPotion: raw.attackPotion as number,
    projectile: raw.projectile as number,
    echoActive: raw.echoActive as boolean,
    mwLevel: raw.mwLevel as number,
    speedInfusion: raw.speedInfusion as boolean,
    sharpEyes: raw.sharpEyes as boolean,
    shadowPartner: raw.shadowPartner as boolean | undefined,
  };
}
```

**Step 3: Update `discoverClassesAndTiers()` to filter `.base.json` files**

In the `templateFiles` construction (line 84-86), filter out base files:

```typescript
const templateFiles = readdirSync(resolve(DATA_DIR, 'gear-templates'))
  .filter((f: string) => f.endsWith('.json') && !f.includes('.base.'))
  .map((f: string) => f.replace('.json', ''));
```

**Step 4: Export merge types from `src/core.ts`**

Add to `src/core.ts`:

```typescript
export { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from './data/gear-merge.js';
```

**Step 5: Run all engine tests**

Run: `npx vitest run`
Expected: all tests PASS (no behavioral change yet — no templates use `extends`)

**Step 6: Commit**

```bash
git add src/data/loader.ts src/data/loader.test.ts src/core.ts
git commit -m "wire gear template inheritance into loader with backward compat"
```

---

### Task 4: Wire merge into the web bundle

Update `web/src/data/bundle.ts` to import base files and tier defaults, run the same merge logic for templates with `extends`.

**Files:**
- Modify: `web/src/data/bundle.ts`

**Step 1: Update bundle.ts**

Add static imports for tier defaults and base files:

```typescript
import tierDefaultsJson from '@data/tier-defaults.json';
import { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from '@engine/data/gear-merge.js';

const tierDefaults = tierDefaultsJson as Record<string, TierDefaults>;

// Class base files
const baseModules = import.meta.glob('@data/gear-templates/*.base.json', { eager: true, import: 'default' }) as Record<string, ClassBase>;
```

Update the `templateModules` glob to exclude base files:

```typescript
const templateModules = import.meta.glob([
  '@data/gear-templates/*.json',
  '!@data/gear-templates/*.base.json',
], { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>;
```

Add a helper to find the base for a template:

```typescript
function findClassBase(templateName: string): ClassBase | null {
  for (const [path, base] of Object.entries(baseModules)) {
    const match = path.match(/\/([^/]+)\.base\.json$/);
    if (match && templateName.startsWith(match[1] + '-')) {
      return base;
    }
  }
  return null;
}
```

Update `parseGearTemplate` to handle inheritance:

```typescript
function parseGearTemplate(templateName: string, raw: Record<string, unknown>): CharacterBuild {
  if (typeof raw.extends === 'string') {
    const base = findClassBase(templateName);
    if (!base) {
      throw new Error(`Template "${templateName}" extends "${raw.extends}" but no base file found`);
    }
    const tier = templateName.slice((raw.extends as string).length + 1);
    const defaults = tierDefaults[tier];
    if (!defaults) {
      throw new Error(`Template "${templateName}" uses tier "${tier}" with no tier defaults`);
    }
    return mergeGearTemplate(base, raw as unknown as TierOverride, defaults);
  }

  // Flat mode (existing logic)
  const breakdown = raw.gearBreakdown as Record<string, Record<string, number>> | undefined;
  const computed = breakdown ? computeGearTotals(breakdown) : undefined;

  return {
    className: raw.className as string,
    baseStats: raw.baseStats as CharacterBuild['baseStats'],
    gearStats: computed?.gearStats ?? (raw.gearStats as CharacterBuild['gearStats']),
    totalWeaponAttack: computed?.totalWeaponAttack ?? (raw.totalWeaponAttack as number),
    weaponType: raw.weaponType as string,
    weaponSpeed: raw.weaponSpeed as number,
    attackPotion: raw.attackPotion as number,
    projectile: raw.projectile as number,
    echoActive: raw.echoActive as boolean,
    mwLevel: raw.mwLevel as number,
    speedInfusion: raw.speedInfusion as boolean,
    sharpEyes: raw.sharpEyes as boolean,
    shadowPartner: raw.shadowPartner as boolean | undefined,
  };
}
```

Update the call site in `discoverClassesAndTiers()` (around line 117):

```typescript
gearTemplates.set(key, parseGearTemplate(key, matchingEntry[1]));
```

**Step 2: Run web type-check and tests**

Run: `cd web && npx tsc --noEmit && npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add web/src/data/bundle.ts
git commit -m "wire gear template inheritance into web bundle"
```

---

### Task 5: Convert Hero as proof of concept

Convert all 4 Hero tier files to use inheritance. Verify DPS output is identical before and after.

**Files:**
- Create: `data/gear-templates/hero.base.json`
- Modify: `data/gear-templates/hero-low.json`
- Modify: `data/gear-templates/hero-mid.json`
- Modify: `data/gear-templates/hero-high.json`
- Modify: `data/gear-templates/hero-perfect.json`

**Step 1: Record baseline DPS for Hero**

Run: `npm run simulate 2>&1 | grep -i hero`

Save the exact DPS numbers for all 4 tiers. These must match exactly after conversion.

**Step 2: Create `data/gear-templates/hero.base.json`**

```json
{
  "className": "Hero",
  "weaponType": "2H Sword",
  "weaponSpeed": 5,
  "projectile": 0,
  "echoActive": true,
  "mwLevel": 20,
  "speedInfusion": true,
  "sharpEyes": true
}
```

**Step 3: Convert `hero-high.json`**

Replace with the slim version. Remove: `className`, `weaponType`, `weaponSpeed`, `projectile`, `echoActive`, `mwLevel`, `speedInfusion`, `sharpEyes`, `attackPotion`, `potionName`, `label`, `gearStats`, `totalWeaponAttack`. Remove cape/glove/shoe from breakdown. Remove zero-value stats. Add `"extends": "hero"`.

New `hero-high.json`:
```json
{
  "extends": "hero",
  "source": "gear templates sheet, Hero & Paladin rows 3-25, High (columns H-L)",
  "baseStats": { "STR": 999, "DEX": 23, "INT": 4, "LUK": 4 },
  "gearBreakdown": {
    "weapon":  { "STR": 21, "WATK": 140 },
    "helmet":  { "STR": 21, "DEX": 40 },
    "top":     { "STR": 60, "DEX": 8 },
    "earring": { "STR": 15 },
    "eye":     { "STR": 6, "DEX": 6 },
    "face":    { "STR": 10, "DEX": 5 },
    "pendant": { "STR": 22, "DEX": 23 },
    "belt":    { "DEX": 5 },
    "medal":   { "WATK": 3 },
    "ring1":   { "STR": 8, "DEX": 5 },
    "ring2":   { "STR": 5, "DEX": 5 },
    "ring3":   { "STR": 3, "DEX": 2 },
    "ring4":   { "STR": 3, "DEX": 3, "WATK": 1 }
  }
}
```

**Step 4: Convert the other 3 tiers similarly**

Apply the same transformation to `hero-low.json`, `hero-mid.json`, `hero-perfect.json`. Each keeps only `extends`, `source`, `baseStats`, and the non-CGS breakdown.

Important: `hero-low.json` and `hero-mid.json` have a `bottom` slot — keep it (it has stats). High and perfect don't have `bottom` (they use overall).

**Step 5: Verify DPS output is identical**

Run: `npm run simulate 2>&1 | grep -i hero`

Compare against Step 1 output — must match exactly.

**Step 6: Run all tests**

Run: `npx vitest run && cd web && npm test`
Expected: PASS

Note: The integrity test `every template with gearBreakdown has summary fields matching computed totals` reads raw JSON and checks `gearStats`/`totalWeaponAttack` against breakdown. Inherited templates no longer have those summary fields in the JSON, so this test needs adjustment — it should skip files that have `extends` (they don't have summary fields to check). Update the test in `src/data/integrity.test.ts` (around line 235-257):

```typescript
it('every flat template with gearBreakdown has summary fields matching computed totals', () => {
  const templateDir = resolve(import.meta.dirname, '../../data/gear-templates');
  const files = readdirSync(templateDir).filter((f: string) => f.endsWith('.json') && !f.includes('.base.'));

  for (const file of files) {
    const raw = JSON.parse(readFileSync(resolve(templateDir, file), 'utf-8'));
    if (!raw.gearBreakdown || raw.extends) continue; // skip inherited templates

    const computed = computeGearTotals(raw.gearBreakdown);
    // ... rest unchanged
  }
});
```

**Step 7: Commit**

```bash
git add data/gear-templates/hero.base.json data/gear-templates/hero-low.json data/gear-templates/hero-mid.json data/gear-templates/hero-high.json data/gear-templates/hero-perfect.json src/data/integrity.test.ts
git commit -m "convert hero gear templates to inheritance format"
```

---

### Task 6: Convert remaining classes

Convert all other classes one at a time, verifying DPS match after each. Group by similarity to minimize mistakes.

**Order:**
1. **Hero (Axe)** — almost identical to Hero base except weaponType/weaponSpeed
2. **DrK** — similar warrior pattern
3. **Paladin** — similar warrior pattern
4. **Paladin (BW)** — similar to Paladin but different weapon
5. **NL** — different primary stat (LUK), has shadowPartner, has projectile
6. **Bowmaster** — has projectile
7. **Marksman** — shares gear with Bowmaster, has projectile
8. **Corsair** — has projectile (implicitly 0?)
9. **Buccaneer** — straightforward warrior-like
10. **Shadower** — has shadowPartner
11. **Archmage I/L** — mage, needs `cgsStatName: "INT"`
12. **Archmage F/P** — same as I/L
13. **Bishop** — same as I/L

For each class:

**Step 1:** Record baseline DPS (`npm run simulate 2>&1 | grep -i <className>`)
**Step 2:** Create `{class}.base.json` with shared fields
**Step 3:** Convert all 4 tier files (remove shared fields, add `extends`, remove CGS, remove zero-value stats, remove summary fields)
**Step 4:** Verify DPS matches exactly
**Step 5:** Run `npx vitest run`
**Step 6:** Commit: `convert {className} gear templates to inheritance format`

Special notes per class:
- **NL**: `projectile` varies by tier (27 low, 28 mid, 30 high, 30 perfect) — keep `projectile` in tier files where it differs from base. Set base `projectile: 30`, override in low/mid.
- **Bowmaster/Marksman**: `projectile` varies (10 low/mid/high, 12 perfect) — set base `projectile: 10`, override in perfect.
- **Mages (Archmage I/L, Archmage F/P, Bishop)**: Set `cgsStatName: "INT"` in base. CGS slots use INT instead of WATK. Gear breakdown uses `MATK` instead of `WATK` for weapon. Double-check that `computeGearTotals` sums MATK correctly (it does — `ATTACK_KEYS = ['WATK', 'MATK']`).
- **Corsair**: `projectile: 0` in base, no tier overrides needed.

After all classes converted, do a final full verification:

Run: `npm run simulate` and `npm run simulate -- --targets 6` and `npm run simulate -- --kb`
Compare output against pre-conversion baseline.

Run: `npx vitest run && cd web && npm test`

Commit: `convert all remaining classes to inheritance format`

---

### Task 7: Clean up integrity tests

The integrity test that checks `gearStats`/`totalWeaponAttack` against breakdown was already patched in Task 5 to skip inherited templates. Now add a new test that validates inherited templates resolve correctly.

**Files:**
- Modify: `src/data/integrity.test.ts`

**Step 1: Write the new test**

```typescript
describe('inherited gear template consistency', () => {
  it('every inherited template resolves to a valid CharacterBuild', () => {
    for (const [key, build] of gearTemplates) {
      expect(build.className, `${key}: missing className`).toBeTruthy();
      expect(build.totalWeaponAttack, `${key}: missing totalWeaponAttack`).toBeGreaterThan(0);
      expect(build.attackPotion, `${key}: missing attackPotion`).toBeGreaterThan(0);
      expect(build.gearStats, `${key}: missing gearStats`).toBeDefined();
    }
  });

  it('every tier in tier-defaults.json is used by at least one template', () => {
    const tierDefaultsRaw = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../../data/tier-defaults.json'), 'utf-8')
    );
    const definedTiers = Object.keys(tierDefaultsRaw);
    for (const tier of definedTiers) {
      expect(tiers, `Tier "${tier}" in tier-defaults.json not found in discovered tiers`).toContain(tier);
    }
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/data/integrity.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/integrity.test.ts
git commit -m "add integrity tests for inherited gear templates"
```

---

### Task 8: Final verification

Run the full test suite, type-checks, and a manual DPS comparison.

**Step 1: Run all checks**

```bash
npx vitest run && cd web && npm test && cd .. && npm run type-check:all
```

**Step 2: Run simulate and verify output looks correct**

```bash
npm run simulate
npm run simulate -- --targets 6
npm run simulate -- --kb
npm run simulate -- proposals/brandish-buff-20.json
```

**Step 3: Run web app locally and spot-check**

```bash
cd web && npm run dev
```

Verify dashboard loads, DPS numbers match, proposal builder works.
