# MapleRoyals Balance Simulator

## Project Purpose

This project makes MapleStory class balance *legible*. It translates a sprawling Google Sheet calculator into a structured, testable codebase so that proposed balance changes can be expressed as diffs, simulated, and shared as reproducible reports. The audience is MapleRoyals staff, contributors, and community members debating balance.

The north star: anyone should be able to write a small change file ("buff Brandish from 260 to 280"), run a command, and get a clear before/after comparison across classes and scenarios.

## Source Spreadsheet

The project is being translated from an existing Google Sheets calculator (exported as `.xlsx` in `/data/source-sheet.xlsx`).

**Translation rules:**
- When translating formulas, always extract both the formula string AND the computed value.
- Write tests that assert the code reproduces the spreadsheet's output values.
- Ask the user to clarify the meaning of any cell ranges, sheet names, or magic numbers that aren't self-evident. Don't guess silently.
- Expect cross-sheet references, nested IFs, and implicit assumptions. Flag anything that smells like a hidden assumption.
- Translate one calculation path at a time. Don't try to do the whole sheet at once.

## Running the Project

```bash
# Run all tests
npx vitest run

# Run a proposal and print the Markdown comparison report
npm run simulate -- proposals/brandish-buff-20.json

# Dump spreadsheet formulas/values for translation reference
npm run dump-sheet
```

## Architecture

Three layers. Keep them cleanly separated.

### 1. Data Layer (`/data`)
Static game data stored as JSON files, version-controlled, human-readable and human-editable. This is the "current state of MapleRoyals."

Actual files:
- `skills/` — one file per class (`hero.json`, `drk.json`, `paladin.json`, `nl.json`, `bowmaster.json`, `sair.json`, `bucc.json`). Each contains mastery, stat mapping, SE crit config, and a `skills[]` array.
- `gear-templates/` — character builds at each funding tier (`hero-low.json`, `hero-high.json`, etc.). Include full gear breakdown, stats, buffs, and weapon info.
- `weapons.json` — weapon type slash/stab multipliers for the damage formula.
- `attack-speed.json` — effective speed tier → attack time lookup, keyed by skill category.
- `maple-warrior.json` — MW level → stat multiplier table.
- `gear-assumptions.md` — documents all baked-in assumptions in gear templates (buff availability, stat choices, funding philosophy, per-slot WATK breakdowns validated against forum guides).
- `source-sheet.xlsx` — original spreadsheet (read-only reference).

### 2. Simulation Engine (`/src/engine`)
Pure functions. No side effects, no I/O. Takes game data + a character build, outputs damage ranges and DPS.

**Implemented:**
- `damage.ts` — raw damage range (min/max), throwing star range (NL/Shad), range cap from damage cap, adjusted range for capped distributions.
- `buffs.ts` — Maple Warrior stat boost, Echo of Hero WATK bonus, total attack/stat aggregation.
- `attack-speed.ts` — weapon speed resolution (base speed + booster + SI), attack time lookup by skill category.
- `dps.ts` — full DPS pipeline: attack time → skill damage% → crit damage% → range caps → adjusted ranges → average damage → DPS. Uses `skill.weaponType` (not build) for weapon multiplier lookup, enabling weapon variants within the same class/tier. Supports built-in crit (additive with SE), throwing star formula (branches on `weaponType === 'Claw'`), and Shadow Partner (1.5× multiplier).
- `index.ts` — re-exports.

**Simulation features:**
- **comboGroup**: skills sharing a `comboGroup` string on `SkillEntry` have their DPS summed into a single row in simulation output (used for Buccaneer's Barrage + Dragon Strike multi-part rotation).

**Not yet implemented:**
- Training efficiency (kills/hr, EXP/hr on a given mob).

**Every function must be testable in isolation.** If you can't write a unit test for it, the function is doing too much.

### 3. Change Proposal Layer (`/src/proposals`)
A structured way to express balance changes and compute their impact.

A proposal is a JSON file that describes one or more changes:
```json
{
  "name": "Brandish +20 Base Power",
  "author": "ExampleUser",
  "description": "Increase Hero Brandish base power from 260 to 280.",
  "changes": [
    {
      "target": "hero.brandish-sword",
      "field": "basePower",
      "from": 260,
      "to": 280
    }
  ]
}
```

**Target format:** `className.skill-slug` where:
- `className` is the lowercase filename stem in `data/skills/` (e.g., `hero`, `drk`, `paladin`).
- `skill-slug` is the skill name lowercased with spaces/punctuation replaced by hyphens (e.g., `"Brandish (Sword)"` → `brandish-sword`).

**Valid fields:** any numeric property on a `SkillEntry` — typically `basePower`, `multiplier`, `hitCount`.

**`from` field:** optional but recommended. If present, the system validates that the current value matches, catching stale proposals.

The pipeline: `apply.ts` patches the skill data → `simulate.ts` runs DPS across all classes/tiers/scenarios → `compare.ts` produces before/after deltas → `markdown.ts` renders a Markdown report with per-scenario tables.

**Scenarios:** `ScenarioConfig` defines evaluation conditions (buff overrides, PDR). Proposals say *what changes*; scenarios say *under what conditions to evaluate*. PDR is applied as a post-calculation multiplier: `effectiveDps = dps * (1 - pdr)`.

## MapleRoyals Domain Knowledge

This is a v62-based MapleStory private server. Key differences from official GMS:
- Pre-Big Bang class balance and mechanics
- Fourth job skills are the endgame
- No potential system, no star force — funding is primarily via scrolling
- Attack speed is capped and the soft cap matters enormously for DPS
- Weapon Attack (WATK) and primary stat scaling differ by class

### Sources of Truth
1. **royals.ms forum** — primary source for MapleRoyals-specific mechanics, balance changes, and community-verified formulas. Treat forum-confirmed values as authoritative when they differ from generic v62 references.
2. **Source spreadsheet** (`data/source-sheet.xlsx`) — reference implementation being translated. Cross-check against forum when values seem uncertain.
3. **In-game verification** — ultimate authority when forum and spreadsheet disagree.

### Damage Formula (verified, from `damage.ts`)

**Standard (warriors):**
```
MaxDamage = floor((primaryStat * weaponMultiplier + secondaryStat) * totalAttack / 100)
MinDamage = floor((primaryStat * weaponMultiplier * 0.9 * mastery + secondaryStat) * totalAttack / 100)
```
Source: range calculator E18/E19. Weapon multipliers come from `weapons.json` (e.g., 4.6 for 2H Sword slash). Mastery is per-class (e.g., 0.6 for Hero).

**Throwing stars (NL/Shad):**
```
MaxDamage = floor(5.0 * LUK * totalAttack / 100)
MinDamage = floor(2.5 * LUK * totalAttack / 100)
```
Source: range calculator F18/F19. No weapon multiplier or secondary stat — flat LUK scaling.

### Crit Damage
Two formula variants exist, configured per class via `seCritFormula`:
- **`addBeforeMultiply`** (Hero, DrK, NL, Corsair, Buccaneer): `critDmg% = (basePower + totalCritBonus) * multiplier`
- **`addAfterMultiply`** (Paladin): `critDmg% = basePower * multiplier + totalCritBonus`

`totalCritBonus` = built-in crit bonus (e.g., TT +100) + SE bonus (+140 if active). Crit rate is also additive: built-in (e.g., TT 0.50) + SE (0.15), capped at 1.0.

### Key Classes

**Implemented (7 classes):**
- **Hero** — 2H Sword/Axe, Brandish (2-hit)
- **Dark Knight (DrK)** — Spear/Polearm, Crusher and Fury
- **Paladin** — 2H Sword/2H BW, Blast (4 variants: Holy and F/I/L Charge × Sword and BW)
- **Night Lord (NL)** — Claw, Triple Throw (3-hit, built-in 50% crit, Shadow Partner)
- **Bowmaster** — Bow, Hurricane (fixed 0.12s attack time) and Strafe (4-hit), built-in 40% crit from Critical Shot
- **Corsair (Sair)** — Gun, Battleship Cannon (4-hit, 0.60s) and Rapid Fire (Hurricane-style 0.12s). DEX primary, 3.6× weapon multiplier.
- **Buccaneer (Bucc)** — Knuckle, Demolition (8-hit, fixed 2.34s cycle) and Barrage + Dragon Strike (multi-part combo via `comboGroup`, fixed 2.34s cycle). STR primary, 4.8× weapon multiplier.

**Future expansion targets:**
- Arch Mage (Ice/Lightning) (magic)
- Bishop (magic, party utility)

### Funding Tiers
Balance is evaluated across funding levels. Current tiers:
- **low** — base/tradeable gear, no scrolling, reasonable potions
- **high** — well-scrolled endgame gear, Apple potion

A change that looks balanced at high funding might be wildly unbalanced at low funding, and vice versa. Always evaluate across tiers.

### Gear Template Assumptions
All templates assume a fully buffed party scenario: MW20, Sharp Eyes, Speed Infusion, Echo of Hero, and Booster (implicit). Low tier uses Heartstopper (60 WATK), high tier uses Onyx Apple (100 WATK). See `data/gear-assumptions.md` for the full per-slot breakdown, forum cross-references, and flagged concerns.

### Scenarios
Standard scenarios for comparison reports (all implemented):
- **Buffed** — all buffs on (MW, SE, SI, Echo, attack potions). Primary comparison metric.
- **Unbuffed** — no SE, Echo, SI, MW, or attack potion. Shows raw class power.
- **No-Echo** — all buffs except Echo of Hero. Shows Echo's DPS contribution.
- **Bossing (50% PDR)** — fully buffed with 50% Physical Damage Reduction applied. Shows sustained bossing DPS.
- **Training** (planned) — kills/hr and EXP/hr at a reference map/mob.

Multi-scenario support: `ScenarioConfig` can override buff flags and apply PDR. The CLI runs all 4 default scenarios. Reports render separate tables per scenario.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js via tsx
- **Testing:** Vitest
- **Build:** tsx (direct execution, no compile step)
- **Output format:** Markdown reports (can be rendered anywhere, diffed in git)
- **No framework.** This is a CLI tool and library first.

## Conventions

- Use descriptive variable names. `weaponAttack` not `wa`, `damagePercent` not `dmg`.
- No abbreviations in code that wouldn't be obvious to someone unfamiliar with MapleStory.
- All game data values must cite their source (spreadsheet cell, royals.ms forum thread, wiki, or in-game verification). Use a `"source"` field in JSON data files.
- Tests go next to the code they test (`damage.ts` → `damage.test.ts`).
- Keep functions small. If a function needs a comment explaining what a section does, that section should be its own function.
- **Gear templates** are named `{class}-{tier}.json` (e.g., `hero-low.json`, `drk-high.json`).
- **Skill slugs** are derived from skill names: lowercase, spaces/parentheses/commas replaced with hyphens, trailing hyphens stripped.
- **Auto-discovery**: the CLI auto-discovers classes and tiers by scanning `data/skills/` and `data/gear-templates/`. Adding a new class means adding its skill file + gear templates — no config changes needed.
- **SE crit formula**: each class's skill data specifies `seCritFormula` to handle the two known SE crit calculation variants.

## What NOT To Do

- **Don't over-engineer.** No ORMs, no databases, no microservices. This is a calculator, not a platform.
- **Don't build a web UI yet.** Get the engine right first. Reports as Markdown files are fine.
- **Don't try to model every class at once.** Start with 2-3 and expand.
- **Don't guess at game mechanics.** If something is unclear, ask the user or leave a TODO. Wrong formulas are worse than missing ones.
- **Don't abstract prematurely.** If only warriors use a mechanic, it's okay to have warrior-specific code. Generalize when a second class needs the same thing.

## File Structure
```
metra/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── data/
│   ├── source-sheet.xlsx        # original spreadsheet (read-only reference)
│   ├── gear-assumptions.md      # gear template assumptions documentation
│   ├── weapons.json             # weapon type multipliers
│   ├── attack-speed.json        # speed tier → attack time table
│   ├── maple-warrior.json       # MW level → stat multiplier
│   ├── skills/
│   │   ├── hero.json
│   │   ├── drk.json
│   │   ├── paladin.json
│   │   ├── nl.json
│   │   ├── bowmaster.json
│   │   ├── sair.json
│   │   └── bucc.json
│   └── gear-templates/
│       ├── hero-low.json
│       ├── hero-high.json
│       ├── drk-low.json
│       ├── drk-high.json
│       ├── paladin-low.json
│       ├── paladin-high.json
│       ├── sair-low.json
│       ├── sair-high.json
│       ├── bucc-low.json
│       └── bucc-high.json
├── proposals/                   # balance change proposals
│   ├── brandish-buff-20.json
│   └── warrior-rebalance.json
├── scripts/
│   └── dump-sheet.ts            # spreadsheet extraction utility
└── src/
    ├── index.ts                 # library entry point
    ├── cli.ts                   # CLI entry: load proposal → simulate → report
    ├── integration.test.ts      # end-to-end pipeline tests
    ├── data/
    │   ├── types.ts             # WeaponData, AttackSpeedData, ClassSkillData, CharacterBuild, etc.
    │   ├── loader.ts            # JSON data loaders (weapons, skills, gear templates)
    │   └── loader.test.ts
    ├── engine/
    │   ├── index.ts             # re-exports
    │   ├── damage.ts            # raw damage range, range cap, adjusted range
    │   ├── damage.test.ts
    │   ├── buffs.ts             # MW, Echo, total attack/stat calculation
    │   ├── buffs.test.ts
    │   ├── attack-speed.ts      # weapon speed resolution, attack time lookup
    │   ├── attack-speed.test.ts
    │   ├── dps.ts               # full DPS pipeline
    │   └── dps.test.ts
    ├── proposals/
    │   ├── types.ts             # Proposal, ProposalChange, ScenarioResult, DeltaEntry, ComparisonResult
    │   ├── apply.ts             # apply proposal changes to skill data
    │   ├── apply.test.ts
    │   ├── simulate.ts          # run DPS across all classes × tiers × skills, comboGroup aggregation
    │   ├── compare.ts           # before/after comparison with deltas
    │   └── compare.test.ts
    ├── report/
    │   ├── markdown.ts          # render ComparisonResult as Markdown table
    │   └── markdown.test.ts
    └── sheets/
        ├── extract.ts           # read formulas/values from xlsx
        └── extract.test.ts
```
