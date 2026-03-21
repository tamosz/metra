# Gear and Funding

Endgame weapons, scrolling benchmarks, and the gear model behind simulation builds.

## Gear Model

Every physical class uses the same computed build pipeline:

1. **Shared budget** (`data/gear-budget.json`) — stat and WATK values that are identical
   across all physical classes (armor, accessories, scrolling, potions)
2. **Class base file** (`data/gear-templates/*.base.json`) — weapon type, weapon speed,
   godly clean WATK, weapon stat, and class-specific extras (shield, passive WATK, projectile)
3. `computeBuild()` in `src/data/gear-compute.ts` combines the two into a `CharacterBuild`

This produces one build per class at perfect-tier equivalent funding, with full party buffs
(MW20, SE, SI, Echo, Booster). Cross-class DPS comparisons reflect skill and weapon
differences, not arbitrary gear choices.

Mages use separate explicit templates (`*-perfect.json`) because they scale on INT/MATK
instead of STR/WATK. A follow-up is planned to compute mage builds the same way.

### gear-budget.json

| Field | Value | Meaning |
|-------|:-----:|---------|
| `gearPrimary` | 295 | Total primary stat from all non-weapon gear (armor, accessories, scrolls) |
| `gearSecondary` | 168 | Total secondary stat from all non-weapon gear |
| `nonWeaponWATK` | 84 | Total WATK from non-weapon sources (gloves, cape, shoe, earring, eye, face, belt, medal) |
| `scrollBonus` | 35 | WATK from weapon scrolling (7 slots x 5 WATK per 30% dark scroll) |
| `basePrimary` | 999 | Base primary stat (level 200 cap) |
| `baseSecondary` | 23 | Base secondary stat (dexless/lukless builds). Per-class overrides exist (e.g., Night Lord DEX 25) |
| `attackPotion` | 140 | Potion WATK (Onyx Apple 100 + AT potion 40). Mage templates use 220 MATK (Ssiws Cheese) instead |

### Class base files (*.base.json)

Each physical class has a base file encoding what makes it different from other classes:

| Field | Example | Meaning |
|-------|---------|---------|
| `className` | "Hero" | Display name |
| `category` | "physical" | Physical or mage (determines build pipeline) |
| `primaryStat` / `secondaryStat` | "STR" / "DEX" | Stat mapping for the damage formula |
| `weaponType` | "2H Sword" | Selects multiplier from `data/weapons.json` |
| `weaponSpeed` | 6 | Base weapon speed before booster/SI |
| `godlyCleanWATK` | 115 | Godly clean weapon WATK (MS max + 5) |
| `weaponStat` | 21 | Primary stat on weapon (added to gearPrimary) |
| `shieldWATK` | — | Shield WATK, if the class uses a shield (Shadower) |
| `shieldStats` | — | Shield stat bonuses (e.g., `{ "LUK": 8, "STR": 14 }`) |
| `passiveWATK` | — | WATK from passive skills (e.g., Bow Expert +10, Marksman Boost +15) |
| `projectile` | 0 | Projectile WATK (stars, arrows, capsules) |
| `baseSecondaryOverride` | — | Override budget's `baseSecondary` for this class (Night Lord: 25 DEX) |
| `shadowPartner` | — | 1.5x damage multiplier when true |
| `echoActive` | true | Echo of Hero (+4% WATK) |
| `mwLevel` | 20 | Maple Warrior level |
| `speedInfusion` | true | SI active (physical only) |
| `sharpEyes` | true | Sharp Eyes active |

**Total weapon attack** is computed as:
`godlyCleanWATK + scrollBonus + nonWeaponWATK + passiveWATK + shieldWATK`

## Godly System

MapleRoyals adds a "godly" mechanic: every stat on equipment can roll up to +5 over the
original MapleStory max clean value. This applies to WATK/MATK, STR, DEX, LUK, INT, and
all other equipment stats.

**Example:** Stonetooth Sword original MS max clean = 106, godly = 111.

**Theoretical max weapon WATK** = godly clean + 7 upgrade slots x 5 WATK (30% dark scroll)
= godly + 35.

| Weapon | Class | MS Max Clean | Godly (+5) | +35 scrolling | Theoretical Max |
|--------|-------|:---:|:---:|:---:|:---:|
| Dragon Claymore | Hero, Paladin | 110 | 115 | +35 | 150 |
| Stonetooth Sword | Hero (ST), Paladin | 106 | 111 | +35 | 146 |
| Dragon Battle Axe | Hero (Axe) | 112 | 117 | +35 | 152 |
| Sky Ski | Dark Knight | 99 | 104 | +35 | 139 |
| Dragon Flame | Paladin (BW) | 117 | 122 | +35 | 157 |
| Dragon Purple Claw | Night Lord | 55 | 60 | +35 | 95 |
| Dragon Shiner Bow | Bowmaster | 105 | 110 | +35 | 145 |
| Dark Neschere | Marksman | 103 | 108 | +35 | 143 |
| Concerto | Corsair | 79 | 84 | +35 | 119 |
| Dragon Slash Claw | Buccaneer | 83 | 88 | +35 | 123 |
| Dragon Kanzir | Shadower | 105 | 110 | +35 | 145 |
| Elemental Wand 5 | Mages | 150 | 155 | +35 | 190 MATK |

Builds use theoretical max weapon WATK (godly clean + 7x 30% scroll). This represents the
hard ceiling of character power, not a typical endgame character.

## Endgame Weapons

**Source:** [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/)
**Source:** [DK Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/)
**Source:** [Darko's Night Lord Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/*.base.json`

| Class | Weapon | Godly Clean WATK | Speed |
|-------|--------|:---:|:---:|
| Hero | Dragon Claymore | 115 | 6 |
| Hero (ST) | Stonetooth Sword | 111 | 5 |
| Hero (Axe) | Dragon Battle Axe | 117 | 6 |
| Dark Knight | Sky Ski | 104 | 6 |
| Paladin (Sword) | Dragon Claymore | 115 | 6 |
| Paladin (BW) | Dragon Flame (2H BW) | 122 | 7 |
| Night Lord | Dragon Purple Claw | 60 | 4 |
| Bowmaster | Dragon Shiner Bow | 110 | 6 |
| Marksman | Dark Neschere | 108 | 6 |
| Corsair | Concerto | 84 | 5 |
| Buccaneer | Dragon Slash Claw | 88 | 6 |
| Shadower | Dragon Kanzir | 110 | 4 |

### 2H BW Weapon — Dragon Flame

**Source:** [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
**Source:** [Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/)
**Source:** [Sword vs BW Essay](https://royals.ms/forum/threads/sword-vs-bw-an-essay-on-the-futility-of-dps.159790/)
**Source:** [117 Dragon Flame listing](https://royals.ms/forum/threads/s-130-18luk-dragon-kanzir-117-perfect-dragom-flame.236826/)
**Accessed:** 2026-03-02
**Used in:** `data/gear-templates/paladin-bw.base.json`

Dragon Flame (lv110 HT drop) is the only viable endgame 2H BW:
- Clean WATK: ~107 avg, ~117 perfect
- Speed 7 (Slow) — one tier slower than 2H Sword (Normal 6)
- Same scroll values as 2H Sword (+5 WATK per 30% scroll)
- +6 clean WATK over Stonetooth Sword (~101 avg, ~111 perfect)
- Perfect 117 Dragon Flame sells for ~1.2b (cheap vs Stonetooth at similar scroll level)

Other 2H BWs considered and rejected:
- The Morningstar (lv80): speed 6 but only ~92-101 clean WATK — too low for endgame
- Golden Smith Hammer (lv100): speed 7, ~102-112 clean — inferior to Dragon Flame
- Maple Pyrope Maul (lv77): event weapon, ~91 clean — too low

### Warrior Weapon Pricing

**Source:** [Help with Choosing Swords](https://royals.ms/forum/threads/help-with-choosing-swords.124072/)
**Source:** [Stonetooth Price Check](https://royals.ms/forum/threads/p-c-on-various-stonetooth-swords.205623/)
**Source:** [Dragon Claymore 125 listing](https://royals.ms/forum/threads/s-125-dragon-claymore-and-127-dark-neschere.228554/)
**Accessed:** 2026-02-01

- Budget entry: 128 WATK Stonetooth for ~2b
- Mid-range: 130-140 WATK
- Endgame: 145-150 WATK (very expensive)
- Dragon Claymore: theoretically higher WATK but speed 6, extremely rare

## Projectile WATK

**Source:** [Darko's Night Lord Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
**Source:** [Update #73.3 Patch Notes](https://royals.ms/forum/threads/update-73-3-05-08-2021.194629/)
**Source:** [Nany's Bowmaster Guide](https://royals.ms/forum/threads/new-source-nanys-bowmaster-guide-road-to-lord-sniper.121936/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/*.base.json`

MapleRoyals buffed arrow and bolt WATK in
[Update #73.3](https://royals.ms/forum/threads/update-73-3-05-08-2021.194629/). Soul Arrow
retains the arrow's attack bonus, so projectile WATK is effectively always active.

| Class | Projectile | WATK |
|-------|-----------|:---:|
| Bowmaster | Royal Bow Quiver | 12 |
| Marksman | Royal Crossbow Quiver | 10 |
| Night Lord | Balanced Fury | 30 |
| Corsair | Blaze Capsule | 20 |

## Research Findings

### Resolved: Stonetooth speed (Q3, February 2026)

Stonetooth Sword is the standard endgame Hero weapon. Dragon Claymore is theoretically
stronger (higher WATK) but extremely rare and only advantageous with SI.

Sources: [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/),
[Why is Stonetooth the endgame weapon?](https://royals.ms/forum/threads/for-heros-why-is-stonetooth-the-end-game-weapon.116341/),
[Claymore vs Stonetooth](https://royals.ms/forum/threads/claymore-vs-stonetooth.58556/)

### Resolved: Axe/BW weapon multipliers (Q4, February 2026)

The values 4.4 (1H) and 4.8 (2H) for Axe/BW swing multipliers ARE the standard GMS v62
values. Multiple authoritative sources confirm: StrategyWiki, Ayumilove, Royals Wiki, and
the Royals damage range calculator thread.

Sources: [Axe/BW Balancing Thread](https://royals.ms/forum/threads/the-balancing-of-axes-blunt-weapons-data-included.53212/),
[Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/)

### Resolved: Weapon multipliers slash/stab (Q5, February 2026)

Spear (3.0 slash / 5.0 stab) and Polearm (5.0 slash / 3.0 stab) use different multipliers
based on attack type. Crusher stabs (Spear 5.0).
