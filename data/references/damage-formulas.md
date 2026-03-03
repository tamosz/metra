# Damage Formulas

Verified damage formulas used in the simulation engine. Cross-referenced against the
source spreadsheet and royals.ms forum threads.

## Standard Physical Formula (Warriors, Archers, Corsair, Buccaneer, Shadower)

**Source:** [Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/)
**Accessed:** 2026-02-01
**Used in:** `src/engine/damage.ts`, `data/weapons.json`

```
MaxDamage = floor((primaryStat * weaponMultiplier + secondaryStat) * totalAttack / 100)
MinDamage = floor((primaryStat * weaponMultiplier * 0.9 * mastery + secondaryStat) * totalAttack / 100)
```

Derived from range calculator cells E18/E19. `secondaryStat` can be an array (Shadower
uses `["STR", "DEX"]` — both values are summed).

## Throwing Star Formula (Night Lord)

**Source:** [Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/)
**Accessed:** 2026-02-01
**Used in:** `src/engine/damage.ts`

```
MaxDamage = floor(5.0 * LUK * totalAttack / 100)
MinDamage = floor(2.5 * LUK * totalAttack / 100)
```

From range calculator F18/F19. No weapon multiplier or secondary stat — flat LUK scaling.

## Magic Damage Formula (Archmage, Bishop)

**Source:** Source spreadsheet range calculator B5/B6
**Accessed:** 2026-02-25
**Used in:** `src/engine/damage.ts`

```
TMA = INT + MATK + potion + mageEcho
mageEcho = floor((INT + MATK + potion) * 0.04)
MaxDamage = floor(((TMA^2 / 1000 + TMA) / 30 + INT / 200) * spellAmp * weaponAmp)
```

Key differences from physical:
- Echo for mages includes INT in the base (physical echo is WATK-only)
- `spellAmplification` (Elemental Amplification passive): 1.4 for Archmage I/L and F/P, 1.0 for Bishop
- `weaponAmplification` (Elemental Staff): 1.25 for Archmage I/L and F/P, 1.0 for Bishop
- Magic skills use raw multipliers (not divided by 100)
- Min damage uses mastery 0.6 (hardcoded in spreadsheet): `MinDmg = floor(((TMA²/1000 + TMA*0.6*0.9)/30 + INT/200) * spellAmp * weaponAmp)`

## Weapon Multipliers

**Source:** [Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/)
**Source:** [Royals hasn't changed axes](https://royals.ms/forum/threads/did-mapleroyals-balance-the-damage-between-axe-blunt-weapon-and-sword%EF%BC%9F.125863/)
**Accessed:** 2026-02-01
**Used in:** `data/weapons.json`

| Weapon | Slash | Stab | Notes |
|--------|-------|------|-------|
| 1H Sword | 4.0 | 4.0 | |
| 2H Sword | 4.6 | 4.6 | Hero, Paladin |
| 1H Axe | 4.4 | 3.2 | |
| 2H Axe | 4.8 | 3.4 | Hero (Axe) |
| 1H BW | 4.4 | 3.2 | |
| 2H BW | 4.8 | 3.4 | Paladin BW variant |
| Spear | 3.0 | 5.0 | DrK uses stab (Crusher) |
| Polearm | 5.0 | 3.0 | |
| Bow | 3.4 | 3.4 | Bowmaster |
| Crossbow | 3.6 | 3.6 | Marksman |
| Gun | 3.6 | 3.6 | Corsair |
| Knuckle | 4.8 | 4.8 | Buccaneer |
| Dagger | 3.6 | 3.6 | Shadower |

Axe/BW multipliers (1H 4.4, 2H 4.8) are standard GMS v62 — Royals has not modified
them. Confirmed by StrategyWiki, Ayumilove, and community member Zerato.

### BW Swing/Stab Ratio

**Source:** [Paladin Blast Damage](https://royals.ms/forum/threads/paladin-blast-damage.205523/)
**Accessed:** 2026-02-01
**Used in:** `data/skills/paladin.json`

BW Blast uses a 3:2 swing/stab ratio → effective multiplier = 0.6 * 4.8 + 0.4 * 3.4 = 4.24.
Modeled via `attackRatio` on SkillEntry.

### Brandish Slash/Stab Ratio

**Source:** [Hero's Damage Stability](https://royals.ms/forum/threads/heros-damage-stability.200652/), [Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/), [MapleMaths](https://royals.ms/forum/threads/maplemaths-calculating-x-stats-y-w-atk.210953/)
**Accessed:** 2026-03-02
**Used in:** `data/skills/hero-axe.json`

Brandish does 1 slash + 1 stab per attack. For swords (slash=stab=4.6) this has no effect. For axes, the effective multiplier is 0.5 * 4.8 + 0.5 * 3.4 = 4.1, making axes ~10.9% weaker than swords at equal WATK. In practice the gap is ~2-3% because endgame axes have slightly higher base WATK.
Modeled via `attackRatio: { slash: 0.5, stab: 0.5 }` on SkillEntry.

## Crit Damage Formulas

**Source:** Source spreadsheet dmg sheet G columns
**Accessed:** 2026-02-01
**Used in:** `src/engine/dps.ts`

All physical classes use the same SE crit calculation:

**`addBeforeMultiply`** (all physical classes including Paladin):
```
critDmg% = (basePower + totalCritBonus) * multiplier
```

`totalCritBonus` = built-in crit bonus + SE bonus (+140 if active).
Crit rate = built-in rate + SE rate (0.15), capped at 1.0.

Built-in crit rates:
- NL Triple Throw: 50% rate, +100 damage bonus
- Bowmaster/Marksman (Critical Shot): 40% rate, +100 damage bonus
- All others: 0% (SE-only)

### Assassinate fixed crit damage (SE penalty)

**Source:** [Assassinate and criticals](https://royals.ms/forum/threads/assassinate-and-criticals.143423/)
**Source:** [How to maximize Shadower's single target DPS](https://royals.ms/forum/threads/how-to-maximize-shadowers-single-target-dps.236808/)
**Source:** [Assassinate and Sharp Eye](https://royals.ms/forum/threads/assassinate-and-sharp-eye.180132/)
**Source:** [Ayumilove Shadower Skills](https://ayumilovemaple.wordpress.com/2008/09/19/maplestory-shadower-skills/) (v62 skill data: level 30 Critical Damage 250%)
**Accessed:** 2026-03-03
**Used in:** `data/skills/shadower.json`, `src/engine/dps.ts`

Assassinate has a `fixedCritDamagePercent` of 250 from v62 skill data. When SE triggers a
crit on Assassinate, the game uses this fixed 250% damage instead of the normal SE formula
`(950 + 140) * 1 = 1090%`. Since 250 < 950, **SE crits deal less damage than non-crits**,
causing Assassinate DPS to decrease with SE active.

Community testing confirmed: "SE was 95.6% speed of no SE" for Assassinate. At high gear
levels (~22k buffed range), SE's benefit to Boomerang Step compensates for Assassinate
losses, returning the combo to roughly baseline.

The v62 Assassinate originally had Attack 120%, Critical Damage 250%, Success Rate 90%.
When Royals buffed basePower to 950% (charge removed), the criticalDamage value was not
updated. The first 3 hits of Assassinate cannot crit in vanilla v62; in Royals' 3-hit
rework, SE can trigger on the hits but uses the old 250% crit damage.

Modeled via `fixedCritDamagePercent` on SkillEntry: when present, overrides the SE crit
formula entirely. Crit rate still comes from SE (0.15 when active).

### Resolved: Paladin crit formula corrected to addBeforeMultiply

**Identified:** 2026-03-03
**Resolved:** 2026-03-03

The spreadsheet used `addAfterMultiply` for Paladin (G28: `=D28*1.4+140`), but this was
a bug in the spreadsheet. The charge multiplier should amplify the SE crit bonus just like
every other class's multiplier. Community feedback confirmed the correct formula is
`(basePower + totalCritBonus) * multiplier`, i.e. `(580 + 140) * 1.4 = 1008`.

Paladin now uses `addBeforeMultiply` like all other physical classes.

## Damage Cap

**Source:** Source spreadsheet, standard v62 mechanic
**Used in:** `src/engine/damage.ts`, `src/engine/dps.ts`

Damage cap is 199,999 per line. When max damage exceeds the cap, the adjusted average
range accounts for the truncated distribution (see `calculateAdjustedRange` in damage.ts).

The DPS pipeline computes range caps for both normal and crit hits:
```
rangeCap      = 199999 / (skillDamagePercent / 100)
rangeCapCrit  = 199999 / (critDamagePercent / 100)
```

If either cap falls below the max damage range, `calculateAdjustedRange` models the
uniform distribution with a hard ceiling — hits that would exceed the cap are pinned to it.

### Known limitation: element modifiers bypass damage cap

**Identified:** 2026-03-03
**Affects:** `src/proposals/simulate.ts` (applyElementModifier), web element toggles

Element modifiers (e.g., 1.5× Holy weakness) are applied as a post-calculation multiplier
on the final DPS value. This skips the damage cap interaction — the engine doesn't
recalculate adjusted ranges with the elemental damage% factored in.

In reality, elemental advantage increases the effective skill damage%, which lowers the
range cap and causes more hits to be capped. The current approach overestimates DPS
when elemental advantage pushes per-hit damage past the 199,999 cap.

**Example — Paladin Blast (Holy, Sword) at High tier vs Holy-weak boss:**

Without element modifier (base calculation, cap-aware):
```
skillDmg% = 812, max hit = 18,831 × 8.12 = 152,908  → under cap, no capping
DPS = 192,932
```

With 1.5× element modifier (naive post-calc, current behavior):
```
DPS = 192,932 × 1.5 = 289,398
```

With 1.5× element modifier (proper cap-aware calculation):
```
skillDmg% = 1218, max hit = 18,831 × 12.18 = 229,362  → OVER cap
rangeCap = 199,999 / 12.18 = 16,420
adjustedRange (normal) = 14,247  (vs uncapped 14,592)
adjustedRange (crit)   = 13,218  (vs uncapped 14,592)
DPS ≈ 279,093
```

**Overestimate: ~3.6%** (289,398 vs 279,093)

This only matters when:
1. The class has high base damage (High tier, high multiplier)
2. An element modifier pushes effective skill% high enough to hit the cap
3. The skill is single-hit (multi-hit skills spread damage across lines)

Most affected: Paladin Blast with Holy advantage at High tier. Less affected at Mid/Low
tiers (lower stats → lower base range → cap not reached). Multi-hit skills like Brandish,
Triple Throw, and Strafe are unlikely to hit the cap per line.

To fix this properly, the element modifier would need to be folded into the skill damage%
before the adjusted range calculation in `calculateAverageDamage`, rather than applied
as a post-multiplier in simulate.ts.
