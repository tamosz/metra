# Gear Template Assumptions

This document captures the implicit assumptions baked into each gear template.
These drive all DPS comparisons in simulation reports — understanding them is
essential for interpreting results.

Cross-referenced against Royals forum guides:
- [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/)
- [Sire's Warrior Guide](https://royals.ms/forum/threads/sires-complete-mapleroyals-warrior-guide.8474/)
- [Dark Knight Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/)
- [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
- [Darko's NL Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
- [Comprehensive NL Guide](https://royals.ms/forum/threads/a-comprehensive-night-lord-guide.23303/)

---

## 1. Universal Assumptions (all templates)

| Assumption | Value | Notes |
|------------|-------|-------|
| MW level | 20 | MW20 is the max level in Royals. |
| Sharp Eyes | Always active | SE from BM/MM mule or party member. Guides call it "the most important buff." |
| Speed Infusion | Always active | SI from Buccaneer. |
| Echo of Hero | Always active | Nearly universal buff (4% WATK). Both tiers assume it. |
| Booster | Always active (implicit) | No field in CharacterBuild; hardcoded as -2 weapon speed in engine. |
| Tiers | Low, Mid, High | Budget → mid-funded → endgame. |
| Low potion | 60 WATK (Heartstopper) | 1 min duration. Standard for bossing comparisons. |
| Mid potion | 60 WATK (Heartstopper) | Same as low — mid-tier players don't regularly Apple. |
| High potion | 100 WATK (Onyx Apple) | 10 min. Standard endgame bossing potion. |
| Mid mage potion | 45 MATK (Lollipop) | Same as low — Stopper gives 0 MATK for mages. |

**Implications:**
- Booster cannot be toggled off — unboosted scenarios are not modeled.
- All comparisons assume a full party with SE, SI, and MW20.

---

## 2. Warrior Assumptions (Hero, DrK, Paladin)

### Base Stats

| Stat | High | Mid | Low | Notes |
|------|------|-----|-----|-------|
| STR | 999 | 850 | 700 | High = lv200 cap. Mid = ~lv185. Low = ~lv160-170. |
| DEX | 23 | 22 | 22 | Natural DEX from leveling (dexless build). |

### Weapon Speed

Hero high uses weapon speed 5 (Fast), matching Stonetooth Sword — the standard endgame
Hero weapon per community consensus. With SI active, speed 5 and speed 6 both resolve to
effective speed 2 (0.63s Brandish), so buffed DPS is identical. Without SI, Stonetooth at
speed 5 yields 0.69s vs 0.75s for speed 6 — an 8.7% DPS advantage in unbuffed scenarios.

DrK/Paladin templates use weapon speed 6 (Normal), correct for Sky Ski and 2H BW/Sword.

### Gear — Hero & Paladin share identical gear

The source spreadsheet treats Hero and Paladin identically for gear. This is reasonable —
same class archetype, same equipment slots. DrK uses the same stat gear but a different
weapon.

### High Tier WATK Breakdown

| Slot | Hero/Paladin | DrK | Forum "endgame" range | Assessment |
|------|-------------|-----|----------------------|------------|
| Weapon | 150 | 139 | ST Sword ~145-150; Sky Ski ~120+ | Hero near-perfect. DrK reasonable. |
| Gloves | 19 | 19 | 15-16+ late-game, 21 godly | Top-1%. Standardized across all classes. |
| Cape | 17 | 17 | 10+ late-game, 18-20 godly | Top-1%. Standardized across all classes. |
| Shoes | 13 | 13 | 7+ late-game, 17 is high | Top-1%. Standardized across all classes. |
| Medal | 3 | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 1 | 0-1 | Reasonable. |
| **Total** | **203** | **192** | | |

High tier models a top-1% character. Cape/Glove/Shoe standardized to 19/17/13 across
all classes (warriors, thieves, archers, pirates) for consistent cross-class comparison.

### Low Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon | 130 | Budget ~120-130 | Mid-range per Paladin guide. Genuine budget. |
| Gloves | 15 | 10-15 mid-game | Reasonable. |
| Cape | 12 | 6-10 budget | Slightly high but plausible. |
| Shoes | 10 | 6-7 budget | Slightly high. |
| Medal | 0 | 0-1 | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| **Total** | **168** | | |

### Mid Tier WATK Breakdown

| Slot | Hero/Paladin | DrK | Notes |
|------|-------------|-----|-------|
| Weapon | 140 | 133 | Mid-range scrolled. Hero/Pal share gear. |
| Gloves | 17 | 17 | Standardized mid-tier C/G/S. |
| Cape | 14 | 14 | Standardized mid-tier C/G/S. |
| Shoes | 10 | 10 | Same as low — shoes are hardest to scroll. |
| Medal | 2 | 2 | Between low (0) and high (3). |
| Ring | 1 | 1 | Same across all tiers. |
| **Total** | **184** | **177** | |

Mid tier C/G/S standardized to Glove 17 / Cape 14 / Shoe 10 (total 41 WATK) across all
physical classes. Between low (~37) and high (49).

### Pendant Stats

Low tier uses STR 10 / DEX 10 pendant (basic HTP or Deputy Star). Mid tier uses ~16/16
(partially scrolled HTP). High tier uses STR 22 / DEX 23 (near-perfect HTP).

---

## 3. Archer Assumptions (Bowmaster, Marksman)

### Shared Gear

Bowmaster and Marksman share identical gear templates — same stats, same WATK values,
same scrolling tier. The only difference is weapon type (Bow vs Crossbow) and the
corresponding mastery passive (Bow Expert vs Crossbow Expert, both +10 WATK).

### Weapon Multiplier

| Weapon | Multiplier | Source |
|--------|-----------|--------|
| Bow | 3.4 | range calculator E18 |
| Crossbow | 3.6 | range calculator E18: I31*3.6 |

### Base Stats

| Stat | High | Mid | Low | Notes |
|------|------|-----|-----|-------|
| DEX | 999 | 850 | 700 | Same pattern as warriors. |
| STR | 4 | 4 | 4 | Dexless build. |

### Weapon Speed

All bows and crossbows are speed 6 (Normal). With SI + Booster, resolves to effective
speed 2 for Strafe. Hurricane has fixed 0.12s attack time regardless of speed.

### High Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (Nisrock) | 130 | 130 ATK valued at ~3.8b | Well-scrolled (~100 base + 6x 30% scrolls). |
| Bow/Crossbow Expert | 10 | Always +10 | Passive skill, baked into template (range calculator L31). |
| Gloves | 19 | 15-16+ late-game | Top-1%. Standardized across all classes. |
| Cape | 17 | 10+ late-game | Top-1%. Standardized across all classes. |
| Shoes | 13 | 7+ late-game | Top-1%. Standardized across all classes. |
| Medal | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| **Total WATK** | **193** | | |

### Low Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (Nisrock) | 105 | ~95-110 budget | Budget Nisrock (~95 base + a few 60% scrolls). |
| Bow/Crossbow Expert | 10 | Always +10 | Passive skill. |
| Gloves | 12 | 10-12 mid-game | Reasonable. |
| Cape | 5 | 5-8 budget | Budget WATK cape. |
| Shoes | 0 | 0-6 | No WATK shoes at low tier. |
| Medal | 0 | 0-1 | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| **Total WATK** | **133** | | |

### Mid Tier WATK Breakdown

| Slot | Value | Notes |
|------|-------|-------|
| Weapon (Nisrock) | 120 | Mid-range scrolled. |
| Bow/Crossbow Expert | 10 | Passive skill. |
| Gloves | 17 | Standardized mid-tier C/G/S. |
| Cape | 14 | Standardized mid-tier C/G/S. |
| Shoes | 10 | Standardized mid-tier C/G/S. |
| Medal | 2 | Between low (0) and high (3). |
| Ring | 1 | Same across all tiers. |
| **Total WATK** | **174** | |

### Marksman-Specific: Snipe

Snipe deals fixed 195,000 damage per hit regardless of stats or gear. It uses the
`fixedDamage` field on SkillEntry, bypassing the normal damage formula entirely.
Modeled without cooldown (sustained DPS ceiling). At 0.6s attack time, Snipe DPS =
325,000 at both funding tiers.

---

## 4. Night Lord Assumptions

### Base Stats

| Stat | High | Mid | Low | Notes |
|------|------|-----|-----|-------|
| LUK | 999 | 850 | 700 | Same pattern as warriors. |
| DEX | 25 | 25 | 25 | Standard NL build. |

### Weapon Speed

All claws are speed 4 (Fast). Confirmed.

### Shadow Partner

Always active. Reasonable — NL always uses SP for DPS (1.5x multiplier).

### High Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (RC) | 91 | 77 clean + 14 scrolling = 91 perf | Perfect Raven's Claw. Confirmed. |
| Gloves | 19 | 21 ATT SCG endgame | Top-1%. Standardized across all classes. |
| Cape | 17 | 10+ Blackfist endgame | Top-1%. Standardized across all classes. |
| Shoes | 13 | 17 ATT Facestompers endgame | Top-1%. Standardized across all classes. |
| Medal | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| Stars | 30 (Balanced Fury) | 29 Crystal Ilbi / 30 BFury | Confirmed. BFury is correct endgame. |
| **Total WATK** | **144** | | |

### Low Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (RC) | 76 | 71-76 mid-range RC | Reasonable — top of budget range. |
| Gloves | 12 | 10-12 mid-game | Confirmed. |
| Cape | 8 | 6-8 early cape | Confirmed. |
| Shoes | 6 | 6+ mid-game FS | Confirmed. |
| Medal | 2 | 1-2 | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| Stars | 27 (Hwabi) | Hwabi standard mid/late | Confirmed. |
| **Total WATK** | **105** | | |

NL high tier C/G/S standardized from 21/18/17 to 19/17/13, aligning with all other
classes. Low tier unchanged.

---

## 5. Research Findings (February 2026)

### Resolved: Stonetooth speed (Q3)

**Finding:** Stonetooth Sword is the standard endgame Hero weapon. Dragon Claymore is
theoretically stronger (higher WATK) but extremely rare and only advantageous with SI.

**Action taken:** Hero high `weaponSpeed` changed from 6 → 5. With SI active (default
scenario), both resolve to effective speed 2 — zero DPS change. Unbuffed scenarios now
correctly model Stonetooth's faster speed (0.69s vs 0.75s Brandish).

Sources: [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/),
[Why is Stonetooth the endgame weapon?](https://royals.ms/forum/threads/for-heros-why-is-stonetooth-the-end-game-weapon.116341/),
[Claymore vs Stonetooth](https://royals.ms/forum/threads/claymore-vs-stonetooth.58556/),
[Questions regarding Warriors](https://royals.ms/forum/threads/questions-regarding-warriors-specifically-hero.161467/)

### Resolved: Axe/BW weapon multipliers (Q4)

**Finding:** The values 4.4 (1H) and 4.8 (2H) for Axe/BW swing multipliers ARE the
standard GMS v62 values. The previously cited "GMS v62 values" of 4.0/4.2 were incorrect —
4.0 is the 1H **Sword** multiplier, not 1H Axe. Multiple authoritative sources confirm:
StrategyWiki, Ayumilove formula compilation, Royals Wiki damage formula page, and the
Royals damage range calculator thread. Royals has not modified these values
([confirmed by community member Zerato](https://royals.ms/forum/threads/did-mapleroyals-balance-the-damage-between-axe-blunt-weapon-and-sword%EF%BC%9F.125863/)).

**Action taken:** Removed incorrect warning from `weapons.json`. No value changes needed.

Sources: [Axe/BW Balancing Thread](https://royals.ms/forum/threads/the-balancing-of-axes-blunt-weapons-data-included.53212/),
[Royals hasn't changed axes](https://royals.ms/forum/threads/did-mapleroyals-balance-the-damage-between-axe-blunt-weapon-and-sword%EF%BC%9F.125863/),
[Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/),
[Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/)

### Resolved: Weapon multipliers slash/stab (Q5)

Spear (3.0 slash / 5.0 stab) and Polearm (5.0 slash / 3.0 stab) use different multipliers
based on attack type. Crusher stabs (Spear 5.0). Fury (Polearm) is not modeled — it's a
mobbing skill with no sourced attack speed data.

### Resolved: Archer weapon WATK calibrated by tier (Q6, March 2026)

**Finding:** BM/MM weapon WATK was flat 120 across all three funding tiers. Every other
class had proper tiered weapon values (e.g., Hero 130→140→150, DrK 127→133→139). The
source spreadsheet has no archer gear template data — templates were adapted from warrior
templates with a single estimated WATK that was never differentiated.

**Decision:** Calibrated bow/crossbow weapon WATK using Royals forum marketplace data:
- Low: 120 → 105 (budget Nisrock, ~95 base + a few 60% scrolls)
- Mid: 120 → 120 (unchanged, already appropriate)
- High: 120 → 130 (well-scrolled Nisrock, ~100 base + 6x 30% scrolls, valued at ~3.8b)

BM Hurricane High moved from 225k (#9) to 233k (#8). Low tier decreased from 113k to 105k,
giving realistic tier spread matching other classes.

Sources: Royals forum marketplace listings, Nisrock price/check threads, buy threads.

---

## 6. Resolved Design Decisions

### Resolved: C/G/S standardized to 19/17/13 (Q1, February 2026)

**Finding:** Original templates had inconsistent C/G/S WATK across classes (warriors at
20/20/20, NL at 21/18/17, Corsair at 20/20/18, etc.). 20/20/20 was extreme godly
(top ~0.01%), with 20 ATT shoes not even found on the marketplace.

**Decision:** Standardize all classes to Glove 19 / Cape 17 / Shoe 13 (total 49 WATK).
This models a top-1% character — achievable endgame gear without being theoretical maximum.
Consistent C/G/S across classes ensures cross-class DPS comparisons reflect skill/weapon
differences, not arbitrary gear assumptions.

Sources: [Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/),
[Endgame Progression Thread](https://royals.ms/forum/threads/best-%E2%80%9Cdecent%E2%80%9D-gear-progressing-into-end-game.229612/),
[20 ATT PGC listing](https://royals.ms/forum/threads/s-20-att-cape-pgc-6173-clean-ep.230089/),
[20 WA SCG listing](https://royals.ms/forum/threads/s-scg-20-wa-c-o-18b.237392/)

### Resolved: Warrior low weapon reduced to 130 WATK (Q2, February 2026)

**Finding:** 140 WATK was solidly mid-funded (8-15b est.), not budget. The Paladin guide
lists 130 WATK 2H sword as "mid-range." Community recommends "a 128 ST for 2b" as
budget entry point.

**Decision:** Reduce Hero and Paladin low-tier weapon from 140 → 130 WATK. DrK low
already at 127 — no change needed. 130 represents a genuine budget-to-mid funded character.

Sources: [Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/),
[Help with Choosing Swords](https://royals.ms/forum/threads/help-with-choosing-swords.124072/),
[DK Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/),
[Dragon Claymore 125 listing](https://royals.ms/forum/threads/s-125-dragon-claymore-and-127-dark-neschere.228554/),
[Stonetooth Price Check](https://royals.ms/forum/threads/p-c-on-various-stonetooth-swords.205623/)
