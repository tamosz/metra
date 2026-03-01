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
| High | 19 | 17 | 13 | 49 |
| Mid | 17 | 14 | 10 | 41 |
| Low | 15 | 12 | 10 | 37 |

High tier models top-1% gear — achievable endgame without being theoretical maximum.
Original templates had 20/20/20 (extreme godly, top ~0.01% — 20 ATT shoes don't even
appear on the marketplace).

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
| Paladin | 2H Sword / 2H BW | 150 / 150 | 130 / 130 | 6 |
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
