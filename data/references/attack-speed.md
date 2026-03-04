# Attack Speed

Speed tier mechanics, booster/SI interactions, and fixed-time skills.

## Speed Tier System

**Source:** Source spreadsheet "Attack Speed" sheet A1:F8
**Source:** [Damage Range Calculator](https://royals.ms/forum/threads/damage-range-calculator.17086/)
**Accessed:** 2026-02-01
**Used in:** `data/attack-speed.json`, `src/engine/attack-speed.ts`

Effective speed = base weapon speed - booster (2) - SI (2). Capped at speed 2 (fastest).

| Base Speed | With Booster | With Booster + SI |
|------------|-------------|-------------------|
| 8 (Slow) | 6 | 4 |
| 7 | 5 | 3 |
| 6 (Normal) | 4 | 2 (cap) |
| 5 (Fast) | 3 | 2 (cap) |
| 4 (Fast) | 2 (cap) | 2 (cap) |

Key implication: with SI, weapons at speed 5 and 6 both resolve to speed 2. Without SI,
speed 5 is faster (e.g., Brandish 0.69s vs 0.75s). This is why Stonetooth Sword (speed 5)
matters for unbuffed scenarios.

## Attack Times by Skill (at Speed 2)

**Source:** Source spreadsheet "Attack Speed" sheet
**Accessed:** 2026-02-01
**Used in:** `data/attack-speed.json`

| Skill | Time (s) | Notes |
|-------|----------|-------|
| Brandish | 0.63 | |
| Blast | 0.63 | |
| Crusher | 0.81 | |
| Triple Throw | 0.60 | |
| Strafe/Snipe | 0.60 | Shared category |
| Battleship Cannon | 0.60 | |
| Savage Blow | 0.60 | Same as Strafe/Snipe |
| Assassinate | 1.62 | |

## Fixed-Time Skills

**Source:** Source spreadsheet dmg sheet C14, C36-C42
**Accessed:** 2026-02-01
**Used in:** `data/attack-speed.json`

These skills ignore weapon speed entirely:

| Skill | Time (s) | Notes |
|-------|----------|-------|
| Hurricane | 0.12 | Bowmaster, constant across all speeds |
| Rapid Fire | 0.12 | Corsair, same as Hurricane |
| Demolition | 2.34 | Buccaneer, 8-hit fixed cycle |
| Barrage + Demolition | 4.04 | Buccaneer combo, derived from forum DPS ratios |
| BStep + Assassinate 30 | 2.31 | Shadower combo (0.69 + 1.62) |

### Mage Attack Times

**Source:** Source spreadsheet dmg sheet C36-C42
**Accessed:** 2026-02-25
**Used in:** `data/attack-speed.json`

Mage skills are fixed per skill, not speed-dependent in the spreadsheet:

| Skill | Time (s) |
|-------|----------|
| Chain Lightning | 0.69 |
| Blizzard | 3.06 |
| Angel Ray | 0.81 |
| Genesis | 2.70 |

## Snipe Cooldown

**Source:** [Marksman skill data source field](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-02-15
**Used in:** `data/skills/marksman.json`

Snipe has ~5s effective cooldown:
- 4s programmed cooldown at level 30
- ~1s additional from server tick rounding
- Confirmed by staff on royals.ms forum

Modeled as a 5.00s rotation cycle (Snipe Rotation speed category) with Strafe filler.
At speed 2: 7 Strafes fit in the remaining time (5.0 / 0.714 ≈ 7).

## Weapon Base Speeds

**Source:** Community guides, in-game verification
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/*.json`

| Weapon | Speed | Classes |
|--------|-------|---------|
| Stonetooth Sword | 5 (Fast) | Hero high tier |
| Other 2H Swords | 6 (Normal) | Hero low/mid, Paladin |
| 2H Axe | 6 (Normal) | Hero (Axe), all tiers |
| 2H BW | 6 (Normal) | Paladin BW variant |
| Spear (Sky Ski) | 6 (Normal) | DrK |
| Claw | 4 (Fast) | Night Lord |
| Bow | 6 (Normal) | Bowmaster |
| Crossbow | 6 (Normal) | Marksman |
| Gun | 6 (Normal) | Corsair |
| Knuckle | 6 (Normal) | Buccaneer |
| Dagger | 4 (Fast) | Shadower |

### Stonetooth vs Dragon Claymore

**Source:** [Why is Stonetooth the endgame weapon?](https://royals.ms/forum/threads/for-heros-why-is-stonetooth-the-end-game-weapon.116341/)
**Source:** [Claymore vs Stonetooth](https://royals.ms/forum/threads/claymore-vs-stonetooth.58556/)
**Accessed:** 2026-02-01
**Used in:** `data/gear-templates/hero-high.json`

Stonetooth Sword (speed 5) is standard endgame Hero weapon. Dragon Claymore has higher
WATK but speed 6 — only advantageous with SI. Stonetooth gives 8.7% DPS advantage in
unbuffed scenarios (0.69s vs 0.75s Brandish).

### No Speed-5 2H Axe

**Source:** In-game verification
**Accessed:** 2026-02-15
**Used in:** `data/skills/hero-axe.json`

No 2H Axe exists at speed 5 in v62. All 2H Axes are speed 6. This means Hero (Axe) is
always slower than Hero (Sword) unbuffed, but identical when SI resolves both to speed 2.
