# MapleRoyals Balance Simulator

## Project Purpose

This project makes MapleStory class balance *legible*. It translates a sprawling Google Sheet calculator into a structured, testable codebase so that proposed balance changes can be expressed as diffs, simulated, and shared as reproducible reports. The audience is MapleRoyals staff, contributors, and community members debating balance.

The north star: anyone should be able to write a small change file ("buff Brandish from 300% to 315%"), run a command, and get a clear before/after comparison across classes and scenarios.

## Source Spreadsheet

The project is being translated from an existing Google Sheets calculator (exported as `.xlsx` in `/data/source-sheet.xlsx`).

**Translation rules:**
- When translating formulas, always extract both the formula string AND the computed value.
- Write tests that assert the code reproduces the spreadsheet's output values.
- Ask the user to clarify the meaning of any cell ranges, sheet names, or magic numbers that aren't self-evident. Don't guess silently.
- Expect cross-sheet references, nested IFs, and implicit assumptions. Flag anything that smells like a hidden assumption.
- Translate one calculation path at a time. Don't try to do the whole sheet at once.

## Architecture

Three layers. Keep them cleanly separated.

### 1. Data Layer (`/data`)
Static game data: classes, skills, weapons, mobs, bosses, maps. Stored as JSON files, version-controlled, human-readable and human-editable. This is the "current state of MapleRoyals."

Key files:
- `classes/` — one file per class (e.g., `hero.json`, `night-lord.json`)
- `weapons/` — weapon types with speed categories and multipliers
- `mobs/` — relevant training mobs with HP, EXP, elemental weaknesses
- `bosses/` — boss HP, PDR, elemental properties
- `skills/` — skill data keyed by class and job advancement

### 2. Simulation Engine (`/src/engine`)
Pure functions. No side effects, no I/O. Takes game data + a character build, outputs damage ranges, DPS, kill thresholds, training rates.

This layer implements:
- The v62 GMS damage formula (MapleRoyals variant)
- Skill damage calculation (including multi-hit, elemental multipliers)
- DPS over time (accounting for attack speed, buff durations, cooldowns)
- Training efficiency (kills/hr on a given mob, EXP/hr)
- Bossing DPS (sustained damage against a boss profile)

**Every function must be testable in isolation.** If you can't write a unit test for it, the function is doing too much.

### 3. Change Proposal Layer (`/src/proposals`)
A structured way to express balance changes and compute their impact.

A proposal is a JSON/YAML file that describes one or more changes:
```yaml
name: "Brandish Buff Proposal"
author: "PlayerName"
changes:
  - target: skills.hero.brandish
    field: damage_percent
    from: 300    # optional, for validation
    to: 315
```

The system applies the change to the game data, re-runs simulations across a standard set of scenarios, and produces a comparison report.

## MapleRoyals Domain Knowledge

This is a v62-based MapleStory private server. Key differences from official GMS:
- Pre-Big Bang class balance and mechanics
- Fourth job skills are the endgame
- No potential system, no star force — funding is primarily via scrolling
- Attack speed is capped and the soft cap matters enormously for DPS
- Weapon Attack (WATK) and primary stat scaling differ by class

### Damage Formula (v62 baseline)
```
MaxDamage = PrimaryStat * 4 + SecondaryStat) / 100 * WATK * SkillDamage% * Mastery adjustments
MinDamage = uses Mastery to compress the range
```
The exact formula must be verified against the source spreadsheet. There are per-weapon-type multipliers and class-specific quirks. Do not hardcode a formula from memory — derive it from the sheet.

### Key Classes to Support First
Start with a representative spread:
- **Hero** (melee physical, sword/axe)
- **Night Lord** (ranged physical, stars)
- **Arch Mage (Ice/Lightning)** (magic)
- **Bowmaster** (ranged physical, bow)
- **Bishop** (magic, party utility — interesting because value is not just DPS)

Expand from there once the core loop works.

### Funding Tiers
Balance must be evaluated across funding levels. Use these tiers:
- **Clean** — no scrolling, base equips, tradeable gear only
- **Average** — reasonable scrolling, some good gear, attainable for active players
- **Godly** — near-perfect scrolls, endgame gear, high investment

A change that looks balanced at godly funding might be wildly unbalanced at clean funding, and vice versa. Always evaluate across tiers.

### Scenarios
Standard scenarios for comparison reports:
- **Raw DPS** — single target, no buffs, just the formula
- **Buffed DPS** — with class self-buffs + common party buffs (MW, SE, SI)
- **Training (Petri dish)** — kills/hr and EXP/hr at a reference map/mob
- **Bossing (Horntail)** — sustained DPS against a tanky boss with PDR

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js
- **Testing:** Vitest
- **Build:** tsup or plain tsc
- **Output format:** Markdown reports (can be rendered anywhere, diffed in git)
- **No framework for now.** This is a CLI tool and library first. A web UI is a future nice-to-have, not a priority.

## Conventions

- Use descriptive variable names. `weaponAttack` not `wa`, `damagePercent` not `dmg`.
- No abbreviations in code that wouldn't be obvious to someone unfamiliar with MapleStory.
- All game data values must cite their source (spreadsheet cell, wiki, or in-game verification).
- Tests go next to the code they test (`engine.ts` → `engine.test.ts`).
- Keep functions small. If a function needs a comment explaining what a section does, that section should be its own function.

## What NOT To Do

- **Don't over-engineer.** No ORMs, no databases, no microservices. This is a calculator, not a platform.
- **Don't build a web UI yet.** Get the engine right first. Reports as Markdown files are fine.
- **Don't try to model every class at once.** Start with 2-3 and expand.
- **Don't guess at game mechanics.** If something is unclear, ask the user or leave a TODO. Wrong formulas are worse than missing ones.
- **Don't abstract prematurely.** If only warriors use a mechanic, it's okay to have warrior-specific code. Generalize when a second class needs the same thing.

## File Structure
```
maple-balance/
├── CLAUDE.md              # this file
├── data/
│   ├── source-sheet.xlsx  # original spreadsheet (read-only reference)
│   ├── classes/           # class definitions as JSON
│   ├── skills/            # skill data as JSON
│   ├── weapons/           # weapon type data
│   ├── mobs/              # mob data for training calcs
│   └── bosses/            # boss data for bossing calcs
├── src/
│   ├── engine/            # pure calculation functions
│   │   ├── damage.ts      # core damage formula
│   │   ├── dps.ts         # DPS over time
│   │   ├── training.ts    # training efficiency
│   │   └── bossing.ts     # bossing scenarios
│   ├── proposals/         # change proposal system
│   │   ├── types.ts       # proposal format types
│   │   ├── apply.ts       # apply a proposal to game data
│   │   └── compare.ts     # generate before/after comparison
│   ├── sheets/            # spreadsheet translation utilities
│   │   └── extract.ts     # read formulas/values from xlsx
│   └── report/            # report generation
│       └── markdown.ts    # render comparison as Markdown
├── proposals/             # actual balance change proposals
│   └── example.yaml
├── reports/               # generated comparison reports
├── tests/                 # test fixtures and integration tests
└── package.json
```
