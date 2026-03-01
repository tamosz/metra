# Class Guides

Per-class verified values extracted from community guides on royals.ms.

## Hero

**Source:** [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/)
**Source:** [Sire's Complete Warrior Guide](https://royals.ms/forum/threads/sires-complete-mapleroyals-warrior-guide.8474/)
**Accessed:** 2026-02-01
**Used in:** `data/skills/hero.json`, `data/gear-templates/hero-*.json`

- Mastery: 0.6 (from range calculator D7)
- Brandish: 260% base, 1.9x multiplier, 2 hits
- Primary: STR, Secondary: DEX
- Endgame weapon: Stonetooth Sword (speed 5, ~145-150 WATK perfect)
- SE crit formula: addBeforeMultiply

## Hero (Axe)

**Source:** [The Balancing of Axes/Blunt Weapons](https://royals.ms/forum/threads/the-balancing-of-axes-blunt-weapons-data-included.53212/)
**Source:** [Warrior 2H Weapon Balancing](https://royals.ms/forum/threads/warrior-2h-weapon-balancing.163124/)
**Accessed:** 2026-02-15
**Used in:** `data/skills/hero-axe.json`, `data/gear-templates/hero-axe-*.json`

- Same skills as Hero Sword but with 2H Axe (4.8x multiplier vs 4.6x)
- All 2H Axes are speed 6 — no speed-5 option exists
- Buffed DPS matches Sword (SI resolves both to speed 2)
- Unbuffed: Axe is slower (0.75s vs 0.69s Brandish)

## Dark Knight

**Source:** [A Guide to Dark Knight 2026](https://royals.ms/forum/threads/a-guide-to-dark-knight-2026.230387/)
**Accessed:** 2026-02-01
**Used in:** `data/skills/drk.json`, `data/gear-templates/drk-*.json`

- Mastery: 0.8 (highest among warriors)
- Spear Crusher: 170% base, 2.1x Berserk multiplier, 3 hits, stab (5.0x Spear multiplier)
- Berserk 2.1x confirmed at level 30 (MapleRoyals buff, was 2.0x in v62)
- Primary: STR, Secondary: DEX
- Endgame weapon: Sky Ski (speed 6)
- Fury not modeled — mobbing skill with unsourced attack speed data
- Budget weapon: 127 WATK Sky Ski for ~2b

## Paladin

**Source:** [Comprehensive Paladin Guide (Haplopelma)](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/)
**Accessed:** 2026-02-01
**Used in:** `data/skills/paladin.json`, `data/gear-templates/paladin-*.json`

- Mastery: 0.6
- Blast: 580% base, 4 variants (Holy/Charge × Sword/BW)
- Holy Charge multiplier: 1.4x; F/I/L Charge: 1.3x
- BW Blast uses 3:2 swing/stab ratio → effective 4.24x multiplier
- SE crit formula: addAfterMultiply (unique among implemented classes)
- Budget weapon: 130 WATK 2H Sword ("mid-range" per guide)

## Night Lord

**Source:** [Darko's Night Lord Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/)
**Source:** [Comprehensive Night Lord Guide](https://royals.ms/forum/threads/a-comprehensive-night-lord-guide.23303/)
**Accessed:** 2026-02-01
**Used in:** `data/skills/nl.json`, `data/gear-templates/nl-*.json`

- Triple Throw: 150% base, 3 hits, built-in 50% crit (+100 dmg bonus)
- Throwing star formula (LUK-only scaling, no weapon multiplier)
- Shadow Partner always active (1.5x multiplier)
- Claw speed 4 (Fast)
- Endgame: Raven's Claw (77 clean + 14 scrolling = 91 perfect), Balanced Fury stars (30 ATT)
- Budget: ~76 WATK RC, Hwabi stars (27 ATT)

## Bowmaster

**Source:** [Hero Guide](https://royals.ms/forum/threads/hero-guide.57080/) (archer section references)
**Accessed:** 2026-02-01
**Used in:** `data/skills/bowmaster.json`, `data/gear-templates/bowmaster-*.json`

- Hurricane: 100% base, fixed 0.12s attack time, 1 hit
- Strafe: 125% base, 4 hits
- Critical Shot: 40% built-in crit rate, +100 damage bonus (additive with SE)
- Bow Expert: +10 WATK (baked into gear templates)
- Bow 3.4x multiplier, DEX primary, 0.9 mastery

## Marksman

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/)
**Accessed:** 2026-02-15
**Used in:** `data/skills/marksman.json`, `data/gear-templates/marksman-*.json`

- Snipe: 195,000 fixed damage, ~5s effective cooldown (4s + ~1s server tick)
- Strafe (MM): 125% base, 4 hits, 0.6s at speed 2
- Snipe + Strafe weave: 5s cycle, 1 Snipe + 7 Strafes at speed 2
- Critical Shot: 40% crit, +100 bonus (same as Bowmaster)
- Crossbow Expert: +10 WATK, 100% mastery (buffed from 90% in Update #71)
- Crossbow 3.6x multiplier, DEX primary

## Corsair

**Source:** Source spreadsheet dmg sheet rows 9-10
**Accessed:** 2026-02-15
**Used in:** `data/skills/sair.json`, `data/gear-templates/sair-*.json`

- Battleship Cannon: 380% base, 1.2x multiplier, 4 hits, 0.60s at speed 2
- Rapid Fire: 200% base (buffed from 170% in Update #50), 1.2x multiplier, Hurricane-style 0.12s
- Gun 3.6x multiplier, DEX primary, 0.6 mastery
- Battleship Cannon is highest single-skill DPS in the game at high funding

## Buccaneer

**Source:** Source spreadsheet dmg sheet rows 21-24
**Source:** Forum DPS discussions for Barrage+Demo cycle time
**Accessed:** 2026-02-15
**Used in:** `data/skills/bucc.json`, `data/gear-templates/bucc-*.json`

- Demolition: 500% base (buffed from 400%), 8 hits, 2.34s fixed cycle
- Barrage: 330% base (buffed from 230%), 6 hits with escalating multipliers (1x/1x/1x/1x/2x/4x)
- Barrage + Demolition combo: 4.04s cycle, derived from forum DPS ratios
- Knuckle 4.8x multiplier, STR primary, 0.6 mastery

## Shadower

**Source:** Source spreadsheet dmg sheet rows 43-50
**Accessed:** 2026-02-15
**Used in:** `data/skills/shadower.json`, `data/gear-templates/shadower-*.json`

- BStep + Assassinate 30 combo: 2.31s cycle (0.69 + 1.62)
- Boomerang Step: 600% base (buffed from 500%), 2 hits
- Assassinate 30: 950% base (buffed from 600%, charge removed), 3 hits
- Savage Blow: 80% base, 6 hits
- Shadow Partner active (1.5x multiplier)
- Dagger 3.6x multiplier, LUK primary, STR+DEX secondary (both summed)

## Archmage I/L

**Source:** Source spreadsheet dmg sheet rows 37-38, 40
**Accessed:** 2026-02-25
**Used in:** `data/skills/archmage-il.json`, `data/gear-templates/archmage-il-*.json`

- Chain Lightning: 210% base (buffed from 180%), 0.69s fixed
- Blizzard: 570% base, 3.06s fixed (forum says buffed to 600 — spreadsheet may predate this)
- Elemental Amplification: 1.4x spell amp (buffed from 1.35x)
- Elemental Staff: 1.25x weapon amp
- INT primary, LUK secondary, 0.6 mastery

## Bishop

**Source:** Source spreadsheet dmg sheet rows 41-42
**Accessed:** 2026-02-25
**Used in:** `data/skills/bishop.json`, `data/gear-templates/bishop-*.json`

- Angel Ray: 240% base, 0.81s fixed
- Genesis: 670% base, 2.7s fixed
- No amplification passives (spell amp 1.0, weapon amp 1.0)
- Lowest DPS of all implemented classes — Bishop's value is party utility, not damage
