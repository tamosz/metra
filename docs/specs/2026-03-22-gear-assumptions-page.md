# Gear Assumptions Page

Replaces BuildExplorer and BuildComparison pages with a single transparency-focused page documenting the gear assumptions behind all DPS simulations. Physical classes only (mages deferred).

## Goal

Make the simulation's gear inputs auditable. Anyone viewing DPS rankings should be able to see exactly what stats, weapons, and extras each class was given — and judge whether those assumptions are reasonable.

## Scope

### Add
- New "Gear" page in the web app nav (replaces Build and Compare links)

### Remove
- BuildExplorer page (`/build`)
- BuildComparison page (`/compare`)
- Associated hooks: `useBuildExplorer`, `useBuildComparison`, `useSavedBuilds`
- URL hash handlers for `#b=` (single build) and `#c=` (comparison)
- `useSavedBuilds` localStorage entries (no migration needed — they'll just be ignored)

## Page Layout

Four sections, top to bottom.

### Section 1: Common Gear

Header: **"Common Gear"** with subtitle "Same for every physical class".

Six tiles in a card:

| Tile | Value | Description |
|------|-------|-------------|
| Primary Stat from Gear | 295 | Helmet, top, bottom, pendant, earring, face, eye, belt, medal, rings |
| Secondary Stat from Gear | 168 | DEX/STR/LUK from non-weapon equipment |
| Attack Potion | 140 | Onyx Apple + Attack potion |
| Weapon Scrolling | +35 | 7 slots × 5 WATK (30% dark scrolls, all pass) |
| Godly Bonus | +5 | Royals godly system: +5 over MS max clean on weapon |

Plus a **WATK from Gear** tile with a stacked bar showing the breakdown:

| Slot | WATK |
|------|------|
| Gloves | 25 |
| Cape | 25 |
| Shoes | 25 |
| **Total** | **75** |

### Section 2: Per-Class Weapons & Extras

Header: **"Per-Class Weapons & Extras"** with subtitle "Only what differs — everything else comes from Common Gear".

Table with columns: Class, Weapon, Speed, Godly Clean, Extras, Total WATK.

No variant classes (Hero Axe, Hero ST, Paladin BW excluded).

| Class | Weapon | Speed | Godly Clean | Extras | Total WATK |
|-------|--------|:-----:|:-----------:|--------|:----------:|
| Hero | Dragon Claymore | 6 | 115 | — | 225 |
| Dark Knight | Sky Ski | 6 | 104 | — | 214 |
| Paladin | Dragon Claymore | 6 | 115 | — | 225 |
| Night Lord | Dragon Purple Claw | 4 | 60 | Stars: 0–30 (Balanced Fury) | 200 |
| Shadower | Dragon Kanzir + Shield | 4 | 110 | Shield: 10–33 WATK, +8 LUK, +14 STR | 253 |
| Bowmaster | Dragon Shiner Bow | 6 | 110 | +10 Bow Expert, Arrows: 0–12 | 242 |
| Marksman | Dragon Shiner Cross | 6 | 113 | +15 MM Boost, Bolts: 0–10 | 248 |
| Corsair | Dragonfire Revolver | 5 | 88 | Bullets: 0–24 (Royal Bullet) | 222 |
| Buccaneer | Dragon Slash Claw | 6 | 88 | — | 198 |

Total WATK = Godly Clean + Scrolling (35) + C/G/S (75) + Extras at max.

Footer note: Night Lord and Shadower have Shadow Partner active (1.5× damage multiplier, not reflected in WATK totals). Projectiles, bolts, arrows, and shield WATK shown at max; the scaling chart varies these from 0 to max.

### Section 3: WATK Composition

Header: **"WATK Composition"** with subtitle "Where each class's total weapon attack comes from".

Horizontal stacked bar chart, one bar per class, sorted by total WATK descending. Four color-coded segments:

- **Godly Clean** (blue) — weapon base attack
- **Scrolling** (purple) — +35 from dark scrolls
- **C/G/S** (cyan) — 75 from cape/gloves/shoes
- **Passive / Shield / Projectile** (amber) — class-specific extras

Total WATK label at right end of each bar.

Footer note: Shadow Partner not reflected in WATK. Projectiles/shield at max tier.

### Section 4: About the Scaling Chart

Header: **"About the Scaling Chart"**.

Explanatory text: "The scaling chart on the Dashboard shows how DPS changes as all build parameters scale from 10% to 100% of their max values. This reveals which classes benefit most from overall investment and where scaling curves diverge."

Two lists:

**Scales with %:**
- Base stats (from leveling/AP)
- Primary & secondary stat from gear
- C/G/S WATK
- Weapon clean WATK & scrolling bonus
- Attack potion
- Projectiles (stars, arrows, bolts, bullets)
- Shadower shield WATK

**Fixed (always 100%):**
- Passive WATK (Bow Expert, MM Boost)

Summary: "At 50%, a class has half the base stats, half the gear stats, half the weapon attack, and half the projectile WATK of a max build. This is a uniform power curve for comparing class scaling, not a model of any specific funding level."

## Data Changes

These weapon/projectile corrections apply to the data layer, not just the page:

| File | Change |
|------|--------|
| `data/gear-templates/sair.base.json` | Weapon: Concerto → Dragonfire Revolver. `godlyCleanWATK`: 84 → 88. `projectile`: 20 → 24 (Royal Bullet). |
| `data/gear-templates/marksman.base.json` | Weapon: Dark Neschere → Dragon Shiner Cross. `godlyCleanWATK`: 108 → 113. |
| `data/gear-budget.json` | `nonWeaponWATK`: 84 → 75 (25/25/25 C/G/S). |
| `data/gear-assumptions.md` | Update weapon table, C/G/S values, projectile references. |
| `data/references/gear-and-funding.md` | Update C/G/S table perfect tier to 25/25/25. |

### Scaling Function Changes

`scaleBudget` in `web/src/data/bundle.ts` currently only scales `gearPrimary`, `gearSecondary`, `nonWeaponWATK`, and `scrollBonus`. It must also scale `basePrimary`, `baseSecondary`, and `attackPotion`.

`computeBuildAtFunding` currently does not scale `godlyCleanWATK` or `projectile`. It must scale both by the fraction. It must also interpolate `shieldWATK` for Shadower (see below).

The corresponding Node-side `computeBuild` in `src/data/gear-compute.ts` is unaffected — it always builds at 100%.

### Projectile Scaling

The scaling chart should vary projectile WATK from 0 to max alongside other gear parameters. Classes affected:

| Class | Projectile | Range |
|-------|-----------|-------|
| Night Lord | Stars (Balanced Fury) | 0–30 |
| Bowmaster | Arrows | 0–12 |
| Marksman | Bolts | 0–10 |
| Corsair | Bullets (Royal Bullet) | 0–24 |

Currently projectile WATK is fixed in the `ClassBase.projectile` field. The scaling function `computeBuildAtFunding` needs to scale `projectile` by the fraction, similar to how it already scales `godlyCleanWATK`.

### Shadower Shield Scaling

Shield WATK scales from 10 (godly clean) to 33 (+23 scrolled). The scaling function needs to interpolate `shieldWATK` from 10 to 33 based on the fraction.

Current `shieldWATK: 43` in `shadower.base.json` needs updating to 33 (10 godly clean + 23 from scrolling). The 10 base and 23 scrolling values were provided by the project owner.

## Routing

| Before | After |
|--------|-------|
| `/build` → BuildExplorer | removed |
| `/compare` → BuildComparison | removed |
| `/gear` → (new) GearPage | added |

Nav order: Dashboard, Gear, Formulas, Party.

## Design

Data-driven from existing JSON files. The page reads `gear-budget.json` and all `*.base.json` templates at build time (same `import.meta.glob` pattern as the rest of the app). No new data files needed.

The WATK composition chart uses simple CSS stacked bars (not Recharts) — it's static data, no interactivity needed beyond hover tooltips showing segment values.

Styling matches existing app theme (`theme.ts` colors). Class names use `getClassColor()` for consistent color coding.

Mobile: tiles stack to single column, table scrolls horizontally, bars remain full width.
