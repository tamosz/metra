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
**Source:** [MapleRoyals hasn't changed axes](https://royals.ms/forum/threads/did-mapleroyals-balance-the-damage-between-axe-blunt-weapon-and-sword%EF%BC%9F.125863/)
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

Axe/BW multipliers (1H 4.4, 2H 4.8) are standard GMS v62 — MapleRoyals has not modified
them. Confirmed by StrategyWiki, Ayumilove, and community member Zerato.

### BW Swing/Stab Ratio

**Source:** [Paladin Blast Damage](https://royals.ms/forum/threads/paladin-blast-damage.205523/)
**Accessed:** 2026-02-01
**Used in:** `data/skills/paladin.json`

BW Blast uses a 3:2 swing/stab ratio → effective multiplier = 0.6 * 4.8 + 0.4 * 3.4 = 4.24.
Modeled via `attackRatio` on SkillEntry.

## Crit Damage Formulas

**Source:** Source spreadsheet dmg sheet G columns
**Accessed:** 2026-02-01
**Used in:** `src/engine/dps.ts`

Two SE crit calculation variants exist:

**`addBeforeMultiply`** (Hero, DrK, NL, Bowmaster, Marksman, Shadower, Corsair, Buccaneer):
```
critDmg% = (basePower + totalCritBonus) * multiplier
```

**`addAfterMultiply`** (Paladin):
```
critDmg% = basePower * multiplier + totalCritBonus
```

`totalCritBonus` = built-in crit bonus + SE bonus (+140 if active).
Crit rate = built-in rate + SE rate (0.15), capped at 1.0.

Built-in crit rates:
- NL Triple Throw: 50% rate, +100 damage bonus
- Bowmaster/Marksman (Critical Shot): 40% rate, +100 damage bonus
- All others: 0% (SE-only)

## Damage Cap

**Source:** Source spreadsheet, standard v62 mechanic
**Used in:** `src/engine/damage.ts`

Damage cap is 199,999 per line. When max damage exceeds the cap, the adjusted average
range accounts for the truncated distribution.
