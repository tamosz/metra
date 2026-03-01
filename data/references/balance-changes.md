# Balance Changes

MapleRoyals deviations from standard GMS v62. Primary source is the comprehensive
change list thread, supplemented by individual update threads.

## Master Change List

**Source:** [Comprehensive List of Changes Since the New Source](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Source:** [Class Skill Changes](https://royals.ms/forum/threads/class-skill-changes.196513/)
**Accessed:** 2026-03-01
**Used in:** all `data/skills/*.json` files

These threads track every MapleRoyals deviation from vanilla v62. The sections below
extract DPS-relevant changes by class.

## Update #68 — Dark Knight Berserk Buff

**Source:** [Update #68 Patch Notes](https://royals.ms/forum/threads/update-68-20-10-2020.176133/)
**Source:** [Update #68 Class Buffs Discussion](https://royals.ms/forum/threads/update-68-class-buffs.176455/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/drk.json`

Berserk damage multiplier buffed at high levels:

| Level | Before | After |
|-------|--------|-------|
| 26 | 188% | 190% |
| 27 | 191% | 195% |
| 28 | 194% | 200% |
| 29 | 197% | 205% |
| 30 | 200% | **210%** |

Activation threshold: below 50% HP. Level 30 value of 2.1x is what we model.

Also in Update #68:
- Achilles damage reduction: 15% → **20%** (survivability, not DPS)
- Snipe now hits through Weapon Cancel (display shows 1 dmg, actual damage applied)
- Warrior shields: all now have 10 upgrade slots

## Shadower — Assassinate and Boomerang Step

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Source:** [Class Skill Changes](https://royals.ms/forum/threads/class-skill-changes.196513/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/shadower.json`

- Assassinate: charge mechanic removed; base power 600% → **950%** at level 30; no charging required in Dark Sight for max damage; range increased
- Boomerang Step: base power 500% → **600%** at level 30; range increased; usable near edges
- Shadow Shifter: evasion 30% → **40%** at max level
- Smokescreen: duration 60s → **90s** at max level

## Buccaneer — Barrage and Demolition

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/bucc.json`

- Barrage: base power 230% → **330%** at level 30; skill delay reduced (Update #48)
- Demolition: base power 400% → **500%** at level 30
- Energy Charge: stance 30% → **90%** at level 40; energy gained per hit, not capped per monster (Update #50)
- Transform/Super Transform: cooldown 1s → **60s** (Update #60)

## Corsair — Rapid Fire

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/sair.json`

- Rapid Fire: damage 170% → **200%** at max level (Update #50)
- Battleship: damage taken reduced by factor of 10 (Update #13)

## Marksman — Snipe and Marksman Boost

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/marksman.json`

- Snipe: cooldown scales 33s → **4s** (level 1-30); hits through Weapon Cancel (Update #68)
- Marksman Boost: weapon attack +10 → **+15** at max level (Update #65.1); mastery 90% → **100%** (Update #71)
- Strafe (Ranger/Sniper): damage scaling increased to **125%** at max level

## Archer — Strafe Buff

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/bowmaster.json`, `data/skills/marksman.json`

- Strafe (3rd job): damage increased to 125% at max level (from 100%)

## Paladin — White Knight Charges

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/paladin.json`

- Fire/Flame/Thunder Charge: 120-125% → **130%** at max level (Update #50)
- Ice/Blizzard Charge: 110% → **130%** at max level (Update #50)
- Blast: vertical hitbox 60px above → **90px above** + 30px below

## Mage — Elemental Amplification and Ultimates

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01
**Used in:** `data/skills/archmage-il.json`

- Elemental Amplification: damage multiplier 135% → **140%** at level 30 (Update #65.1)
- Chain Lightning (I/L): damage 180% → **210%** at max level (Update #50)
- Paralyze (F/P): damage 210% → **240%** at max level (Update #50)
- Blizzard: attack 570 → **600**; MP cost 3500 → **2900**
- Meteor Shower: attack 570 → **620**; MP cost 3500 → **2900**
- Infinity: duration 40s → **120s** at level 30 (Update #65)

Note: our Archmage I/L data uses the pre-buff Blizzard value of 570 from the source
spreadsheet, not the buffed 600. This may need updating — see the spreadsheet values
to determine which version it models.

## Warriors — General

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01

- Power Guard (Fighter/Page): duration 90s → **180s** at max level (Update #50)
- Guardian: proc rate 15% → **25%** at max level
- Heaven's Hammer: cooldown 49s → **20s** (level 30)
- Final Attack: changed from passive to active skill

## Night Lord

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01

- Shadow Shifter: evasion adjusted to **30%** at max level (was 20%, briefly 40%, settled at 30%)
- Shadow Stars: 1-second cooldown added
- Alchemist (Hermit): 150% → **125%** at max level (nerf)

## HP Advancement Changes

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-03-01

All classes got HP boosts on job advancement (not DPS-relevant but affects survivability):
- Warriors 3rd job: +300-350 → **+1000-1050**; 4th job: +300-350 → **+1800-1850**
- Archers/Thieves/Pirates 3rd job: +300-350 → **+600-650**; 4th job: +300-350 → **+900-950**
