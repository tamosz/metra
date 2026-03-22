# Gear Assumptions

This document captures the assumptions baked into simulation builds.
These drive all DPS comparisons — understanding them is essential for
interpreting results.

Cross-referenced against Royals forum guides:
- [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/)
- [Sire's Warrior Guide](https://royals.ms/forum/threads/sires-complete-mapleroyals-warrior-guide.8474/)
- [Dark Knight Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/)
- [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
- [Darko's Night Lord Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
- [Comprehensive Night Lord Guide](https://royals.ms/forum/threads/a-comprehensive-night-lord-guide.23303/)

---

## 1. Universal Assumptions

| Assumption | Value | Notes |
|------------|-------|-------|
| MW level | 20 | MW20 is the max level in Royals. |
| Sharp Eyes | Always active | SE from BM/MM mule or party member. |
| Speed Infusion | Always active | SI from Buccaneer. |
| Echo of Hero | Always active | Nearly universal buff (4% WATK). |
| Booster | Always active (implicit) | Hardcoded as -2 weapon speed in engine. |
| Potion (physical) | 140 WATK (Onyx Apple + AT potion) | Endgame bossing setup. |
| Potion (mage) | 220 MATK (Ssiws Cheese) | Mage-specific endgame potion. Community confirmed: "Mages use Ssiws Cheese or Subani's Mystic Cauldron (not stoppers/apples)" ([DPS charts thread](https://royals.ms/forum/threads/dps-charts.124709/)). |
| Base primary stat | 999 | Level 200 cap. |
| Base secondary stat | 23 | Natural from leveling (dexless/lukless builds). Exception: Night Lord DEX 25. |

**Implications:**
- Booster cannot be toggled off — unboosted scenarios are not modeled.
- All comparisons assume a full party with SE, SI, and MW20.

---

## 2. Gear Budget Model

All physical classes share a single gear budget (`data/gear-budget.json`). Non-weapon
gear stats (armor, accessories, scrolling) are identical across classes. Each class's
build is computed from:

- **Shared budget** — primary stat, secondary stat, non-weapon WATK, scroll bonus
- **Class base file** (`data/gear-templates/*.base.json`) — weapon type, godly clean WATK, weapon stat, shield WATK/stats, passive WATK, projectile

Total weapon attack = godly clean WATK + scroll bonus + non-weapon WATK + passive WATK + shield WATK.

This ensures cross-class DPS comparisons reflect skill and weapon differences, not
arbitrary gear assumptions. Classes that differ from the shared budget (shields, passive
WATK, projectiles) encode those differences in their base file.

Mages use separate templates (`*-perfect.json`) since they scale on INT/MATK instead of
STR/WATK.

---

## 3. Godly System

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
| Dragon Shiner Cross | Marksman | 108 | 113 | +35 | 148 |
| Dragonfire Revolver | Corsair | 83 | 88 | +35 | 123 |
| Dragon Slash Claw | Buccaneer | 83 | 88 | +35 | 123 |
| Dragon Kanzir | Shadower | 105 | 110 | +35 | 145 |
| Elemental Wand 5 | Mages | 150 | 155 | +35 | 190 MATK |

Builds use theoretical max weapon WATK (godly clean + 7x 30% scroll). This is achievable
in principle but extremely rare and expensive in practice — it represents the hard ceiling
of character power, not a typical endgame character.

---

## 4. Class-Specific Notes

### Warriors (Hero, Dark Knight, Paladin)

Hero is split into three weapon variants:
- **Hero** uses Dragon Claymore (speed 6, Normal). No DEX requirement — full STR build.
- **Hero (ST)** uses Stonetooth Sword (speed 5, Fast). Requires 120 DEX. With SI active, both resolve to effective speed 2 (0.63s Brandish) — identical buffed DPS.
- **Hero (Axe)** uses Dragon Battle Axe (speed 6, Normal). Higher WATK, lower multiplier than sword.

Dark Knight uses Sky Ski (speed 6, Normal).

Paladin (BW) uses Dragon Flame (speed 7, Slow). With SI+Booster, speed 7 resolves to
effective speed 3 (0.69s Blast) vs Sword's speed 2 (0.63s Blast). The speed disadvantage
is a significant BW DPS penalty. The community considers 2H BW "VASTLY underpowered" vs
2H Sword ([Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)).

### Archers (Bowmaster, Marksman)

Both share identical stat gear. The differences are weapon type (Bow vs Crossbow) and the
mastery passive: Bow Expert (+10 WATK) vs Marksman Boost (+15 WATK, buffed in Update
#65.1). Marksman gets +5 WATK over Bowmaster from the passive.

All bows and crossbows are speed 6. Hurricane has fixed 0.12s attack time regardless of
speed.

Snipe deals fixed 195,000 damage per hit regardless of stats or gear (`fixedDamage` field).

### Night Lord

All claws are speed 4 (Fast). Shadow Partner always active (1.5x multiplier).
Uses Balanced Fury throwing stars (30 WATK).

### Corsair

Gun speed 5. Uses Royal Bullet (24 WATK projectile).

### Buccaneer

Knuckle multiplier 4.8x.

### Shadower

Dagger + Shield. Shield WATK and stats are encoded in the class base file. Secondary stat is `["STR", "DEX"]`.

### Projectile WATK (Arrows / Bolts / Stars / Capsules)

MapleRoyals buffed arrow and bolt WATK in
[Update #73.3](https://royals.ms/forum/threads/update-73-3-05-08-2021.194629/). Soul Arrow
retains the arrow's attack bonus, so projectile WATK is effectively always active.

| Class | Projectile | WATK | Source |
|-------|-----------|:---:|-------|
| Bowmaster | Royal Bow Quiver | 12 | Von Leon craft |
| Marksman | Royal Crossbow Quiver | 10 | Von Leon craft |
| Night Lord | Balanced Fury | 30 | |
| Corsair | Royal Bullet | 24 | |

Sources:
[Update #73.3 Patch Notes](https://royals.ms/forum/threads/update-73-3-05-08-2021.194629/),
[Nany's Bowmaster Guide](https://royals.ms/forum/threads/new-source-nanys-bowmaster-guide-road-to-lord-sniper.121936/)

---

## 5. Research Findings

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
