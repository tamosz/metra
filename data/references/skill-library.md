# MapleRoyals Skill Library — Max Level Reference

**Source:** [MapleRoyals Skill Library](https://royals.ms/forum/threads/mapleroyals-skill-library.209540/)
**Author:** nut (extracted from game files)
**Accessed:** 2026-03-07
**Used in:** `data/skills/*.json`

Max-level values only. These are raw game file values — Royals-specific buffs/nerfs
may override some of these (check `data/references/balance-changes.md`).

## Warriors

| Skill | Job | Damage% | Hits | Targets | Notes |
|-------|-----|---------|------|---------|-------|
| Brandish | Hero (4th) | 260 | 2 | 3 | |
| Spear Crusher | DrK (3rd) | 170 | 3 | 3 | Main DPS skill, boosted by Berserk |
| Pole Arm Crusher | DrK (3rd) | 170 | 3 | 3 | Identical stats to Spear Crusher |
| Blast | Paladin (4th) | 580 | 1 | 1 | |
| Holy Charge: Sword | Paladin (4th) | 140% multiplier | — | — | 300s duration |
| Divine Charge: BW | Paladin (4th) | 140% multiplier | — | — | 300s duration |
| Fire/Ice/Lightning Charge | WK (3rd) | 130% multiplier | — | — | 200s duration |
| Berserk | DrK (4th) | 210% multiplier | — | — | Below 50% HP |

## Thieves

| Skill | Job | Damage% | Hits | Targets | Notes |
|-------|-----|---------|------|---------|-------|
| Triple Throw | NL (4th) | 150 | 3 | 1 | |
| Boomerang Step | Shadower (4th) | 600 | 2 | 4 | Fixed: code was 6 |
| Assassinate | Shadower (4th) | 950 | 3 (+conditional 4th dash) | 1 | Code correct at 3 |
| Savage Blow | Bandit (3rd) | 80 | 6 | 1 | |
| Band of Thieves | Bandit (2nd) | 250 | 1 | 6 | TODO: add BStep + BoT combo (need cycle time) |

**Critical Throw** (Assassin 2nd): 50% crit rate, 200% crit damage (= +100 bonus)
**Shadow Partner** (Hermit 3rd): 50% skill damage clone
**Shadow Shifter** (NL/Shad 4th): 30% avoid rate

## Archers

| Skill | Job | Damage% | Hits | Targets | Notes |
|-------|-----|---------|------|---------|-------|
| Hurricane | BM (4th) | 100 | 1 | 1 | Fixed 0.12s attack time |
| Strafe (BM) | Ranger (3rd) | 100 | 4 | 1 | |
| Arrow Bomb | Hunter (2nd) | 130 | 1 | 6 | 60% stun, scaleOnBase crit |
| Strafe (MM) | Sniper (3rd) | 125 | 4 | 1 | |
| Snipe | MM (4th) | — | 1 | 1 | Fixed 195,000 dmg, 4s CD |
| Piercing Arrow | MM (4th) | 850 (max) | 1 | 6 | Damage increases per pierce |

**Critical Shot** (Archer 1st): 40% crit rate, 200% crit damage (= +100 bonus)
**Marksman Boost** (MM 4th): +15 WATK, 100% mastery

## Pirates

| Skill | Job | Damage% | Hits | Targets | Notes |
|-------|-----|---------|------|---------|-------|
| Battleship Cannon | Corsair (4th) | 380 | 4 | 1 | |
| Rapid Fire | Corsair (4th) | 200 | 1 | 1 | Hurricane-style |
| Demolition | Bucc (4th) | 500 | 8 | 1 | Requires Super Transform |
| Barrage | Bucc (4th) | 330 | 6 | 1 | Library shows flat 330% x6; per-hit multipliers (5th 2x, 6th 4x) from spreadsheet only |
| Dragon Strike | Bucc (4th) | 900 | 1 | 6 | |
| Snatch | Bucc (4th) | 600 | 1 | 6 | Requires Super Transform |

**Bullseye** (Corsair 4th): +20% additional damage (1.2x multiplier), 580% base attack

## Mages

| Skill | Job | Damage% | Hits | Targets | Notes |
|-------|-----|---------|------|---------|-------|
| Chain Lightning | I/L (4th) | 210 | 1 | 6 | |
| Blizzard | I/L (4th) | 570 (Royals: 600) | 1 | 15 | |
| Paralyze | F/P (4th) | 240 | 1 | 1 | |
| Meteor Shower | F/P (4th) | 570 (Royals: 620) | 1 | 15 | |
| Angel Ray | Bishop (4th) | 240 | 1 | 1 | |
| Genesis | Bishop (4th) | 670 | 1 | 15 | |

**Element Amplification** (I/L & F/P 3rd): 140% = 1.4x multiplier
**Spell Mastery** (per-skill): 60% at max level for CL/Paralyze/Angel Ray

## Discrepancies with Code

### Boomerang Step maxTargets: Library 4, Code was 6 (FIXED)
Skill library, 2026 guide, Quokka guide, and In-Depth guide all confirm 4 targets.
No Royals balance change to target count found. Code corrected to 4.

### Assassinate hitCount: Library says "4 times", Code uses 3 (CORRECT)
Skill library description says "4 times" but this includes a conditional 4th dash
hit that only occurs if the monster survives the first 3 hits and the player is
interrupted. All three Shadower guides confirm the base attack is 3 lines
(950% x3 = 2850% total). The 4th hit is not part of standard DPS rotation.
Sources: 2026 guide (thread 252048), Quokka guide (thread 180490), In-Depth guide (thread 8122).

### Barrage per-hit multipliers: Not in library
Library shows flat 330% x6 hits. The 5th hit 2x / 6th hit 4x breakdown comes
from the source spreadsheet only. Not confirmable from skill library data.
