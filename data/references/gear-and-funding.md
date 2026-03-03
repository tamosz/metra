# Gear and Funding

Endgame weapons, scrolling benchmarks, and the tier philosophy behind gear templates.

## Tier Philosophy

**Source:** [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
**Source:** [Endgame Progression Thread](https://royals.ms/forum/threads/best-%E2%80%9Cdecent%E2%80%9D-gear-progressing-into-end-game.229612/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/*.json`, `data/gear-assumptions.md`

Three tiers model the funding spectrum:

| Tier | Level | Potion | Character |
|------|-------|--------|-----------|
| Low | ~160-170 | Heartstopper (60 WATK) | Base/tradeable gear, no scrolling |
| Mid | ~185 | Heartstopper (60 WATK) | Reasonable scrolling |
| High | 200 | Onyx Apple (100 WATK) | Well-scrolled endgame |

Mage low/mid tiers use Lollipop (45 MATK) instead — Heartstopper gives 0 MATK.

A change that looks balanced at high funding might be wildly unbalanced at low, and
vice versa. Always evaluate across tiers.

## C/G/S Standardization

**Source:** [Endgame Progression Thread](https://royals.ms/forum/threads/best-%E2%80%9Cdecent%E2%80%9D-gear-progressing-into-end-game.229612/)
**Source:** [20 ATT PGC listing](https://royals.ms/forum/threads/s-20-att-cape-pgc-6173-clean-ep.230089/)
**Source:** [20 WA SCG listing](https://royals.ms/forum/threads/s-scg-20-wa-c-o-18b.237392/)
**Accessed:** 2026-02-01
**Used in:** all `data/gear-templates/*-high.json`

Cape/Glove/Shoe WATK standardized across all physical classes for fair comparison:

| Tier | Glove | Cape | Shoe | Total |
|------|-------|------|------|-------|
| Perfect | 22 | 22 | 18 | 62 |
| High | 20 | 18 | 16 | 54 |
| Mid | 15 | 16 | 13 | 44 |
| Low | 10 | 12 | 10 | 32 |

High tier models top-1% gear — achievable endgame without being theoretical maximum.
Low tier standardized across all physical classes for consistent cross-class comparison.

## Endgame Weapons

**Source:** [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/)
**Source:** [DK Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/)
**Source:** [Darko's NL Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/*-high.json`

| Class | Weapon | WATK (High) | WATK (Low) | Speed |
|-------|--------|-------------|------------|-------|
| Hero | Stonetooth Sword | 150 | 130 | 5 |
| Hero (Axe) | 2H Axe | 150 | 130 | 6 |
| DrK | Sky Ski | 139 | 127 | 6 |
| Paladin (Sword) | 2H Sword | 150 | 130 | 6 |
| Paladin (BW) | Dragon Flame (2H BW) | 156 | 136 | 7 |
| NL | Raven's Claw | 91 | 76 | 4 |
| BM/MM | Bow / Crossbow | 130 | 105 | 6 |
| Corsair | Gun | — | — | 5 |
| Buccaneer | Knuckle | — | — | 6 |
| Shadower | Dagger | — | — | 4 |

### Warrior Weapon Pricing

**Source:** [Help with Choosing Swords](https://royals.ms/forum/threads/help-with-choosing-swords.124072/)
**Source:** [Stonetooth Price Check](https://royals.ms/forum/threads/p-c-on-various-stonetooth-swords.205623/)
**Source:** [Dragon Claymore 125 listing](https://royals.ms/forum/threads/s-125-dragon-claymore-and-127-dark-neschere.228554/)
**Accessed:** 2026-02-01

- Budget entry: 128 WATK Stonetooth for ~2b
- Mid-range: 130-140 WATK
- Endgame: 145-150 WATK (very expensive)
- Dragon Claymore: theoretically higher WATK but speed 6, extremely rare

130 WATK was chosen for low tier as genuine budget — confirmed "mid-range" by Paladin guide.

### 2H BW Weapon — Dragon Flame

**Source:** [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
**Source:** [Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/)
**Source:** [Sword vs BW Essay](https://royals.ms/forum/threads/sword-vs-bw-an-essay-on-the-futility-of-dps.159790/)
**Source:** [117 Dragon Flame listing](https://royals.ms/forum/threads/s-130-18luk-dragon-kanzir-117-perfect-dragom-flame.236826/)
**Accessed:** 2026-03-02
**Used in:** `data/gear-templates/paladin-bw-*.json`

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

## Throwing Stars

**Source:** [Darko's NL Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/nl-*.json`

| Stars | ATT | Tier |
|-------|-----|------|
| Balanced Fury | 30 | High |
| Hwabi | 27 | Low/Mid |
| Crystal Ilbi | 29 | Alternative to BFury |

## Pendant Progression

**Source:** [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/*.json`

| Tier | STR/DEX | Item |
|------|---------|------|
| Low | 10/10 | Basic HTP or Deputy Star |
| Mid | ~16/16 | Partially scrolled HTP |
| High | 22/23 | Near-perfect HTP |

## Base Stats by Tier

**Source:** Community consensus, level progression tables
**Used in:** `data/gear-templates/*.json`

| Tier | Warriors (STR) | NL (LUK) | Archers (DEX) | Pirates (STR/DEX) |
|------|---------------|-----------|---------------|-------------------|
| High | 999 | 999 | 999 | 999 |
| Mid | 850 | 850 | 850 | 850 |
| Low | 700 | 700 | 700 | 700 |

Secondary stats are minimal (dexless/lukless builds): warriors 22-23 DEX, NL 25 DEX,
archers 25 STR.
