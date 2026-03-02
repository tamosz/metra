# Perfect Funding Tier Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "perfect" funding tier (top 0.1%, theoretical max gear) and correct 6 inflated high tier weapon values.

**Architecture:** Purely additive data layer change. Create 13 gear template JSON files, update `TIER_ORDER`, fix 6 existing templates, update docs and one web component. Engine/simulation/CLI auto-discover tiers from templates — no code changes needed.

**Tech Stack:** JSON data files, TypeScript types, React component, Vitest.

---

## Reference Tables

### Perfect Tier Weapon WATK (godly clean + 7/7 30% scrolls)

Non-weapon WATK (standard physical): glove 22 + cape 20 + shoe 18 + medal 3 + ring4 1 = **64**
Non-weapon WATK (Shadower): glove 22 + cape 20 + shoe 18 + ring3 1 = **61** (no medal WATK)

| Class | File | weaponType | wSpeed | Weapon | Passive | Proj | totalWATK | baseStats primary | gearStats |
|-------|------|-----------|:---:|:---:|:---:|:---:|:---:|---|---|
| Hero | hero-perfect.json | 2H Sword | 5 | 146 | — | 0 | **210** | STR 999 | STR 244, DEX 132 |
| Hero (Axe) | hero-axe-perfect.json | 2H Axe | 6 | 152 | — | 0 | **216** | STR 999 | STR 244, DEX 132 |
| DrK | drk-perfect.json | Spear | 6 | 139 | — | 0 | **203** | STR 999 | STR 244, DEX 132 |
| Paladin | paladin-perfect.json | 2H Sword | 6 | 146 | — | 0 | **210** | STR 999 | STR 244, DEX 132 |
| NL | nl-perfect.json | Claw | 4 | 95 | — | 30 | **159** | LUK 999 | LUK 168, DEX 155, STR 26 |
| BM | bowmaster-perfect.json | Bow | 6 | 140 | +10 | 0 | **214** | DEX 999 | DEX 228, STR 127 |
| MM | marksman-perfect.json | Crossbow | 6 | 143 | +15 | 0 | **222** | DEX 999 | DEX 228, STR 127 |
| Corsair | sair-perfect.json | Gun | 6 | 119 | — | 20 | **183** | DEX 999 | DEX 235, STR 120 |
| Bucc | bucc-perfect.json | Knuckle | 6 | 123 | — | 0 | **187** | STR 999 | STR 221, DEX 146 |
| Shadower | shadower-perfect.json | Dagger | 5 | 145 | — | 0 | **254** | LUK 933 | LUK 205, DEX 165, STR 108 |
| Mages (×3) | {class}-perfect.json | Staff | 6 | 190 MATK | — | 0 | **190** | INT 999 | INT 320 |

Shadower total: weapon 145 + shield 48 + cape 20 + shoe 18 + glove 22 + ring3 1 = 254.
Shield WATK estimated at 48 (godly + perfect scrolled, up from 43 at high).

Mage templates: same for all 3 (Archmage I/L, Archmage F/P, Bishop). `attackPotion: 220` (Ssiws Cheese), `speedInfusion: false`.

### High Tier Corrections

| Class | File | Old weapon | New weapon | Old total | New total |
|-------|------|:---:|:---:|:---:|:---:|
| Hero | hero-high.json | 150 | 140 | 203 | **193** |
| DrK | drk-high.json | 139 | 134 | 192 | **187** |
| Paladin | paladin-high.json | 150 | 140 | 203 | **193** |
| Corsair | sair-high.json | 120 | 114 | 173 | **167** |
| Bucc | bucc-high.json | 128 | 118 | 181 | **171** |
| Shadower | shadower-high.json | 145 | 140 | 238 | **233** |

### Gear Stats Estimation

+70 primary stat, +30 secondary stat over high tier. Represents godly bases (+5 per piece across ~10-12 stat-contributing equipment slots) plus improved scroll success.

---

## Task 1: Add 'perfect' to TIER_ORDER and update tier coverage test

**Files:**
- Modify: `src/data/types.ts:2`
- Modify: `src/data/integrity.test.ts:32-33`

**Step 1: Update TIER_ORDER**

In `src/data/types.ts` line 2, change:
```ts
export const TIER_ORDER: readonly string[] = ['low', 'mid', 'high'];
```
to:
```ts
export const TIER_ORDER: readonly string[] = ['low', 'mid', 'high', 'perfect'];
```

**Step 2: Update integrity test to require 'perfect' tier**

In `src/data/integrity.test.ts` lines 32-33, change:
```ts
  it('every class has templates for all 3 tiers (low, mid, high)', () => {
    const requiredTiers = ['low', 'mid', 'high'];
```
to:
```ts
  it('every class has templates for all 4 tiers (low, mid, high, perfect)', () => {
    const requiredTiers = ['low', 'mid', 'high', 'perfect'];
```

**Step 3: Run tests to verify failure**

Run: `npx vitest run src/data/integrity.test.ts`
Expected: FAIL — "Missing gear template: hero-perfect" (and others).

**Step 4: Commit**

```
add perfect to tier order and update coverage test

test expects perfect tier templates that don't exist yet
```

---

## Task 2: Create perfect tier templates — Warriors

**Files:**
- Create: `data/gear-templates/hero-perfect.json`
- Create: `data/gear-templates/hero-axe-perfect.json`
- Create: `data/gear-templates/drk-perfect.json`
- Create: `data/gear-templates/paladin-perfect.json`
- Reference: `data/gear-templates/hero-high.json` (template structure)

Copy `hero-high.json` as the base structure. For each warrior template, update:
- `source` → note godly + 7/7 30% scrolls
- `label` → "{Class} Perfect"
- `totalWeaponAttack` → per reference table
- `gearStats` → `{ "STR": 244, "DEX": 132, "INT": 0, "LUK": 0 }`
- `gearBreakdown.weapon.WATK` → per reference table
- `gearBreakdown.{cape,shoe,glove}.WATK` → 20, 18, 22

**Step 1: Create `hero-perfect.json`**

```json
{
  "source": "Theoretical max: godly Stonetooth (111) + 7/7 30% scrolls (+35) = 146. C/G/S 22/20/18. Gear stats estimated from godly bases + perfect scrolling.",
  "label": "Hero Perfect",
  "className": "Hero",
  "baseStats": { "STR": 999, "DEX": 23, "INT": 4, "LUK": 4 },
  "gearStats": { "STR": 244, "DEX": 132, "INT": 0, "LUK": 0 },
  "totalWeaponAttack": 210,
  "weaponType": "2H Sword",
  "weaponSpeed": 5,
  "attackPotion": 100,
  "potionName": "Apple",
  "projectile": 0,
  "echoActive": true,
  "mwLevel": 20,
  "speedInfusion": true,
  "sharpEyes": true,
  "gearBreakdown": {
    "weapon":  { "STR": 26, "DEX": 0,  "WATK": 146 },
    "helmet":  { "STR": 26, "DEX": 45, "WATK": 0 },
    "top":     { "STR": 65, "DEX": 13, "WATK": 0 },
    "earring": { "STR": 20, "DEX": 5,  "WATK": 0 },
    "eye":     { "STR": 11, "DEX": 11, "WATK": 0 },
    "face":    { "STR": 15, "DEX": 10, "WATK": 0 },
    "pendant": { "STR": 27, "DEX": 28, "WATK": 0 },
    "belt":    { "STR": 5,  "DEX": 5,  "WATK": 0 },
    "medal":   { "STR": 0,  "DEX": 0,  "WATK": 3 },
    "ring1":   { "STR": 13, "DEX": 5,  "WATK": 0 },
    "ring2":   { "STR": 10, "DEX": 5,  "WATK": 0 },
    "ring3":   { "STR": 8,  "DEX": 2,  "WATK": 0 },
    "ring4":   { "STR": 8,  "DEX": 3,  "WATK": 1 },
    "cape":    { "STR": 0,  "DEX": 0,  "WATK": 20 },
    "shoe":    { "STR": 0,  "DEX": 0,  "WATK": 18 },
    "glove":   { "STR": 0,  "DEX": 0,  "WATK": 22 }
  }
}
```

**Step 2: Create `hero-axe-perfect.json`**

Same as hero-perfect but:
- `className`: "Hero (Axe)"
- `weaponType`: "2H Axe"
- `weaponSpeed`: 6
- `totalWeaponAttack`: 216
- `gearBreakdown.weapon.WATK`: 152

**Step 3: Create `drk-perfect.json`**

Same warrior structure but:
- `className`: "DrK"
- `weaponType`: "Spear"
- `weaponSpeed`: 6
- `totalWeaponAttack`: 203
- `gearBreakdown.weapon.WATK`: 139

**Step 4: Create `paladin-perfect.json`**

Same warrior structure but:
- `className`: "Paladin"
- `weaponType`: "2H Sword"
- `weaponSpeed`: 6
- `totalWeaponAttack`: 210
- `gearBreakdown.weapon.WATK`: 146

**Step 5: Commit**

```
add perfect tier templates for warriors
```

---

## Task 3: Create perfect tier templates — Thieves

**Files:**
- Create: `data/gear-templates/nl-perfect.json`
- Create: `data/gear-templates/shadower-perfect.json`
- Reference: `data/gear-templates/nl-high.json`, `data/gear-templates/shadower-high.json`

**Step 1: Create `nl-perfect.json`**

Copy nl-high.json structure. Changes from high:
- `source`: note Dragon Purple Claw (godly 60 + 7/7 30% = 95)
- `label`: "NL Perfect"
- `gearStats`: `{ "STR": 26, "DEX": 155, "INT": 0, "LUK": 168 }`
- `totalWeaponAttack`: 159
- `gearBreakdown.weapon.WATK`: 95
- `gearBreakdown.{cape,shoe,glove}.WATK`: 20, 18, 22
- `projectile`: 30 (unchanged, BFury)
- `shadowPartner`: true (unchanged)

**Step 2: Create `shadower-perfect.json`**

Copy shadower-high.json structure. Changes from high:
- `label`: "Shadower Perfect"
- `gearStats`: `{ "STR": 108, "DEX": 165, "INT": 0, "LUK": 205 }`
- `totalWeaponAttack`: 254
- `gearBreakdown.weapon.WATK`: 145
- `gearBreakdown.shield.WATK`: 48 (estimated godly + perfect scrolled)
- `gearBreakdown.{cape,shoe,glove}.WATK`: 20, 18, 22
- `shadowPartner`: true (unchanged)

**Step 3: Commit**

```
add perfect tier templates for thieves
```

---

## Task 4: Create perfect tier templates — Archers

**Files:**
- Create: `data/gear-templates/bowmaster-perfect.json`
- Create: `data/gear-templates/marksman-perfect.json`
- Reference: `data/gear-templates/bowmaster-high.json`, `data/gear-templates/marksman-high.json`

**Step 1: Create `bowmaster-perfect.json`**

Copy bowmaster-high.json structure. Changes from high:
- `label`: "Bowmaster Perfect"
- `gearStats`: `{ "STR": 127, "DEX": 228, "INT": 0, "LUK": 0 }`
- `totalWeaponAttack`: 214
- `gearBreakdown.weapon.WATK`: 140
- `gearBreakdown.bowExpert.WATK`: 10 (unchanged)
- `gearBreakdown.{cape,shoe,glove}.WATK`: 20, 18, 22

**Step 2: Create `marksman-perfect.json`**

Copy marksman-high.json structure. Changes from high:
- `label`: "Marksman Perfect"
- `gearStats`: `{ "STR": 127, "DEX": 228, "INT": 0, "LUK": 0 }`
- `totalWeaponAttack`: 222
- `gearBreakdown.weapon.WATK`: 143
- `gearBreakdown.crossbowExpert.WATK`: 15 (unchanged)
- `gearBreakdown.{cape,shoe,glove}.WATK`: 20, 18, 22

**Step 3: Commit**

```
add perfect tier templates for archers
```

---

## Task 5: Create perfect tier templates — Pirates

**Files:**
- Create: `data/gear-templates/sair-perfect.json`
- Create: `data/gear-templates/bucc-perfect.json`
- Reference: `data/gear-templates/sair-high.json`, `data/gear-templates/bucc-high.json`

**Step 1: Create `sair-perfect.json`**

Copy sair-high.json structure. Changes from high:
- `label`: "Corsair Perfect"
- `gearStats`: `{ "STR": 120, "DEX": 235, "INT": 0, "LUK": 0 }`
- `totalWeaponAttack`: 183
- `gearBreakdown.weapon.WATK`: 119
- `gearBreakdown.{cape,shoe,glove}.WATK`: 20, 18, 22
- `projectile`: 20 (unchanged, Eternal Bullet)

**Step 2: Create `bucc-perfect.json`**

Copy bucc-high.json structure. Changes from high:
- `label`: "Buccaneer Perfect"
- `gearStats`: `{ "STR": 221, "DEX": 146, "INT": 0, "LUK": 0 }`
- `totalWeaponAttack`: 187
- `gearBreakdown.weapon.WATK`: 123
- `gearBreakdown.{cape,shoe,glove}.WATK`: 20, 18, 22

**Step 3: Commit**

```
add perfect tier templates for pirates
```

---

## Task 6: Create perfect tier templates — Mages

**Files:**
- Create: `data/gear-templates/archmage-il-perfect.json`
- Create: `data/gear-templates/archmage-fp-perfect.json`
- Create: `data/gear-templates/bishop-perfect.json`
- Reference: `data/gear-templates/archmage-il-high.json`

All 3 mage templates are identical (same as high tier pattern). Copy archmage-il-high.json. Changes from high:
- `label`: "{Class} Perfect"
- `gearStats`: `{ "STR": 0, "DEX": 0, "INT": 320, "LUK": 0 }`
- `totalWeaponAttack`: 190
- `gearBreakdown.weapon.MATK`: 190
- `attackPotion`: 220 (unchanged, Ssiws Cheese)
- `speedInfusion`: false (unchanged)

**Step 1: Create all 3 mage templates**

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS — perfect tier templates now exist for all 13 classes.

**Step 3: Commit**

```
add perfect tier templates for mages

all 13 classes now have low/mid/high/perfect gear templates
```

---

## Task 7: Correct high tier weapon values

**Files:**
- Modify: `data/gear-templates/hero-high.json` — weapon 150→140, total 203→193
- Modify: `data/gear-templates/drk-high.json` — weapon 139→134, total 192→187
- Modify: `data/gear-templates/paladin-high.json` — weapon 150→140, total 203→193
- Modify: `data/gear-templates/sair-high.json` — weapon 120→114, total 173→167
- Modify: `data/gear-templates/bucc-high.json` — weapon 128→118, total 181→171
- Modify: `data/gear-templates/shadower-high.json` — weapon 145→140, total 238→233

For each file, update two values:
1. `totalWeaponAttack` (top-level field)
2. `gearBreakdown.weapon.WATK`

**Step 1: Edit all 6 templates**

Hero: `totalWeaponAttack: 203` → `193`, `weapon.WATK: 150` → `140`
DrK: `totalWeaponAttack: 192` → `187`, `weapon.WATK: 139` → `134`
Paladin: `totalWeaponAttack: 203` → `193`, `weapon.WATK: 150` → `140`
Corsair: `totalWeaponAttack: 173` → `167`, `weapon.WATK: 120` → `114`
Bucc: `totalWeaponAttack: 181` → `171`, `weapon.WATK: 128` → `118`
Shadower: `totalWeaponAttack: 238` → `233`, `weapon.WATK: 145` → `140`

**Step 2: Run tests**

Run: `npx vitest run`
Expected: FAIL — integration test high-tier DPS reference values no longer match.

---

## Task 8: Update integration test reference values

**Files:**
- Modify: `src/integration.test.ts`

The high tier DPS assertions (lines 199-211) and the proposal test (line 67) will fail because 6 classes have lower weapon WATK.

**Step 1: Run simulation to get new reference values**

Run: `npm run simulate`
Extract new high-tier DPS for each affected class from the baseline output.

**Step 2: Update high-tier DPS assertions**

In `src/integration.test.ts` lines 193-211, update the `toBeCloseTo` values for:
- `Hero` `Brandish (Sword)` — was 247314, will decrease
- `DrK` `Spear Crusher` — was 251906, will decrease
- `Paladin` `Blast (Holy, Sword)` — was 192932, will decrease
- `Corsair` `Battleship Cannon` — was 350586, will decrease
- `Corsair` `Rapid Fire` — was 241520, will decrease
- `Shadower` `BStep + Assassinate` — was 326734, will decrease

Also update the proposal test at line 67:
- `heroDelta.after` — was 264916.78889, will decrease

**Step 3: Run tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```
correct high tier weapon values to respect theoretical max

godly system caps weapon WATK at +5 over MS max base. six high
tier templates exceeded this, corrected to ~1 failed slot below
perfect: Hero 150→140, DrK 139→134, Paladin 150→140,
Corsair 120→114, Bucc 128→118, Shadower 145→140
```

---

## Task 9: Document godly system and perfect tier

**Files:**
- Modify: `data/gear-assumptions.md`

**Step 1: Add godly system section**

Add a new section after "1. Universal Assumptions" explaining:
- MapleRoyals godly system: every stat on equipment can roll up to +5 over original MS max base
- Applies to WATK/MATK, STR, DEX, LUK, INT, and all other stats
- Example: Stonetooth Sword MS max clean 106 → godly 111
- Theoretical max weapon WATK = godly clean + 7 slots × 5 (30% dark scroll) = godly + 35
- Reference table of all weapons with MS max, godly, and theoretical max values

**Step 2: Add perfect tier section**

Document in the tier-specific sections:
- Perfect tier = top 0.1%, theoretical maximum
- C/G/S: 22/20/18 (total 60 WATK from accessories)
- Weapon: godly clean + 7/7 30% dark scrolls
- Potion: Apple (100 WATK) / Ssiws Cheese (220 MATK)
- Gear stats: godly bases + perfect scrolling (+70 primary, +30 secondary over high)
- NL uses Dragon Purple Claw (godly 60 + 35 = 95) instead of Raven's Claw

**Step 3: Update the high tier C/G/S correction note**

Note the 6 corrected high tier weapon values and rationale.

**Step 4: Commit**

```
document godly system and perfect tier assumptions
```

---

## Task 10: Update TierAssumptions web component

**Files:**
- Modify: `web/src/components/TierAssumptions.tsx`

**Step 1: Add Perfect column**

Add a `<th>` for "Perfect (Lv200)" after the High column header (line 24).
Add a `<td>` to each of the 3 body rows:
- Weapon row: "Theoretical max"
- Potion row: "Apple"
- C/G/S row: "22 / 20 / 18"

**Step 2: Run web tests**

Run: `cd web && npm test`
Expected: PASS (TierAssumptions has no unit tests, but verify nothing else breaks).

**Step 3: Visually verify**

Run: `cd web && npm run dev`
Open dashboard, expand Tier Assumptions, verify 4-column table renders correctly.

**Step 4: Commit**

```
add perfect tier to tier assumptions panel
```

---

## Task 11: Run formatter if configured, final test pass

**Step 1: Run all tests**

Run: `npx vitest run && cd web && npm test`
Expected: ALL PASS

**Step 2: Run web type check**

Run: `npm run type-check:all`
Expected: PASS

**Step 3: Final commit if any formatting changes**
