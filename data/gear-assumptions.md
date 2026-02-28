# Gear Template Assumptions

This document captures the implicit assumptions baked into each gear template.
These drive all DPS comparisons in simulation reports — understanding them is
essential for interpreting results.

Cross-referenced against MapleRoyals forum guides:
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
| MW level | 20 | MW20 is the max level in MapleRoyals. |
| Sharp Eyes | Always active | SE from BM/MM mule or party member. Guides call it "the most important buff." |
| Speed Infusion | Always active | SI from Buccaneer. |
| Echo of Hero | Always active | Nearly universal buff (4% WATK). Both tiers assume it. |
| Booster | Always active (implicit) | No field in CharacterBuild; hardcoded as -2 weapon speed in engine. |
| Tiers | Only "low" and "high" | No mid tier. |
| Low potion | 60 WATK (Heartstopper) | 1 min duration. Standard for bossing comparisons. |
| High potion | 100 WATK (Onyx Apple) | 10 min. Standard endgame bossing potion. |

**Implications:**
- Booster cannot be toggled off — unboosted scenarios are not modeled.
- All comparisons assume a full party with SE, SI, and MW20.

---

## 2. Warrior Assumptions (Hero, DrK, Paladin)

### Base Stats

| Stat | High | Low | Notes |
|------|------|-----|-------|
| STR | 999 | 700 | High = effective cap at lv200. Low = mid-progression (~lv160-170). |
| DEX | 23 | 22 | Natural DEX from leveling (dexless build). Confirmed by DrK guide. |

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
| Gloves | 20 | 20 | 15-16+ late-game, 21 godly | Very high (near-godly). |
| Cape | 20 | 20 | 10+ late-game, 18-20 godly | Very high. Guides say "billions" for high WATK capes. |
| Shoes | 20 | 20 | 7+ late-game, 17 is high | Very high. Facestompers at 20 WATK is near-max. |
| Medal | 3 | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 1 | 0-1 | Reasonable. |
| **Total** | **214** | **203** | | |

High tier models a top-0.1% character. Cape/Glove/Shoe all at 20 WATK is near-godly
across the board.

### Low Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon | 140 | Budget ~120-130 | Still well-scrolled for "low" tier. Closer to mid-funded. |
| Gloves | 15 | 10-15 mid-game | Reasonable. |
| Cape | 12 | 6-10 budget | Slightly high but plausible. |
| Shoes | 10 | 6-7 budget | Slightly high. |
| Medal | 0 | 0-1 | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| **Total** | **178** | | |

### Pendant Stats

High and low tiers both use STR 10 / DEX 10 pendant. Low tier represents a basic HT
Necklace or Deputy Star level. High tier uses STR 22 / DEX 23, representing a near-perfect
Horntail Pendant.

---

## 3. Night Lord Assumptions

### Base Stats

| Stat | High | Low | Notes |
|------|------|-----|-------|
| LUK | 999 | 700 | Same pattern as warriors. |
| DEX | 25 | 25 | Standard NL build. |

### Weapon Speed

All claws are speed 4 (Fast). Confirmed.

### Shadow Partner

Always active. Reasonable — NL always uses SP for DPS (1.5x multiplier).

### High Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (RC) | 91 | 77 clean + 14 scrolling = 91 perf | Perfect Raven's Claw. Confirmed. |
| Gloves | 21 | 21 ATT SCG endgame | Matches forum target exactly. |
| Cape | 18 | 10+ Blackfist endgame | High but achievable on Pink Gaia. |
| Shoes | 17 | 17 ATT Facestompers endgame | Matches forum target exactly. |
| Medal | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| Stars | 30 (Balanced Fury) | 29 Crystal Ilbi / 30 BFury | Confirmed. BFury is correct endgame. |
| **Total WATK** | **151** | | |

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

NL templates align well with forum guides overall. High tier is genuinely endgame,
low tier is genuinely budget.

---

## 4. Research Findings (February 2026)

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
StrategyWiki, Ayumilove formula compilation, MapleStory Wiki damage formula page, and the
MapleRoyals damage range calculator thread. MapleRoyals has not modified these values
([confirmed by community member Zerato](https://royals.ms/forum/threads/did-mapleroyals-balance-the-damage-between-axe-blunt-weapon-and-sword%EF%BC%9F.125863/)).

**Action taken:** Removed incorrect warning from `weapons.json`. No value changes needed.

Sources: [Axe/BW Balancing Thread](https://royals.ms/forum/threads/the-balancing-of-axes-blunt-weapons-data-included.53212/),
[MapleRoyals hasn't changed axes](https://royals.ms/forum/threads/did-mapleroyals-balance-the-damage-between-axe-blunt-weapon-and-sword%EF%BC%9F.125863/),
[Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/),
[Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/)

### Resolved: Weapon multipliers slash/stab (Q5)

Spear (3.0 slash / 5.0 stab) and Polearm (5.0 slash / 3.0 stab) now use the correct
multiplier based on skill attack type. Crusher stabs (Spear 5.0), Fury slashes (Polearm
5.0). Both get the optimal 5.0 multiplier when using their intended weapon.

---

## 5. Open Design Decisions

These are not bugs — they are choices about what "high" and "low" tier represent. The
current values match the source spreadsheet and model near-theoretical-maximum characters.

### Warrior high C/G/S at 20/20/20 (Q1)

**Research finding:** 20/20/20 WATK on Cape/Glove/Shoe is extreme godly (top ~0.01%).

Forum marketplace data with prices (February 2026):

| Slot | Forum "endgame" | Forum "godly" | Current template | Price at template value |
|------|----------------|---------------|------------------|----------------------|
| Gloves | 15 (~1.5b) | 19-21 (10-18b) | 20 | ~18b |
| Cape | 10-12 (~2-5b) | 17-20 (17-43b) | 20 | ~41b |
| Shoes | 7-8 (~2-3b) | 12-14 (11-14b) | 20 | No listing found |

Key context: Capes gain WATK only via chaos scrolls (no dedicated ATT scroll), making
high-WATK capes extremely RNG-dependent. A 20 ATT PGC was listed at 41-43b. No 20 ATT
Facestompers were found on the forum; the confirmed ceiling is ~13-14 from marketplace.

**Comparison with NL templates:** NL high uses 21/18/17 (total 56) — still godly but with
a more realistic distribution across slots.

**Options:**
- **Keep 20/20/20** — models theoretical maximum. Useful for ceiling comparisons.
- **Reduce to ~17/14/10** (total 41) — models a well-funded endgame character (~15-20b
  total C/G/S investment). More representative of the population that balance changes
  actually affect.
- **Reduce to ~19/17/13** (total 49) — models a top-1% character. Middle ground.

Sources: [Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/),
[Endgame Progression Thread](https://royals.ms/forum/threads/best-%E2%80%9Cdecent%E2%80%9D-gear-progressing-into-end-game.229612/),
[20 ATT PGC listing](https://royals.ms/forum/threads/s-20-att-cape-pgc-6173-clean-ep.230089/),
[20 WA SCG listing](https://royals.ms/forum/threads/s-scg-20-wa-c-o-18b.237392/)

### Warrior low weapon at 140 WATK (Q2)

**Research finding:** 140 WATK is solidly mid-funded, not budget.

Forum trading data:

| WATK | Weapon | Price | Tier |
|------|--------|-------|------|
| 125 | Dragon Claymore | 500m | Budget |
| 128 | Stonetooth | ~2b | Budget endgame |
| 130 | Stonetooth | 1.75-3b | Mid-funded |
| 140+ | Stonetooth | 8-15b est. | High-mid |
| 144 | Stonetooth | 25b | Near-godly |

The Paladin guide lists 130 WATK 2H sword as "mid-range." The community recommends
"a 128 ST for 2b" as the budget entry point. The DK guide describes 120+ Sky Ski as
"very expensive" for budget players.

**Options:**
- **Keep 140** — matches source spreadsheet. Models a character with some investment.
- **Reduce to 125** — matches budget Dragon Claymore pricing (~500m). Genuine "low tier."
- **Reduce to 130** — matches mid-range per Paladin guide. Compromise between budget
  and the current value.

Sources: [Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/),
[Help with Choosing Swords](https://royals.ms/forum/threads/help-with-choosing-swords.124072/),
[DK Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/),
[Dragon Claymore 125 listing](https://royals.ms/forum/threads/s-125-dragon-claymore-and-127-dark-neschere.228554/),
[Stonetooth Price Check](https://royals.ms/forum/threads/p-c-on-various-stonetooth-swords.205623/)
