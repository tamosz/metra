# Perfect Funding Tier

## Purpose

Add a "perfect" funding tier representing the top 0.1% of characters — fully godly, perfectly scrolled gear at theoretical maximum values. This completes the funding spectrum: low (budget) → mid (reasonable) → high (endgame) → perfect (theoretical max).

## Godly System

MapleRoyals allows every stat on equipment to roll up to **+5 over the original MapleStory max base**. This applies to all stats: WATK/MATK, STR, DEX, LUK, INT, etc.

Example: Stonetooth Sword has an original MS max clean WATK of 106. In Royals, a "godly" Stonetooth can roll up to 111 clean. With 7 upgrade slots and 30% dark scrolls (+5 WATK each), theoretical max = 111 + 35 = **146 WATK**.

This system is the primary differentiator between the high tier ("well-scrolled endgame") and perfect tier ("every stat maxed").

## Tier Assumptions

### Universal (same as high)

- MW20, SE, SI, Echo, Booster always active
- Base primary stat: 999 (lv200)
- Potion: Onyx Apple (100 WATK) / Ssiws Cheese (220 MATK for mages)

### Accessories

| Slot    | Perfect | High | Mid | Low |
|---------|:-------:|:----:|:---:|:---:|
| Glove   | 22      | 19   | 17  | 15  |
| Cape    | 20      | 17   | 14  | 12  |
| Shoe    | 18      | 13   | 10  | 10  |
| Medal   | 3       | 3    | 2   | 0   |
| Ring    | 1       | 1    | 1   | 1   |
| **Total** | **64** | **53** | **44** | **38** |

### Weapon WATK

Theoretical max = godly clean (+5 over MS max) + 7/7 30% dark scrolls (+35).

| Class | Weapon | MS Max | Godly | +35 | **Perfect** | High |
|-------|--------|:------:|:-----:|:---:|:-----------:|:----:|
| Hero (Sword) | Stonetooth Sword | 106 | 111 | +35 | **146** | 140 |
| Hero (Axe) | Dragon Battle Axe | 112 | 117 | +35 | **152** | 150 |
| DrK | Sky Ski | 99 | 104 | +35 | **139** | 134 |
| Paladin (Sword) | Stonetooth Sword | 106 | 111 | +35 | **146** | 140 |
| Paladin (BW) | Dragon Flame | 117 | 122 | +35 | **157** | 156 |
| NL | Dragon Purple Claw | 55 | 60 | +35 | **95** | 91 (RC) |
| BM | White Nisrock | 100 | 105 | +35 | **140** | 130 |
| MM | Dark Neschere | 103 | 108 | +35 | **143** | 130 |
| Corsair | Concerto | 79 | 84 | +35 | **119** | 114 |
| Bucc | Dragon Slash Claw | 83 | 88 | +35 | **123** | 118 |
| Shadower | Dragon Kanzir | 105 | 110 | +35 | **145** | 140 |
| Mages | Elemental Wand 5 | 150 | 155 | +35 | **190** | 145 |

NL perfect tier changes weapon from Raven's Claw → Dragon Purple Claw (higher theoretical max with godly system).

### Gear Stats

Perfect tier adds ~60-80 primary stat over high tier from equipment, representing godly base stats (+5 per piece across ~10 stat-contributing slots) plus better scroll success rates.

### Shadower Shield

Shield WATK also increases for perfect tier (godly + perfect scrolling). Exact value TBD during implementation.

## High Tier Corrections

Six high tier templates had weapon WATK at or above theoretical max. Corrected to ~1 failed scroll slot below perfect (theoretical max - 5):

| Class | Was | Corrected | Delta |
|-------|:---:|:---------:|:-----:|
| Hero (Sword) | 150 | 140 | -10 |
| DrK | 139 | 134 | -5 |
| Paladin (Sword) | 150 | 140 | -10 |
| Corsair | 120 | 114 | -6 |
| Bucc | 128 | 118 | -10 |
| Shadower | 145 | 140 | -5 |

These corrections cascade to `totalWeaponAttack` in each template and will change DPS reference values.

## Scope

### Create
- 13 gear templates: `data/gear-templates/{class}-perfect.json`

### Modify
- `src/data/types.ts` — add `'perfect'` to `TIER_ORDER`
- `data/gear-assumptions.md` — document godly system and perfect tier assumptions
- 6 high tier templates (weapon WATK corrections)
- `web/src/components/TierAssumptions.tsx` — add perfect tier row

### No changes needed
- Engine code (auto-discovers tiers from gear templates)
- CLI (auto-discovers tiers)
- Simulation/proposal pipeline (tier-agnostic)
- Web dashboard/simulation hooks (tier-agnostic)
