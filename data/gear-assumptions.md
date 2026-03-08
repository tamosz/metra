# Gear Template Assumptions

This document captures the implicit assumptions baked into each gear template.
These drive all DPS comparisons in simulation reports — understanding them is
essential for interpreting results.

Cross-referenced against Royals forum guides:
- [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/)
- [Sire's Warrior Guide](https://royals.ms/forum/threads/sires-complete-mapleroyals-warrior-guide.8474/)
- [Dark Knight Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/)
- [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
- [Darko's Night Lord Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
- [Comprehensive Night Lord Guide](https://royals.ms/forum/threads/a-comprehensive-night-lord-guide.23303/)

---

## 1. Universal Assumptions (all templates)

| Assumption | Value | Notes |
|------------|-------|-------|
| MW level | 20 | MW20 is the max level in Royals. |
| Sharp Eyes | Always active | SE from BM/MM mule or party member. Guides call it "the most important buff." |
| Speed Infusion | Always active | SI from Buccaneer. |
| Echo of Hero | Always active | Nearly universal buff (4% WATK). Both tiers assume it. |
| Booster | Always active (implicit) | No field in CharacterBuild; hardcoded as -2 weapon speed in engine. |
| Tiers | Low, Mid, High, Perfect | Budget → mid-funded → endgame → theoretical max. |
| Low potion | 60 WATK (Heartstopper) | 1 min duration. Standard for bossing comparisons. |
| Mid potion | 60 WATK (Heartstopper) | Same as low — mid-tier players don't regularly Apple. |
| High potion (physical) | 100 WATK (Onyx Apple) | 10 min. Standard endgame bossing potion. |
| High potion (mage) | 220 MATK (Ssiws Cheese) | Mage-specific endgame potion. Community confirmed: "Mages use Ssiws Cheese or Subani's Mystic Cauldron (not stoppers/apples)" ([DPS charts thread](https://royals.ms/forum/threads/dps-charts.124709/)). Source spreadsheet E8 formula lists mage-only potions: Lollipop (45), Graham Pie (120), Subani (200), Ssiws Cheese (220). |
| Mid mage potion | 45 MATK (Lollipop) | Same as low — Stopper gives 0 MATK for mages. |
| Perfect potion (physical) | 100 WATK (Onyx Apple) | Same as high. |
| Perfect potion (mage) | 220 MATK (Ssiws Cheese) | Same as high. |

**Implications:**
- Booster cannot be toggled off — unboosted scenarios are not modeled.
- All comparisons assume a full party with SE, SI, and MW20.

---

## 2. Godly System

MapleRoyals adds a "godly" mechanic: every stat on equipment can roll up to +5 over the
original MapleStory max clean value. This applies to WATK/MATK, STR, DEX, LUK, INT, and
all other equipment stats.

**Example:** Stonetooth Sword original MS max clean = 106, godly = 111.

**Theoretical max weapon WATK** = godly clean + 7 upgrade slots × 5 WATK (30% dark scroll)
= godly + 35.

| Weapon | Class | MS Max Clean | Godly (+5) | +35 scrolling | Theoretical Max |
|--------|-------|:---:|:---:|:---:|:---:|
| Stonetooth Sword | Hero, Paladin | 106 | 111 | +35 | 146 |
| Dragon Battle Axe | Hero (Axe) | 112 | 117 | +35 | 152 |
| Sky Ski | Dark Knight | 99 | 104 | +35 | 139 |
| Dragon Flame | Paladin (BW) | 117 | 122 | +35 | 157 |
| Dragon Purple Claw | Night Lord | 55 | 60 | +35 | 95 |
| White Nisrock | Bowmaster | 100 | 105 | +35 | 140 |
| Dark Neschere | Marksman | 103 | 108 | +35 | 143 |
| Concerto | Corsair | 79 | 84 | +35 | 119 |
| Dragon Slash Claw | Buccaneer | 83 | 88 | +35 | 123 |
| Dragon Kanzir | Shadower | 105 | 110 | +35 | 145 |
| Elemental Wand 5 | Mages | 150 | 155 | +35 | 190 MATK |

The perfect tier uses theoretical max weapon WATK (godly clean + 7× 30% scroll). This is
achievable in principle but extremely rare and expensive in practice — it represents the
hard ceiling of character power, not a typical endgame character.

---

## 3. Warrior Assumptions (Hero, Dark Knight, Paladin, Paladin BW)

### Base Stats

| Stat | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| STR | 999 | 999 | 850 | 700 | Perfect/High = lv200 cap. Mid = ~lv185. Low = ~lv160-170. |
| DEX | 23 | 23 | 22 | 22 | Natural DEX from leveling (dexless build). |

### Weapon Speed

Hero high uses weapon speed 5 (Fast), matching Stonetooth Sword — the standard endgame
Hero weapon per community consensus. With SI active, speed 5 and speed 6 both resolve to
effective speed 2 (0.63s Brandish), so buffed DPS is identical. Without SI, Stonetooth at
speed 5 yields 0.69s vs 0.75s for speed 6 — an 8.7% DPS advantage in unbuffed scenarios.

Dark Knight/Paladin (Sword) templates use weapon speed 6 (Normal), correct for Sky Ski and 2H Sword.

Paladin (BW) templates use weapon speed 7 (Slow), correct for Dragon Flame — the only
viable endgame 2H BW. With SI+Booster, speed 7 resolves to effective speed 3 (0.69s Blast)
vs Sword's speed 2 (0.63s Blast). Without SI, speed 5 (0.81s) vs speed 4 (0.75s). The
speed disadvantage is a significant BW DPS penalty.

### Gear — Hero & Paladin share identical gear

The source spreadsheet treats Hero and Paladin identically for gear. This is reasonable —
same class archetype, same equipment slots. Dark Knight uses the same stat gear but a different
weapon.

### High Tier WATK Breakdown

| Slot | Hero/Paladin | Dark Knight | Forum "endgame" range | Assessment |
|------|-------------|-----|----------------------|------------|
| Weapon | 140 | 134 | ST Sword ~135-145; Sky Ski ~120+ | ~1 failed scroll below perfect (godly+34). |
| Gloves | 20 | 20 | 15-16+ late-game, 21 godly | Top-1%. Standardized across all classes. |
| Cape | 18 | 18 | 10+ late-game, 18-20 godly | Top-1%. Standardized across all classes. |
| Shoes | 16 | 16 | 7+ late-game, 17 is high | Top-1%. Standardized across all classes. |
| Medal | 3 | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 1 | 0-1 | Reasonable. |
| **Total** | **198** | **192** | | |

High tier models a top-1% character. Cape/Glove/Shoe standardized to 20/18/16 across
all classes (warriors, thieves, archers, pirates) for consistent cross-class comparison.

### Perfect Tier WATK Breakdown

| Slot | Hero/Paladin | Dark Knight | Hero (Axe) | Paladin (BW) | Notes |
|------|-------------|-----|-----------|-------------|-------|
| Weapon | 146 | 139 | 152 | 157 | Theoretical max: godly clean + 7× 30% scroll. |
| Gloves | 24 | 24 | 24 | 24 | Perfect tier C/G/S: 24/24/22. |
| Cape | 24 | 24 | 24 | 24 | |
| Shoes | 22 | 22 | 22 | 22 | |
| Medal | 3 | 3 | 3 | 3 | Same as high. |
| Ring | 1 | 1 | 1 | 1 | Same as high. |
| **Total** | **220** | **213** | **226** | **231** | |

Perfect tier C/G/S: Glove 24 / Cape 24 / Shoe 22 (total 70 WATK). These represent
theoretical godly maxes on accessories — achievable in principle, extremely rare in practice.

Estimated gear stats at perfect tier: STR ~244, DEX ~132 (godly stat gear + perfect
scrolling, approximately +70 primary / +30 secondary over high tier). These are estimates
— no authoritative source for perfect-tier stat distribution exists.

### Low Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon | 130 | Budget ~120-130 | Mid-range per Paladin guide. Genuine budget. |
| Gloves | 10 | 10-15 mid-game | Standardized low-tier C/G/S. |
| Cape | 12 | 6-10 budget | Standardized low-tier C/G/S. |
| Shoes | 10 | 6-7 budget | Standardized low-tier C/G/S. |
| Medal | 0 | 0-1 | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| **Total** | **163** | | |

### Mid Tier WATK Breakdown

| Slot | Hero/Paladin | Dark Knight | Notes |
|------|-------------|-----|-------|
| Weapon | 140 | 133 | Mid-range scrolled. Hero/Pal share gear. |
| Gloves | 15 | 15 | Standardized mid-tier C/G/S. |
| Cape | 16 | 16 | Standardized mid-tier C/G/S. |
| Shoes | 13 | 13 | Standardized mid-tier C/G/S. |
| Medal | 2 | 2 | Between low (0) and high (3). |
| Ring | 1 | 1 | Same across all tiers. |
| **Total** | **187** | **180** | |

Mid tier C/G/S standardized to Glove 15 / Cape 16 / Shoe 13 (total 44 WATK) across all
physical classes. Between low (32) and high (54).

### Pendant Stats

All classes use the same HTP all-stat value per tier:
- **Low (12)**: godly clean HTP, no egg
- **Mid (20)**: partially scrolled + egg
- **High (27)**: 7 base + 5 godly + 15 egg
- **Perfect (28)**: near-max

Stats applied per class: warriors/bucc get STR+DEX, archers/sair get DEX+STR, Night Lord gets LUK+DEX,
Shadower gets LUK+DEX+STR, mages get INT only.

### Paladin (BW) Weapon — Dragon Flame

Paladin (BW) is split from Paladin (Sword) to model the higher weapon WATK and slower
speed of 2H Blunt Weapons. The endgame 2H BW is **Dragon Flame** (lv110, Horntail drop):
- Clean WATK: ~107 avg, ~117 perfect (vs Stonetooth ~101 avg, ~111 perfect)
- Speed 7 (Slow) — one speed tier slower than 2H Sword (Normal 6)
- Same scroll values as 2H Sword (+5 per 30%, +2 per 60%)

Dragon Flame has +11 WATK over Stonetooth at godly clean (122 vs 111) and maintains
a consistent edge at each scrolling tier:

| Tier | Sword WATK | BW WATK | Delta | Source |
|------|-----------|---------|-------|--------|
| Low | 130 | 136 | +6 | Budget Dragon Flame (107 clean + budget scrolling) |
| Mid | 140 | 146 | +6 | Mid-range scrolled Dragon Flame |
| High | 140 | 156 | +16 | High Sword ~1 failed slot below perfect; BW godly 122 + ~34 scroll |
| Perfect | 146 | 157 | +11 | Theoretical max: godly clean + 7× 30% scroll |

Non-weapon WATK (C/G/S, medal, ring) is identical to Paladin (Sword).

The community considers 2H BW "VASTLY underpowered" vs 2H Sword
([Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)).
The +6 WATK partially offsets the lower effective multiplier (4.24 vs 4.6) and slower
speed, but BW remains behind Sword in DPS.

Sources:
[Sword vs BW Essay](https://royals.ms/forum/threads/sword-vs-bw-an-essay-on-the-futility-of-dps.159790/),
[Paladin BW vs Sword](https://royals.ms/forum/threads/paladin-bw-vs-sword.147362/),
[117 Dragon Flame listing](https://royals.ms/forum/threads/s-130-18luk-dragon-kanzir-117-perfect-dragom-flame.236826/),
[Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/)

---

## 4. Archer Assumptions (Bowmaster, Marksman)

### Shared Gear

Bowmaster and Marksman share identical stat gear and scrolling tier. The only differences
are weapon type (Bow vs Crossbow) and the mastery passive: Bow Expert (+10 WATK) vs
Crossbow Expert / Marksman Boost (+15 WATK, buffed in Update #65.1). This gives Marksman
+5 WATK over Bowmaster at every tier.

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

| Slot | Bowmaster | Marksman | Forum range | Assessment |
|------|----------|---------|------------|------------|
| Weapon | 130 | 130 | 130 ATK valued at ~3.8b | Well-scrolled (~100 base + 6x 30% scrolls). |
| Bow/Crossbow Expert | 10 | 15 | Always +10/+15 | Passive skill. BM +10 (Bow Expert). MM +15 (Marksman Boost, buffed in Update #65.1). |
| Gloves | 20 | 20 | 15-16+ late-game | Top-1%. Standardized across all classes. |
| Cape | 18 | 18 | 10+ late-game | Top-1%. Standardized across all classes. |
| Shoes | 16 | 16 | 7+ late-game | Top-1%. Standardized across all classes. |
| Medal | 3 | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 1 | 0-1 | Reasonable. |
| **Total WATK** | **198** | **203** | | |

### Low Tier WATK Breakdown

| Slot | Bowmaster | Marksman | Forum range | Assessment |
|------|----------|---------|------------|------------|
| Weapon | 105 | 105 | ~95-110 budget | Budget bow/crossbow (~95 base + a few 60% scrolls). |
| Bow/Crossbow Expert | 10 | 15 | Always +10/+15 | Passive skill. |
| Gloves | 10 | 10 | 10-12 mid-game | Standardized low-tier C/G/S. |
| Cape | 12 | 12 | 5-8 budget | Standardized low-tier C/G/S. |
| Shoes | 10 | 10 | 0-6 | Standardized low-tier C/G/S. |
| Medal | 0 | 0 | 0-1 | Reasonable. |
| Ring | 1 | 1 | 0-1 | Reasonable. |
| **Total WATK** | **148** | **153** | | |

### Mid Tier WATK Breakdown

| Slot | Bowmaster | Marksman | Notes |
|------|----------|---------|-------|
| Weapon | 120 | 120 | Mid-range scrolled. |
| Bow/Crossbow Expert | 10 | 15 | Passive skill. |
| Gloves | 15 | 15 | Standardized mid-tier C/G/S. |
| Cape | 16 | 16 | Standardized mid-tier C/G/S. |
| Shoes | 13 | 13 | Standardized mid-tier C/G/S. |
| Medal | 2 | 2 | Between low (0) and high (3). |
| Ring | 1 | 1 | Same across all tiers. |
| **Total WATK** | **177** | **182** | |

### Perfect Tier WATK Breakdown

| Slot | Bowmaster | Marksman | Notes |
|------|----------|---------|-------|
| Weapon | 140 | 143 | Theoretical max: godly clean + 7× 30% scroll. |
| Bow/Crossbow Expert | 10 | 15 | MM gets +15 from Crossbow Expert at perfect tier. |
| Gloves | 24 | 24 | Perfect tier C/G/S: 24/24/22. |
| Cape | 24 | 24 | |
| Shoes | 22 | 22 | |
| Medal | 3 | 3 | Same as high. |
| Ring | 1 | 1 | Same as high. |
| **Total WATK** | **224** | **232** | |

### Projectile WATK (Arrows / Bolts)

MapleRoyals buffed arrow and bolt WATK significantly in
[Update #73.3](https://royals.ms/forum/threads/update-73-3-05-08-2021.194629/). Standard
endgame arrows (Red Arrow for Bow, Blue Arrow for Crossbow) provide **+10 ATK** and are
NPC-purchasable for 100 meso each. The Royal Bow/Crossbow Quiver from Von Leon forging
provides **+12 ATK** but costs ~1b mesos to craft.

Soul Arrow now retains the arrow's attack bonus (changed in Update #73.3), so projectile
WATK is effectively always active for endgame players.

| Tier | BM Projectile | MM Projectile | Notes |
|------|:---:|:---:|-------|
| Low | 10 | 10 | Red Arrow for Bow / Blue Arrow for Crossbow (+10 ATK, NPC) |
| Mid | 10 | 10 | Same — arrows are essentially free |
| High | 10 | 10 | Same |
| Perfect | 12 | 12 | Royal Bow/Crossbow Quiver (+12 ATK, Von Leon craft) |

Sources:
[Update #73.3 Patch Notes](https://royals.ms/forum/threads/update-73-3-05-08-2021.194629/),
[How to buy arrows as BM/MM](https://royals.ms/forum/threads/how-to-easily-buy-arrows-as-bm-mm.210265/),
[Buff Teamwork Quiver thread](https://royals.ms/forum/threads/buff-new-teamwork-quiver-crossbow-quiver.229484/),
[Nany's Bowmaster Guide](https://royals.ms/forum/threads/new-source-nanys-bowmaster-guide-road-to-lord-sniper.121936/)

### Marksman-Specific: Snipe

Snipe deals fixed 195,000 damage per hit regardless of stats or gear. It uses the
`fixedDamage` field on SkillEntry, bypassing the normal damage formula entirely.
Modeled without cooldown (sustained DPS ceiling). At 0.6s attack time, Snipe DPS =
325,000 at both funding tiers.

---

## 5. Night Lord Assumptions

### Base Stats

| Stat | High | Mid | Low | Notes |
|------|------|-----|-----|-------|
| LUK | 999 | 850 | 700 | Same pattern as warriors. |
| DEX | 25 | 25 | 25 | Standard Night Lord build. |

### Weapon Speed

All claws are speed 4 (Fast). Confirmed.

### Shadow Partner

Always active. Reasonable — Night Lord always uses SP for DPS (1.5x multiplier).

### High Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (RC) | 91 | 77 clean + 14 scrolling = 91 perf | Perfect Raven's Claw. Confirmed. |
| Gloves | 20 | 21 ATT SCG endgame | Top-1%. Standardized across all classes. |
| Cape | 18 | 10+ Blackfist endgame | Top-1%. Standardized across all classes. |
| Shoes | 16 | 17 ATT Facestompers endgame | Top-1%. Standardized across all classes. |
| Medal | 3 | 2-3 typical | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| Stars | 30 (Balanced Fury) | 29 Crystal Ilbi / 30 BFury | Confirmed. BFury is correct endgame. |
| **Total WATK** | **149** | | |

### Low Tier WATK Breakdown

| Slot | Value | Forum range | Assessment |
|------|-------|------------|------------|
| Weapon (RC) | 76 | 71-76 mid-range RC | Reasonable — top of budget range. |
| Gloves | 10 | 10-12 mid-game | Standardized low-tier C/G/S. |
| Cape | 12 | 6-8 early cape | Standardized low-tier C/G/S. |
| Shoes | 10 | 6+ mid-game FS | Standardized low-tier C/G/S. |
| Medal | 2 | 1-2 | Reasonable. |
| Ring | 1 | 0-1 | Reasonable. |
| Stars | 27 (Hwabi) | Hwabi standard mid/late | Confirmed. |
| **Total WATK** | **111** | | |

C/G/S standardized to 20/18/16 at high tier and 10/12/10 at low tier, aligning all
classes.

### Perfect Tier WATK Breakdown

At perfect tier, Night Lord upgrades from Raven's Claw to **Dragon Purple Claw** (godly clean 60,
theoretical max 95 WATK). RC tops out at 91 (77 clean godly + 14 scroll) — Dragon Purple
Claw's theoretical max exceeds it by 4 WATK.

| Slot | Value | Notes |
|------|-------|-------|
| Weapon (Dragon Purple Claw) | 95 | Godly clean 60 + 7× 30% scroll. |
| Gloves | 24 | Perfect tier C/G/S: 24/24/22. |
| Cape | 24 | |
| Shoes | 22 | |
| Medal | 3 | Same as high. |
| Ring | 1 | Same as high. |
| Stars | 30 (Balanced Fury) | Unchanged from high. |
| **Total WATK** | **169** | |

---

## 6. Corsair Assumptions

### Base Stats

| Stat | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| DEX | 999 | 999 | 850 | 700 | Same pattern as archers. |
| STR | 4 | 4 | 4 | 4 | Dexless build. |

### Weapon Multiplier

3.6× (Gun). Same as Crossbow.

### WATK Breakdown

| Slot | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| Weapon (Concerto) | 119 | 114 | 113 | 107 | Perfect = godly 84 + 35 scroll. |
| Gloves | 24 | 20 | 15 | 10 | C/G/S per tier. |
| Cape | 24 | 18 | 16 | 12 | |
| Shoes | 22 | 16 | 13 | 10 | |
| Medal | 3 | 3 | 2 | 0 | |
| Ring | 1 | 1 | 1 | 1 | |
| **Total WATK** | **193** | **172** | **160** | **140** | |

---

## 7. Buccaneer Assumptions

### Base Stats

| Stat | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| STR | 999 | 999 | 850 | 700 | Same pattern as warriors. |
| DEX | 23 | 23 | 22 | 22 | Natural DEX from leveling. |

### Weapon Multiplier

4.8× (Knuckle).

### WATK Breakdown

| Slot | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| Weapon (Dragon Slash Claw) | 123 | 118 | 116 | 105 | Perfect = godly 88 + 35 scroll. |
| Gloves | 24 | 20 | 15 | 10 | C/G/S per tier. |
| Cape | 24 | 18 | 16 | 12 | |
| Shoes | 22 | 16 | 13 | 10 | |
| Medal | 3 | 3 | 2 | 0 | |
| Ring | 1 | 1 | 1 | 0 | |
| **Total WATK** | **197** | **176** | **163** | **137** | |

---

## 8. Shadower Assumptions

### Base Stats

| Stat | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| LUK | 999 | 999 | 850 | 700 | Same pattern as Night Lord. |
| STR | 20 | 20 | 20 | 20 | Secondary stat (with DEX). |
| DEX | 20 | 20 | 20 | 20 | Secondary stat. |

### Weapon Multiplier

3.6× (Dagger). Shadow Partner always active (1.5× multiplier).

### WATK Breakdown

Shadower uses Dagger + Shield, so both weapon and shield contribute WATK.

| Slot | Perfect | High | Mid | Low | Notes |
|------|---------|------|-----|-----|-------|
| Weapon (Dragon Kanzir) | 145 | 140 | 135 | 125 | Perfect = godly 110 + 35 scroll. |
| Shield | 48 | 43 | 37 | 31 | Perfect = godly Dark Impenetrable + perfect scrolling. |
| Gloves | 24 | 20 | 15 | 10 | C/G/S per tier (Shadower uses thief gloves). |
| Cape | 24 | 18 | 16 | 12 | |
| Shoes | 22 | 16 | 13 | 10 | |
| Medal | 0 | 0 | 0 | 0 | Shadower medals provide stats, not WATK. |
| Ring | 1 | 1 | 1 | 1 | |
| **Total WATK** | **264** | **238** | **217** | **189** | |

---

## 9. Research Findings (February 2026)

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
class had proper tiered weapon values (e.g., Hero 130→140→150, Dark Knight 127→133→139). The
source spreadsheet has no archer gear template data — templates were adapted from warrior
templates with a single estimated WATK that was never differentiated.

**Decision:** Calibrated bow/crossbow weapon WATK using Royals forum marketplace data:
- Low: 120 → 105 (budget Nisrock, ~95 base + a few 60% scrolls)
- Mid: 120 → 120 (unchanged, already appropriate)
- High: 120 → 130 (well-scrolled Nisrock, ~100 base + 6x 30% scrolls, valued at ~3.8b)

BM Hurricane High moved from 225k (#9) to 233k (#8). Low tier decreased from 113k to 105k,
giving realistic tier spread matching other classes.

Sources: Royals forum marketplace listings, Nisrock price/check threads, buy threads.

### Resolved: High tier weapon values corrected (Q7, March 2026)

**Finding:** When adding perfect tier templates, 6 high tier weapon WATK values were found
to be inconsistent with the godly system. High tier is intended to model a top-1% character
— near-perfect gear, not theoretical maximum. The corrected values sit approximately one
failed scroll slot below the godly cap (i.e., godly clean + ~6× 30% scroll instead of 7×).

**Corrected values (weapon WATK only):**

| Class | Old High | New High | Perfect | Rationale |
|-------|----------|----------|---------|-----------|
| Hero/Paladin | 150 | 140 | 146 | Stonetooth: godly 111 + ~29 scroll (vs 35 perfect) |
| Dark Knight | 139 | 134 | 139 | Sky Ski: godly 104 + ~30 scroll |
| Corsair | 120 | 114 | 119 | Concerto: godly 84 + ~30 scroll |
| Buccaneer | 128 | 118 | 123 | Dragon Slash Claw: godly 88 + ~30 scroll |
| Shadower (dagger) | 145 | 140 | 145 | Dragon Kanzir: godly 110 + ~30 scroll |

These corrections ground high tier at ~1 failed scroll slot below perfect, giving each
class a realistic tier gap. Hero Axe and Paladin BW were unaffected (already reasonable).

Note: Dark Knight high weapon (134) still falls 5 WATK below Dark Knight perfect (139 = godly Sky Ski).
Sky Ski's lower godly cap (104) means 139 is also the theoretical max, so high ≈ perfect
for Dark Knight weapon.

---

## 10. Resolved Design Decisions

### Resolved: C/G/S standardized across all tiers (Q1, February 2026; updated March 2026)

**Finding:** Original templates had inconsistent C/G/S WATK across classes (warriors at
20/20/20, Night Lord at 21/18/17, Corsair at 20/20/18, etc.). 20/20/20 was extreme godly
(top ~0.01%), with 20 ATT shoes not even found on the marketplace. Low tier also varied
wildly by class (warriors 15/12/10, archers 12/5/0, Night Lord 12/8/6, etc.).

**Decision:** Standardize C/G/S across all physical classes at every tier:

| Tier | Glove | Cape | Shoe | Total |
|------|-------|------|------|-------|
| Low | 10 | 12 | 10 | 32 |
| Mid | 15 | 16 | 13 | 44 |
| High | 20 | 18 | 16 | 54 |
| Perfect | 24 | 24 | 22 | 70 |

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

**Decision:** Reduce Hero and Paladin low-tier weapon from 140 → 130 WATK. Dark Knight low
already at 127 — no change needed. 130 represents a genuine budget-to-mid funded character.

Sources: [Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/),
[Help with Choosing Swords](https://royals.ms/forum/threads/help-with-choosing-swords.124072/),
[DK Guide 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/),
[Dragon Claymore 125 listing](https://royals.ms/forum/threads/s-125-dragon-claymore-and-127-dark-neschere.228554/),
[Stonetooth Price Check](https://royals.ms/forum/threads/p-c-on-various-stonetooth-swords.205623/)
