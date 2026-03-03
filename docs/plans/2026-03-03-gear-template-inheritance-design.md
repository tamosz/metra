# Gear Template Inheritance

## Problem

56 gear template files, each ~110 lines of JSON. Two pain points:
1. **Boilerplate** — weaponType, weaponSpeed, buffs, etc. repeated across all 4 tiers of every class
2. **Cross-tier consistency** — changing CGS values or potion tiers means editing 14+ files

## Design

Two-layer inheritance: **tier defaults** (shared across all classes at a tier) and **class bases** (shared across tiers within a class). Tier files only contain what's genuinely unique per class-tier.

### Tier Defaults (`data/tier-defaults.json`)

Single file with potion and CGS values standardized across all classes:

```json
{
  "low":     { "attackPotion": 60,  "potionName": "Stopper", "cgs": { "cape": 12, "glove": 10, "shoe": 10 } },
  "mid":     { "attackPotion": 60,  "potionName": "Stopper", "cgs": { "cape": 16, "glove": 15, "shoe": 13 } },
  "high":    { "attackPotion": 100, "potionName": "Apple",   "cgs": { "cape": 18, "glove": 20, "shoe": 16 } },
  "perfect": { "attackPotion": 100, "potionName": "Apple",   "cgs": { "cape": 22, "glove": 22, "shoe": 18 } }
}
```

### Class Base (`data/gear-templates/{class}.base.json`)

Per-class shared config, ~10 lines:

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

NL adds `"shadowPartner": true`. Mages add `"cgsStatName": "INT"` (default is `"WATK"` if omitted).

### Tier File (`data/gear-templates/{class}-{tier}.json`)

Only the unique stuff:

```json
{
  "extends": "hero",
  "source": "gear templates sheet, Hero rows 3-25, High",
  "baseStats": { "STR": 999, "DEX": 23, "INT": 4, "LUK": 4 },
  "gearBreakdown": {
    "weapon":  { "STR": 21, "DEX": 0, "WATK": 140 },
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

- No cape/glove/shoe — injected from tier defaults
- No totalWeaponAttack/gearStats — computed at load time (already works)
- No className/weaponType/buffs — inherited from class base
- Zero-value stats can be omitted
- `label` computed from className + tier

### Loader Pipeline

`loadGearTemplate(className, tier)`:
1. Read `tier-defaults.json` (cached)
2. Look for `{class}.base.json` — if missing, fall back to current flat format (backward compat)
3. Read `{class}-{tier}.json`
4. Merge: base fields -> tier file fields -> inject CGS into breakdown -> `computeGearTotals()`

### Web Bundle

`web/src/data/bundle.ts` uses `import.meta.glob` for static imports. Needs to also import base files and tier-defaults, run the same merge logic. `computeGearTotals` already exported via `src/core.ts`.

### Mage CGS

Class base declares `"cgsStatName": "INT"`. Tier defaults define the numeric values; the stat name comes from the class. Default is `"WATK"` if omitted.

### Migration

- Loader changes + tests first
- Add `tier-defaults.json`
- Convert Hero as proof of concept
- Convert remaining classes one at a time
- Each conversion verified by exact DPS match before/after
- Old flat templates keep working (no `.base.json` = no inheritance)
