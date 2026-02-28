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
| Echo of Hero | Always active | Event buff (4% WATK). Available periodically. Both tiers assume it. |
| Booster | Always active (implicit) | No field in CharacterBuild; hardcoded as -2 weapon speed in engine. |
| Tiers | Only "low" and "high" | No mid tier. |
| Low potion | 60 WATK (Heartstopper) | 1 min duration. Standard for bossing comparisons. |
| High potion | 100 WATK (Onyx Apple) | 10 min. Standard endgame bossing potion. |

**Implications:**
- Echo on low tier inflates low-tier numbers slightly vs. reality (Echo requires event access).
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

All warrior templates use weapon speed 6 ("Normal"). This is correct for Dragon Claymore
and Sky Ski, but **Stonetooth Sword is speed 5 (Fast)**. If Hero high represents a
Stonetooth user, weapon speed should be 5, yielding faster attack time.

Current templates model speed 6 to match the source spreadsheet.

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

## 4. Open Questions

1. **Echo on low tier** — Echo requires event access. Both tiers having Echo makes them
   harder to differentiate. Consider removing Echo from low tier for a more realistic
   budget scenario.

2. **Warrior high C/G/S at 20/20/20** — Cape/Glove/Shoe all at 20 WATK is near-godly.
   Forum guides suggest 15+ gloves, 10+ cape, 7+ shoes for "endgame." Our high tier
   models a top-0.1% character.

3. **Warrior low weapon at 140** — Still very well-scrolled for a "budget" build.
   Closer to mid-funded. Budget weapons are typically 120-130.

4. **Stonetooth speed** — Stonetooth Sword is speed 5 (Fast), not speed 6 (Normal).
   If Hero high uses Stonetooth, weapon speed should be 5. Current templates use speed 6
   to match the source spreadsheet. This is a design decision, not a bug.

5. **Axe/BW weapon multipliers may be wrong** — The project uses 1H Axe 4.4 / 2H Axe 4.8
   and 1H BW 4.4 / 2H BW 4.8 (from the source spreadsheet). Standard GMS v62 values are
   1H 4.0 / 2H 4.2. A forum thread ([The Balancing of Axes & Blunt Weapons](https://royals.ms/forum/threads/the-balancing-of-axes-blunt-weapons-data-included.53212/))
   proposed buffing these values but noted that "changing calculations is difficult without
   a custom client," implying server-side implementation may not have happened. **Needs
   in-game verification.** If the actual values are GMS v62, Axe/BW damage would decrease
   significantly (Axe 2H: 4.8→4.2 = ~12.5% less primary stat contribution).

6. **Weapon multipliers distinguish slash/stab** — Spear (3.0 slash / 5.0 stab) and Polearm
   (5.0 slash / 3.0 stab) now use the correct multiplier based on skill attack type.
   Crusher stabs (Spear 5.0), Fury slashes (Polearm 5.0). Both get the optimal 5.0
   multiplier when using their intended weapon.
