# Linear Gear Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 56 per-slot gear template files with a computed gear model where non-weapon stats are shared across all physical classes and weapon definitions are the only per-class differentiator.

**Architecture:** Per-class gear templates (earrings, helmets, etc.) are removed. A shared gear progression table defines gear stat budgets per tier — identical for all physical classes. Each class only specifies its weapon (godly clean WATK, speed, stat) and class-specific equipment (shield, passives). Builds are computed on the fly: `weapon WATK = godlyClean + scrollBonus[tier]`, gear stats come from the shared table. The `CharacterBuild` interface is unchanged — only how it's constructed changes.

**Tech Stack:** TypeScript, Vitest, React (web app updates)

---

## Context

The earring audit revealed that non-weapon gear stats at perfect tier are nearly identical across all non-mage classes (primary ~295, secondary ~168, non-weapon WATK 84). The per-slot breakdowns at lower tiers introduced inconsistencies (up to 10x cross-class spread on earrings alone). The weapon is the real differentiator between classes — everything else is noise.

Mages are treated as a separate category with their own gear progression. They are not directly comparable to physical classes.

### Validated perfect-tier baselines

**Physical (all 12 non-mage classes):**
- Non-weapon gear primary stat: 295 (+/- 1)
- Non-weapon gear secondary stat: 168 (+/- 1, NL is 158 — to be normalized)
- Non-weapon WATK: 84 (CGS 70 + medal 3 + belt 10 + ring 1)
- Weapon scroll bonus: +35 (7/7 30% scrolls, godlyClean + 35 = theoretical max)
- Base primary: 999, base secondary: 23

**Exceptions to fold in:**
- Shadower: shield slot (WATK 43, LUK 8, STR 14) — modeled as `shieldWATK` + `shieldStats` on class base
- Bow/Crossbow Expert: passive WATK (+10/+15) — modeled as `passiveWATK` on class base
- Hero-ST: 120 DEX weapon requirement — at lower tiers, base STR reduced to meet DEX req
- Projectile WATK: per-class, varies by tier for NL (star quality scales with funding)

### Weapon data (perfect tier, verified)

| Weapon | Class | Godly Clean | +35 | Current | Match? |
|--------|-------|:-----------:|:---:|:-------:|:------:|
| Dragon Claymore | Hero, Paladin | 115 | 150 | 150 | yes |
| Stonetooth Sword | Hero (ST) | 111 | 146 | 146 | yes |
| Dragon Battle Axe | Hero (Axe) | 117 | 152 | 152 | yes |
| Sky Ski | Dark Knight | 104 | 139 | 139 | yes |
| Dragon Flame | Paladin (BW) | 122 | 157 | 160 | **no (+3)** |
| Dragon Purple Claw | Night Lord | 60 | 95 | 95 | yes |
| Dragon Kanzir | Shadower | 110 | 145 | 145 | yes |
| Dragon Shiner Bow | Bowmaster | 110 | 145 | 145 | yes |
| Dark Neschere | Marksman | 108 | 143 | 148 | **no (+5)** |
| Concerto | Corsair | 84 | 119 | 123 | **no (+4)** |
| Dragon Slash Claw | Buccaneer | 88 | 123 | 123 | yes |

Three weapons exceed theoretical max — fix these as part of the migration.

---

## File Plan

### Create
- `data/gear-progression.json` — shared gear stat budgets per tier (physical + mage)
- `src/data/gear-compute.ts` — `computeBuild(classBase, tier)` replaces gear-merge pipeline
- `src/data/gear-compute.test.ts` — tests for computed builds

### Modify
- `data/gear-templates/*.base.json` — add weapon data (`godlyCleanWATK`, `weaponStat`, `primaryStat`, `secondaryStat`), shield, passives
- `src/data/loader.ts` — use `computeBuild` instead of loading per-tier template files
- `src/data/loader.test.ts` — update tests for computed builds
- `web/src/data/bundle.ts` — same, remove `getGearBreakdown` export
- `src/core.ts` — remove `computeGearTotals` and `mergeGearTemplate` re-exports, add `computeBuild` / `ClassBase`
- `src/index.ts` — same
- `packages/engine/src/types.ts` — no changes (CharacterBuild stays the same)
- `src/data/integrity.test.ts` — update to test computed builds
- `web/src/components/BuildExplorer.tsx` — remove TemplateEditor integration
- `scripts/validate-data.ts` — update gear template validation for base-only files

### Delete
- All 56 `data/gear-templates/*-{tier}.json` files
- `data/tier-defaults.json` — folded into `gear-progression.json` (CGS defaults remain in `web/src/utils/cgs.ts`)
- `src/data/gear-merge.ts` + `src/data/gear-merge.test.ts`
- `src/data/gear-utils.ts` + `src/data/gear-utils.test.ts`
- `web/src/components/TemplateEditor.tsx` + `web/src/components/TemplateEditor.test.tsx`
- `web/src/components/TemplateProposal.tsx` + `web/src/components/TemplateProposal.test.tsx` (orphaned by TemplateEditor removal)
- `web/src/utils/template-proposal.ts` + `web/src/utils/template-proposal.test.ts` (orphaned)
- `scripts/compare-templates.ts` (no longer applicable)

---

## Tasks

### Task 0: Capture DPS baseline before migration

**Files:** none (verification only)

Capture baseline DPS output from the current code before any changes, for regression comparison in Task 9.

- [ ] **Step 1: Run baseline simulation and save output**

```bash
npm run simulate > /tmp/baseline-dps.txt 2>&1
npm run simulate -- --targets 6 > /tmp/baseline-dps-training.txt 2>&1
```

- [ ] **Step 2: Save perfect-tier output separately**

This is the highest-trust tier. After migration, perfect-tier DPS should be closest to this baseline.

---

### Task 1: Define shared gear progression data

**Files:**
- Create: `data/gear-progression.json`

This is the core data change. Derive per-tier gear budgets by averaging current trusted templates.

- [ ] **Step 1: Derive physical gear stats per tier**

Write a one-off script or manually compute: for each tier, average the non-weapon gear primary, gear secondary, and non-weapon WATK across all physical classes from the current templates. Perfect tier is already verified (295/168/84). Low/mid/high need derivation.

Include: `scrollBonus` (WATK from weapon scrolling, uniform across weapons), `basePrimary`, `baseSecondary`, `attackPotion`, `projectile` (default, overridable per class).

- [ ] **Step 2: Derive mage gear stats per tier**

Same process for mages. Mage templates use INT/LUK/MATK instead of STR/DEX/WATK. Derive from the 3 mage class perfect templates (identical stats confirmed).

- [ ] **Step 3: Write gear-progression.json**

```json
{
  "physical": {
    "perfect": {
      "gearPrimary": 295,
      "gearSecondary": 168,
      "nonWeaponWATK": 84,
      "scrollBonus": 35,
      "basePrimary": 999,
      "baseSecondary": 23,
      "attackPotion": 140
    },
    "high": { "..." : "derived from step 1" },
    "mid": { "..." : "derived from step 1" },
    "low": { "..." : "derived from step 1" }
  },
  "mage": {
    "perfect": { "..." : "derived from step 2" },
    "high": { "..." : "derived from step 2" },
    "mid": { "..." : "derived from step 2" },
    "low": { "..." : "derived from step 2" }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add data/gear-progression.json
git commit -m "add shared gear progression data for linear gear model"
```

---

### Task 2: Extend class base files with weapon data

**Files:**
- Modify: all 15 `data/gear-templates/*.base.json` files

Move weapon-specific data into the base files so each class is fully defined without per-tier templates.

- [ ] **Step 1: Define the extended base schema**

Add to each base file:
- `category`: `"physical"` or `"mage"` (determines which gear progression to use)
- `primaryStat`: e.g., `"STR"` for warriors — authoritative, no string matching
- `secondaryStat`: e.g., `"DEX"` or `["STR", "DEX"]` for Shadower
- `godlyCleanWATK`: weapon's godly clean WATK (from gear-assumptions.md table)
- `weaponStat`: primary stat on the weapon at perfect tier (e.g., 21 for warriors)
- `passiveWATK` (optional): Bow Expert (+10) / Crossbow Expert (+15)
- `shieldWATK` (optional): Shadower's Dragon Khanjar (+43)
- `shieldStats` (optional): Shadower's shield stats (`{ "LUK": 8, "STR": 14 }`)
- `dexRequirement` (optional): Hero-ST's 120 DEX weapon requirement

- [ ] **Step 2: Update each base file**

Example — `hero.base.json`:
```json
{
  "className": "Hero",
  "category": "physical",
  "primaryStat": "STR",
  "secondaryStat": "DEX",
  "weaponType": "2H Sword",
  "weaponSpeed": 6,
  "godlyCleanWATK": 115,
  "weaponStat": 21,
  "projectile": 0,
  "echoActive": true,
  "mwLevel": 20,
  "speedInfusion": true,
  "sharpEyes": true
}
```

Example — `shadower.base.json`:
```json
{
  "className": "Shadower",
  "category": "physical",
  "primaryStat": "LUK",
  "secondaryStat": ["STR", "DEX"],
  "weaponType": "Dagger",
  "weaponSpeed": 4,
  "godlyCleanWATK": 110,
  "weaponStat": 21,
  "shieldWATK": 43,
  "shieldStats": { "LUK": 8, "STR": 14 },
  "projectile": 0,
  "echoActive": true,
  "mwLevel": 20,
  "speedInfusion": true,
  "sharpEyes": true,
  "shadowPartner": false
}
```

Example — `bowmaster.base.json` (note: weaponSpeed is 6 from actual file, not 5):
```json
{
  "className": "Bowmaster",
  "category": "physical",
  "primaryStat": "DEX",
  "secondaryStat": "STR",
  "weaponType": "Bow",
  "weaponSpeed": 6,
  "godlyCleanWATK": 110,
  "weaponStat": 15,
  "passiveWATK": 10,
  "projectile": 12,
  "echoActive": true,
  "mwLevel": 20,
  "speedInfusion": true,
  "sharpEyes": true
}
```

Update all 15 base files with the correct values from the gear-assumptions.md weapon table.

- [ ] **Step 3: Fix weapon WATK errors**

Paladin BW godlyClean should produce 157 (not 160), Marksman 143 (not 148), Corsair 119 (not 123). Verify godlyClean values against gear-assumptions.md before writing.

- [ ] **Step 4: Commit**

```bash
git add data/gear-templates/*.base.json
git commit -m "add weapon data to class base files"
```

---

### Task 3: Implement gear-compute module

**Files:**
- Create: `src/data/gear-compute.ts`
- Create: `src/data/gear-compute.test.ts`

Core logic: given a class base + tier name, produce a `CharacterBuild`.

- [ ] **Step 1: Write failing tests**

```typescript
// gear-compute.test.ts
import { computeBuild } from './gear-compute.js';
import type { ClassBase } from './gear-compute.js';

const heroBase: ClassBase = {
  className: 'Hero',
  category: 'physical',
  primaryStat: 'STR',
  secondaryStat: 'DEX',
  weaponType: '2H Sword',
  weaponSpeed: 6,
  godlyCleanWATK: 115,
  weaponStat: 21,
  projectile: 0,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
};

describe('computeBuild', () => {
  it('perfect tier hero has correct weapon WATK', () => {
    const build = computeBuild(heroBase, 'perfect');
    // godlyClean 115 + scrollBonus 35 + nonWeaponWATK 84 = 234
    expect(build.totalWeaponAttack).toBe(234);
  });

  it('perfect tier hero has correct gear stats', () => {
    const build = computeBuild(heroBase, 'perfect');
    expect(build.gearStats.STR).toBe(295 + 21); // gear primary + weapon stat
    expect(build.gearStats.DEX).toBe(168);
  });

  it('perfect tier hero has correct base stats', () => {
    const build = computeBuild(heroBase, 'perfect');
    expect(build.baseStats.STR).toBe(999);
    expect(build.baseStats.DEX).toBe(23);
  });

  it('shadower includes shield WATK and stats', () => {
    const shadBase: ClassBase = {
      ...heroBase,
      className: 'Shadower',
      category: 'physical',
      weaponType: 'Dagger',
      weaponSpeed: 4,
      godlyCleanWATK: 110,
      weaponStat: 21,
      shieldWATK: 43,
      shieldStats: { LUK: 8, STR: 14 },
    };
    const build = computeBuild(shadBase, 'perfect');
    // weapon 145 + shield 43 + nonWeapon 84 = 272
    expect(build.totalWeaponAttack).toBe(272);
    // gear LUK includes shield LUK
    expect(build.gearStats.LUK).toBe(295 + 21 + 8);
  });

  it('bowmaster includes passive WATK', () => {
    const bmBase: ClassBase = {
      ...heroBase,
      className: 'Bowmaster',
      weaponType: 'Bow',
      weaponSpeed: 5,
      godlyCleanWATK: 110,
      weaponStat: 15,
      passiveWATK: 10,
      projectile: 12,
    };
    const build = computeBuild(bmBase, 'perfect');
    // weapon 145 + passive 10 + nonWeapon 84 = 239
    expect(build.totalWeaponAttack).toBe(239);
  });

  it('throws for unknown tier', () => {
    expect(() => computeBuild(heroBase, 'ultra')).toThrow();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/data/gear-compute.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement gear-compute.ts**

```typescript
// gear-compute.ts
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { CharacterBuild, StatName } from '@metra/engine';

export interface ClassBase {
  className: string;
  category: 'physical' | 'mage';
  primaryStat: StatName;
  secondaryStat: StatName | StatName[];
  weaponType: string;
  weaponSpeed: number;
  godlyCleanWATK: number;
  weaponStat: number;
  projectile: number;
  echoActive: boolean;
  mwLevel: number;
  speedInfusion: boolean;
  sharpEyes: boolean;
  shadowPartner?: boolean;
  passiveWATK?: number;
  shieldWATK?: number;
  shieldStats?: Partial<Record<StatName, number>>;
  dexRequirement?: number;
}

interface TierGear {
  gearPrimary: number;
  gearSecondary: number;
  nonWeaponWATK: number;
  scrollBonus: number;
  basePrimary: number;
  baseSecondary: number;
  attackPotion: number;
}

interface GearProgression {
  physical: Record<string, TierGear>;
  mage: Record<string, TierGear>;
}

let cache: GearProgression | null = null;

function loadProgression(): GearProgression {
  if (!cache) {
    const DATA_DIR = resolve(import.meta.dirname, '../../data');
    cache = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'gear-progression.json'), 'utf-8')
    ) as GearProgression;
  }
  return cache;
}

export function computeBuild(base: ClassBase, tier: string): CharacterBuild {
  const progression = loadProgression();
  const category = progression[base.category];
  const tierGear = category[tier];
  if (!tierGear) {
    throw new Error(`Unknown tier "${tier}" for category "${base.category}"`);
  }

  const primaryStat = base.primaryStat;
  const secondaryStat = Array.isArray(base.secondaryStat)
    ? base.secondaryStat[0]  // first secondary for gear stat assignment
    : base.secondaryStat;

  const weaponWATK = base.godlyCleanWATK + tierGear.scrollBonus;
  const totalWeaponAttack =
    weaponWATK +
    tierGear.nonWeaponWATK +
    (base.passiveWATK ?? 0) +
    (base.shieldWATK ?? 0);

  const gearStats = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  gearStats[primaryStat] = tierGear.gearPrimary + base.weaponStat;
  gearStats[secondaryStat] = tierGear.gearSecondary;

  // Add shield stats if present
  if (base.shieldStats) {
    for (const [stat, value] of Object.entries(base.shieldStats)) {
      gearStats[stat as StatName] += value;
    }
  }

  const baseStats = { STR: 4, DEX: 4, INT: 4, LUK: 4 };
  baseStats[primaryStat] = tierGear.basePrimary;
  baseStats[secondaryStat] = tierGear.baseSecondary;

  return {
    className: base.className,
    baseStats,
    gearStats,
    totalWeaponAttack,
    weaponType: base.weaponType,
    weaponSpeed: base.weaponSpeed,
    attackPotion: tierGear.attackPotion,
    projectile: base.projectile,
    echoActive: base.echoActive,
    mwLevel: base.mwLevel,
    speedInfusion: base.speedInfusion,
    sharpEyes: base.sharpEyes,
    shadowPartner: base.shadowPartner,
  };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run src/data/gear-compute.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/gear-compute.ts src/data/gear-compute.test.ts
git commit -m "implement computed gear model"
```

---

### Task 4: Wire up the loader and update re-exports

**Files:**
- Modify: `src/data/loader.ts`
- Modify: `src/core.ts` — remove `computeGearTotals` / `mergeGearTemplate` re-exports, add `computeBuild` / `ClassBase`
- Modify: `src/index.ts` — same

Replace `loadGearTemplate` and template file scanning with `computeBuild`.

- [ ] **Step 1: Update loader to use computeBuild**

Replace `loadGearTemplate()` with loading the class base and calling `computeBuild()`. Update `discoverClassesAndTiers()` to use the gear progression tier list instead of scanning for template files.

The tier list comes from `gear-progression.json` keys (physical tier names). A class is included if it has both a skill file and a `.base.json` file.

- [ ] **Step 2: Remove loadGearTemplate and flat-mode parsing**

Delete the old `loadGearTemplate` function and all references to per-tier JSON files.

- [ ] **Step 3: Update src/core.ts and src/index.ts**

Both re-export `computeGearTotals` from `./data/gear-utils.js` and `mergeGearTemplate` from `./data/gear-merge.js`. Remove these imports and re-exports. Add re-exports of `computeBuild` and `ClassBase` from `./data/gear-compute.js`.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`

Some tests will break — integrity tests and loader tests that reference specific gear breakdown values. Fix forward in the next task.

- [ ] **Step 5: Commit**

```bash
git add src/data/loader.ts src/core.ts src/index.ts
git commit -m "switch loader to computed gear model"
```

---

### Task 5: Update integrity and loader tests

**Files:**
- Modify: `src/data/integrity.test.ts`
- Modify: `src/data/loader.test.ts`

- [ ] **Step 1: Read current integrity tests**

Understand what they assert. Key assertions to keep:
- Every class has skill data + a build for every tier
- Primary stat is correct per class
- Weapon type matches

Remove assertions about specific gear stat values from old templates. Add assertions that computed builds produce valid `CharacterBuild` objects.

- [ ] **Step 2: Update loader.test.ts**

Remove tests that assert specific values from old per-tier templates (e.g., `loadGearTemplate('hero-high')` with `baseStats.STR = 943`). Replace with tests that `discoverClassesAndTiers()` returns the expected classes and tiers using computed builds.

- [ ] **Step 3: Rewrite integrity tests for computed model**

Test that `discoverClassesAndTiers()` produces the expected number of classes, tiers, and valid builds. Test that computed builds have reasonable values (non-zero stats, positive WATK).

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run src/data/integrity.test.ts src/data/loader.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/data/integrity.test.ts src/data/loader.test.ts
git commit -m "update integrity and loader tests for computed gear model"
```

---

### Task 6: Update web bundle

**Files:**
- Modify: `web/src/data/bundle.ts`

- [ ] **Step 1: Import computeBuild, remove template file loading**

Replace `import.meta.glob` for tier templates with loading class bases + gear progression. Use `computeBuild` to generate builds. Remove `getGearBreakdown` export.

- [ ] **Step 2: Keep the same DiscoveryResult interface**

Consumers get the same `classNames`, `tiers`, `classDataMap`, `gearTemplates` shape. The only difference is how `gearTemplates` is populated (computed vs loaded).

- [ ] **Step 3: Run web tests**

Run: `cd web && npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add web/src/data/bundle.ts
git commit -m "switch web bundle to computed gear model"
```

---

### Task 7: Remove TemplateEditor, TemplateProposal, and per-slot UI

**Files:**
- Delete: `web/src/components/TemplateEditor.tsx` + `web/src/components/TemplateEditor.test.tsx`
- Delete: `web/src/components/TemplateProposal.tsx` + `web/src/components/TemplateProposal.test.tsx` (if exists)
- Delete: `web/src/utils/template-proposal.ts` + `web/src/utils/template-proposal.test.ts`
- Modify: `web/src/components/BuildExplorer.tsx` — remove TemplateEditor import and toggle

The TemplateEditor lets users edit per-slot gear values. With the linear model, per-slot editing doesn't apply. TemplateProposal and template-proposal utils are orphaned by TemplateEditor removal. The Build Explorer's stat override sliders still work (they override `CharacterBuild` fields directly).

- [ ] **Step 1: Remove TemplateEditor from BuildExplorer**

Remove the import, state, toggle button, and rendered component.

- [ ] **Step 2: Delete TemplateEditor, TemplateProposal, and template-proposal files**

- [ ] **Step 3: Run web tests**

Run: `cd web && npx vitest run`

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "remove per-slot template editor and proposal utils"
```

---

### Task 8: Delete old gear template files and supporting code

**Files:**
- Delete: all 56 `data/gear-templates/*-{low,mid,high,perfect}.json` files
- Delete: `data/tier-defaults.json` — folded into `gear-progression.json`
- Delete: `src/data/gear-merge.ts` + `src/data/gear-merge.test.ts`
- Delete: `src/data/gear-utils.ts` + `src/data/gear-utils.test.ts`
- Delete: `scripts/compare-templates.ts`
- Modify: `scripts/validate-data.ts` — update gear template validation for base-only files

- [ ] **Step 1: Delete per-tier template files**

```bash
rm data/gear-templates/*-low.json data/gear-templates/*-mid.json \
   data/gear-templates/*-high.json data/gear-templates/*-perfect.json
```

Only `.base.json` files remain in `data/gear-templates/`.

- [ ] **Step 2: Delete tier-defaults.json, gear-merge, and gear-utils**

`tier-defaults.json` is now folded into `gear-progression.json`. CGS defaults remain independently in `web/src/utils/cgs.ts` for the CGS editor.

gear-merge and gear-utils are no longer imported anywhere after tasks 4 and 6.

- [ ] **Step 3: Delete compare-templates script, update validate-data**

`compare-templates.ts` is no longer applicable. `validate-data.ts` needs updating: it currently scans for non-base template files and validates their structure. Update to validate `.base.json` files and `gear-progression.json` instead.

- [ ] **Step 4: Run full test suite (root + web)**

Run: `npx vitest run && cd web && npx vitest run`

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "remove per-slot gear templates and supporting code"
```

---

### Task 9: Validate DPS output against baseline

**Files:** none (verification only)

Uses the baseline captured in Task 0.

- [ ] **Step 1: Run simulation with new code, compare against Task 0 baseline**

Run `npm run simulate` and compare against `/tmp/baseline-dps.txt`. DPS values will change (gear normalization removes class-specific biases). Document the expected changes:
- Classes that had overbudgeted earrings/gear → DPS decreases
- Classes that had underbudgeted gear → DPS increases
- Perfect tier should be closest to baseline (most trusted data)

- [ ] **Step 2: Verify perfect tier DPS is close to baseline**

Perfect tier used the most consistent gear data. Computed builds should produce very similar (not identical — NL secondary DEX was 158, now 168) DPS to the old templates.

- [ ] **Step 3: Update DPS reference values in memory if needed**

---

### Task 10: Update documentation

**Files:**
- Modify: `CLAUDE.md` — update Architecture section, file structure, gear template conventions
- Modify: `data/gear-assumptions.md` — simplify to document the linear model instead of per-slot breakdowns
- Delete: `docs/audit/earring-effective-stat.md` — findings are now addressed

- [ ] **Step 1: Update CLAUDE.md**

Update the Data Layer section to describe:
- `gear-progression.json` (shared gear stat budgets)
- `*.base.json` (class + weapon definition)
- `gear-compute.ts` (replaces gear-merge pipeline)

Remove references to per-slot gear breakdowns, CGS standardization, and template naming conventions.

- [ ] **Step 2: Simplify gear-assumptions.md**

Replace per-slot WATK breakdowns with: "Gear stats are computed from a shared progression table. The only per-class inputs are weapon definition and class-specific equipment. See `gear-progression.json` for tier budgets."

Keep the weapon table (godly clean values) as it's still useful reference.

- [ ] **Step 3: Delete earring audit doc**

The earring audit findings are addressed by this migration — the earring slot no longer exists as a separate concept.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md data/gear-assumptions.md
git rm docs/audit/earring-effective-stat.md
git commit -m "update docs for linear gear model"
```
