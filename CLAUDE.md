# Royals Balance Simulator

## Project Purpose

This project makes Royals class balance *legible*. It translates a sprawling Google Sheet calculator into a structured, testable codebase so that proposed balance changes can be expressed as diffs, simulated, and shared as reproducible reports. The audience is Royals staff, contributors, and community members debating balance.

The north star: anyone should be able to write a small change file ("buff Brandish from 260 to 280"), run a command, and get a clear before/after comparison across classes and scenarios.

For the long-term roadmap (public launch, community features, advanced analysis), see `ROADMAP.md`.

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

# Show current DPS rankings (baseline, no proposal)
npm run simulate

# Run a proposal and print the Markdown comparison report
npm run simulate -- proposals/brandish-buff-20.json

# Run baseline with balance audit (outlier detection)
npm run simulate -- --audit

# Dump spreadsheet formulas/values for translation reference
npm run dump-sheet

# Run the web app locally
cd web && npm run dev

# Set up git hooks (once, after cloning)
npm run setup
```

The pre-commit hook runs unit tests, type-checks the engine, and type-checks the web app. To bypass it in an emergency: `git commit --no-verify`.

## Architecture

Five layers. Keep them cleanly separated.

### 1. Data Layer (`/data`)
Static game data stored as JSON files, version-controlled, human-readable and human-editable. This is the "current state of Royals."

Actual files:
- `skills/` — one file per class (`hero.json`, `hero-axe.json`, `drk.json`, `paladin.json`, `nl.json`, `bowmaster.json`, `marksman.json`, `sair.json`, `bucc.json`, `shadower.json`). Each contains mastery, stat mapping, SE crit config, and a `skills[]` array.
- `gear-templates/` — character builds at each funding tier (`hero-low.json`, `hero-high.json`, etc.). Include full gear breakdown, stats, buffs, and weapon info.
- `weapons.json` — weapon type slash/stab multipliers for the damage formula.
- `attack-speed.json` — effective speed tier → attack time lookup, keyed by skill category.
- `mw.json` — MW level → stat multiplier table.
- `gear-assumptions.md` — documents all baked-in assumptions in gear templates (buff availability, stat choices, funding philosophy, per-slot WATK breakdowns validated against forum guides).
- `source-sheet.xlsx` — original spreadsheet (read-only reference).
- `references/` — extracted forum knowledge organized by topic. Check these BEFORE web-searching royals.ms. When adding forum-sourced data: add to the relevant file with source URL, access date, and which data files it relates to.

### 2. Simulation Engine (`/src/engine`)
Pure functions. No side effects, no I/O. Takes game data + a character build, outputs damage ranges and DPS.

**Implemented:**
- `damage.ts` — raw damage range (min/max), throwing star range (NL/Shad), range cap from damage cap, adjusted range for capped distributions.
- `buffs.ts` — MW stat boost, Echo of Hero WATK bonus, total attack/stat aggregation.
- `attack-speed.ts` — weapon speed resolution (base speed + booster + SI), attack time lookup by skill category.
- `dps.ts` — full DPS pipeline: attack time → skill damage% → crit damage% → range caps → adjusted ranges → average damage → DPS. Uses `skill.weaponType` (not build) for weapon multiplier lookup, enabling weapon variants within the same class/tier. Supports built-in crit (additive with SE), throwing star formula (branches on `weaponType === 'Claw'`), Shadow Partner (1.5× multiplier), and `fixedDamage` (bypasses damage formula for skills like Snipe).
- `index.ts` — re-exports.

**Simulation features:**
- **comboGroup**: skills sharing a `comboGroup` string on `SkillEntry` have their DPS summed into a single row in simulation output (used for Buccaneer's Barrage + Demolition and Shadower's BStep + Assassinate). All sub-skills in a combo use the total cycle time as their speed category so that sum-of-DPS equals rotation DPS.

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

The pipeline: `apply.ts` patches the skill data → `simulate.ts` runs DPS across all classes/tiers/scenarios → `compare.ts` produces before/after deltas with rank tracking → `markdown.ts` or `bbcode.ts` renders a report. When no proposal is given, the CLI runs in **baseline mode**: it simulates all classes and renders a ranked DPS table with an ASCII bar chart.

**Scenarios:** `ScenarioConfig` defines evaluation conditions (buff overrides, PDR). Proposals say *what changes*; scenarios say *under what conditions to evaluate*. PDR is applied as a post-calculation multiplier: `effectiveDps = dps * (1 - pdr)`.

### 4. Balance Audit (`/src/audit`)
Analyzes simulation results and flags statistical outliers. Pure functions, no I/O.

- `analyze.ts` — `analyzeBalance(results: ScenarioResult[])` → `BalanceAudit`. Groups results by (scenario, tier), computes mean/stdDev/spread, flags skills >1.5σ from group mean as outliers, and detects unusual tier sensitivity (high/low DPS ratio outliers).
- `format.ts` — `formatAuditReport(audit: BalanceAudit)` → Markdown string with outlier, tier sensitivity, and group summary tables.
- `types.ts` — `BalanceAudit`, `OutlierEntry`, `TierSensitivity`, `GroupSummary`.

CLI: `npm run simulate -- --audit` appends the audit report after baseline rankings.

### 5. Web Interface (`/web`)
React + Vite single-page app with its own `package.json`. Consumes the engine via `src/core.ts` (a browser-safe re-export that excludes fs-based loaders).

- Dashboard with baseline DPS rankings
- Interactive proposal builder (create, edit, simulate)
- Comparison results view with per-scenario tables
- URL sharing via lz-string compressed proposals in URL hash (`#p=<compressed>`)
- BBCode export for royals.ms forum posts (`src/report/bbcode.ts`)
- Playwright e2e tests in `web/e2e/`

## Royals Domain Knowledge

This is a v62-based Royals private server. Key differences from official GMS:
- Pre-Big Bang class balance and mechanics
- Fourth job skills are the endgame
- No potential system, no star force — funding is primarily via scrolling
- Attack speed is capped and the soft cap matters enormously for DPS
- Weapon Attack (WATK) and primary stat scaling differ by class

### Sources of Truth
1. **royals.ms forum** — primary source for Royals-specific mechanics, balance changes, and community-verified formulas. Treat forum-confirmed values as authoritative when they differ from generic v62 references.
2. **Source spreadsheet** (`data/source-sheet.xlsx`) — reference implementation being translated. Cross-check against forum when values seem uncertain.
3. **In-game verification** — ultimate authority when forum and spreadsheet disagree.

### Damage Formula (verified, from `damage.ts`)

**Standard (warriors, archers, Shadower):**
```
MaxDamage = floor((primaryStat * weaponMultiplier + secondaryStat) * totalAttack / 100)
MinDamage = floor((primaryStat * weaponMultiplier * 0.9 * mastery + secondaryStat) * totalAttack / 100)
```
Source: range calculator E18/E19. Weapon multipliers come from `weapons.json` (e.g., 4.6 for 2H Sword slash, 3.6 for Dagger). Mastery is per-class (e.g., 0.6 for Hero). `secondaryStat` can be an array (e.g., Shadower uses `["STR", "DEX"]` — both are summed).

**Throwing stars (NL):**
```
MaxDamage = floor(5.0 * LUK * totalAttack / 100)
MinDamage = floor(2.5 * LUK * totalAttack / 100)
```
Source: range calculator F18/F19. No weapon multiplier or secondary stat — flat LUK scaling.

### Crit Damage
Two formula variants exist, configured per class via `seCritFormula`:
- **`addBeforeMultiply`** (Hero, DrK, NL, Bowmaster, Marksman, Shadower, Corsair, Buccaneer): `critDmg% = (basePower + totalCritBonus) * multiplier`
- **`addAfterMultiply`** (Paladin): `critDmg% = basePower * multiplier + totalCritBonus`

`totalCritBonus` = built-in crit bonus (e.g., TT +100) + SE bonus (+140 if active). Crit rate is also additive: built-in (e.g., TT 0.50) + SE (0.15), capped at 1.0.

### Key Classes

**Implemented (10 classes):**
- **Hero** — 2H Sword, Brandish (2-hit)
- **Hero (Axe)** — 2H Axe, Brandish (2-hit). Separate skill file and gear templates. Weapon speed 6 (no speed-5 2H Axe exists), 4.8× multiplier. Buffed DPS matches Sword (SI resolves both to speed 2); unbuffed Axe is slower.
- **Dark Knight (DrK)** — Spear, Crusher
- **Paladin** — 2H Sword/2H BW, Blast (4 variants: Holy and F/I/L Charge × Sword and BW)
- **Night Lord (NL)** — Claw, Triple Throw (3-hit, built-in 50% crit, Shadow Partner)
- **Bowmaster** — Bow, Hurricane (fixed 0.12s attack time) and Strafe (4-hit), built-in 40% crit from Critical Shot
- **Marksman (MM)** — Crossbow, Snipe + Strafe weave rotation (combo via `comboGroup`: 1 Snipe per 5s cycle + N Strafes as filler) and standalone Strafe (4-hit). Snipe has ~5s effective cooldown (4s programmed + ~1s server tick). DEX primary, Crossbow 3.6× multiplier, 0.9 mastery, 40% crit from Critical Shot. Shares gear with Bowmaster (Crossbow Expert +10 WATK).
- **Corsair (Sair)** — Gun, Battleship Cannon (4-hit, 0.60s) and Rapid Fire (Hurricane-style 0.12s). DEX primary, 3.6× weapon multiplier.
- **Buccaneer (Bucc)** — Knuckle, Demolition (8-hit, fixed 2.34s cycle) and Barrage + Demolition (multi-part combo via `comboGroup`, fixed 4.04s cycle). STR primary, 4.8× weapon multiplier.
- **Shadower** — Dagger + Shield, Boomerang Step + Assassinate 30 (combo via `comboGroup`, 2.31s cycle) and Savage Blow (6-hit standalone). LUK primary, STR+DEX secondary (array `secondaryStat`), Dagger 3.6× multiplier, standard damage formula, Shadow Partner, no built-in crit.

**Future expansion targets:**
- Arch Mage (Ice/Lightning) (magic)
- Bishop (magic, party utility)

### Funding Tiers
Balance is evaluated across funding levels. Current tiers:
- **low** — base/tradeable gear, no scrolling, Stopper potion (~lv160-170)
- **mid** — reasonable scrolling, Stopper potion (~lv185). C/G/S 17/14/10.
- **high** — well-scrolled endgame gear, Apple potion (lv200). C/G/S 19/17/13.

A change that looks balanced at high funding might be wildly unbalanced at low funding, and vice versa. Always evaluate across tiers.

### Gear Template Assumptions
All templates assume a fully buffed party scenario: MW20, Sharp Eyes, Speed Infusion, Echo of Hero, and Booster (implicit). Low and mid tiers use Heartstopper (60 WATK), high tier uses Onyx Apple (100 WATK). Mage low/mid tiers use Lollipop (45 MATK). See `data/gear-assumptions.md` for the full per-slot breakdown, forum cross-references, and flagged concerns.

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
- **Web:** React + Vite SPA (in `web/`, separate package.json)
- **E2E testing:** Playwright (web app)
- The engine and CLI are framework-free. The web app is the only layer that uses React.

## Conventions

- Use descriptive variable names. `weaponAttack` not `wa`, `damagePercent` not `dmg`.
- No abbreviations in code that wouldn't be obvious to someone unfamiliar with Royals.
- All game data values must cite their source (spreadsheet cell, royals.ms forum thread, wiki, or in-game verification). Use a `"source"` field in JSON data files.
- Tests go next to the code they test (`damage.ts` → `damage.test.ts`).
- Keep functions small. If a function needs a comment explaining what a section does, that section should be its own function.
- **Gear templates** are named `{class}-{tier}.json` (e.g., `hero-low.json`, `drk-high.json`).
- **Skill slugs** are derived from skill names: lowercase, spaces/parentheses/commas replaced with hyphens, trailing hyphens stripped.
- **Auto-discovery**: the CLI auto-discovers classes and tiers by scanning `data/skills/` and `data/gear-templates/`. Adding a new class means adding its skill file + gear templates — no config changes needed.
- **SE crit formula**: each class's skill data specifies `seCritFormula` to handle the two known SE crit calculation variants.

## What NOT To Do

- **Don't over-engineer.** No ORMs, no databases, no microservices. This is a calculator, not a platform.
- **Don't over-complicate the web app.** Keep it a thin presentation layer over the engine. Business logic belongs in `src/engine/`, not in React components.
- **Don't try to model every class at once.** Start with 2-3 and expand.
- **Don't guess at game mechanics.** If something is unclear, ask the user or leave a TODO. Wrong formulas are worse than missing ones.
- **Don't abstract prematurely.** If only warriors use a mechanic, it's okay to have warrior-specific code. Generalize when a second class needs the same thing.

## File Structure
```
metra/
├── CLAUDE.md
├── ROADMAP.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── data/
│   ├── source-sheet.xlsx        # original spreadsheet (read-only reference)
│   ├── gear-assumptions.md      # gear template assumptions documentation
│   ├── weapons.json             # weapon type multipliers
│   ├── attack-speed.json        # speed tier → attack time table
│   ├── mw.json       # MW level → stat multiplier
│   ├── skills/
│   │   ├── hero.json
│   │   ├── hero-axe.json
│   │   ├── drk.json
│   │   ├── paladin.json
│   │   ├── nl.json
│   │   ├── bowmaster.json
│   │   ├── marksman.json
│   │   ├── sair.json
│   │   ├── bucc.json
│   │   └── shadower.json
│   └── gear-templates/          # {class}-{tier}.json — low, mid, high per class
│       ├── hero-{low,mid,high}.json
│       ├── hero-axe-{low,mid,high}.json
│       ├── drk-{low,mid,high}.json
│       ├── paladin-{low,mid,high}.json
│       ├── nl-{low,mid,high}.json
│       ├── bowmaster-{low,mid,high}.json
│       ├── marksman-{low,mid,high}.json
│       ├── sair-{low,mid,high}.json
│       ├── bucc-{low,mid,high}.json
│       ├── shadower-{low,mid,high}.json
│       ├── archmage-il-{low,mid,high}.json
│       └── bishop-{low,mid,high}.json
├── proposals/                   # balance change proposals
│   ├── brandish-buff-20.json
│   ├── paladin-blast-multiplier.json
│   └── warrior-rebalance.json
├── scripts/
│   └── dump-sheet.ts            # spreadsheet extraction utility
├── src/
│   ├── index.ts                 # library entry point
│   ├── core.ts                  # browser-safe re-exports (no fs loaders)
│   ├── cli.ts                   # CLI entry: baseline rankings or proposal comparison
│   ├── integration.test.ts      # end-to-end pipeline tests
│   ├── audit/
│   │   ├── index.ts             # re-exports
│   │   ├── types.ts             # BalanceAudit, OutlierEntry, TierSensitivity, GroupSummary
│   │   ├── analyze.ts           # analyzeBalance() — outlier detection + tier sensitivity
│   │   ├── analyze.test.ts
│   │   └── format.ts            # formatAuditReport() — Markdown rendering
│   ├── data/
│   │   ├── types.ts             # WeaponData, AttackSpeedData, ClassSkillData, CharacterBuild, etc.
│   │   ├── loader.ts            # JSON data loaders + discoverClassesAndTiers()
│   │   └── loader.test.ts
│   ├── engine/
│   │   ├── index.ts             # re-exports
│   │   ├── damage.ts            # raw damage range, range cap, adjusted range
│   │   ├── damage.test.ts
│   │   ├── buffs.ts             # MW, Echo, total attack/stat calculation
│   │   ├── buffs.test.ts
│   │   ├── attack-speed.ts      # weapon speed resolution, attack time lookup
│   │   ├── attack-speed.test.ts
│   │   ├── dps.ts               # full DPS pipeline
│   │   └── dps.test.ts
│   ├── proposals/
│   │   ├── types.ts             # Proposal, ProposalChange, ScenarioResult, DeltaEntry (with ranks), ComparisonResult
│   │   ├── apply.ts             # apply proposal changes to skill data
│   │   ├── apply.test.ts
│   │   ├── simulate.ts          # run DPS across all classes × tiers × skills, comboGroup aggregation
│   │   ├── compare.ts           # before/after comparison with deltas and rank tracking
│   │   └── compare.test.ts
│   ├── report/
│   │   ├── markdown.ts          # render comparison and baseline reports as Markdown
│   │   ├── markdown.test.ts
│   │   ├── bbcode.ts            # render reports as BBCode for royals.ms forum
│   │   ├── bbcode.test.ts
│   │   ├── ascii-chart.ts       # horizontal ASCII bar chart for terminal output
│   │   └── ascii-chart.test.ts
│   └── sheets/
│       ├── extract.ts           # read formulas/values from xlsx
│       └── extract.test.ts
└── web/                         # React + Vite SPA (separate package.json)
    ├── package.json
    ├── vite.config.ts
    ├── playwright.config.ts
    ├── index.html
    ├── src/                     # React components, data bundle, styles
    └── e2e/                     # Playwright end-to-end tests
```
