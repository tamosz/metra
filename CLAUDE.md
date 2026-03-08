# Royals Balance Simulator

## Git Workflow

Always work on a branch and raise a PR — never push directly to main.

Before merging a PR, run the full test suite locally (`npx vitest run` at root and in `web/`) and confirm it passes. Don't rely on CI catching things after merge.

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

# Run baseline with training scenario (6 stacked mobs)
npm run simulate -- --targets 6

# Run a proposal with training scenario
npm run simulate -- --targets 6 proposals/brandish-buff-20.json

# Run baseline with knockback modeling
npm run simulate -- --kb

# Run baseline with custom boss parameters
npm run simulate -- --kb --kb-interval 2.0 --kb-accuracy 270

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
- `skills/` — one file per class (`hero.json`, `hero-axe.json`, `dark-knight.json`, `paladin.json`, `paladin-bw.json`, `night-lord.json`, `bowmaster.json`, `marksman.json`, `sair.json`, `bucc.json`, `shadower.json`, `archmage-il.json`, `archmage-fp.json`, `bishop.json`). Each contains mastery, stat mapping, SE crit config, and a `skills[]` array.
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
- `damage.ts` — raw damage range (min/max), throwing star range (Night Lord/Shad), range cap from damage cap, adjusted range for capped distributions.
- `buffs.ts` — MW stat boost, Echo of Hero WATK bonus, total attack/stat aggregation.
- `attack-speed.ts` — weapon speed resolution (base speed + booster + SI), attack time lookup by skill category.
- `dps.ts` — full DPS pipeline: attack time → skill damage% → crit damage% → range caps → adjusted ranges → average damage → DPS. Uses `skill.weaponType` (not build) for weapon multiplier lookup, enabling weapon variants within the same class/tier. Supports built-in crit (additive with SE), throwing star formula (branches on `weaponType === 'Claw'`), Shadow Partner (1.5× multiplier), `fixedDamage` (bypasses damage formula for skills like Snipe), and `elementModifier` (factored into range cap so the 199,999 per-line cap applies to final damage including element).
- `build-dps.ts` — build-level DPS calculation (ties together class data, gear template, and engine).
- `knockback.ts` — KB uptime modeling (Stance, Shadow Shifter, boss attack interval/accuracy).
- `marginal.ts` — marginal gain analysis (WATK/stat impact on DPS).
- `index.ts` — re-exports.

**Simulation features:**
- **comboGroup**: skills sharing a `comboGroup` string on `SkillEntry` have their DPS summed into a single row in simulation output (used for Buccaneer's Barrage + Demolition, Shadower's BStep + Assassinate, Marksman Snipe + Strafe, and Bucc's Snatch + Dragon Strike). All sub-skills in a combo use the total cycle time as their speed category so that sum-of-DPS equals rotation DPS.
- **mixedRotations**: time-weighted skill blends on `ClassSkillData` (e.g., Corsair's Practical Bossing: 80/20 Cannon/RF split). Unlike comboGroups (fixed rotation cycles), these are estimates for variable-uptime scenarios.
- **maxTargets**: optional field on `SkillEntry` (default 1). Combined with `targetCount` on `ScenarioConfig`, enables multi-target training simulation: `effectiveTargets = min(skill.maxTargets, scenario.targetCount)`, applied as a post-calculation multiplier before combo aggregation. CLI: `--targets N`. Web: target count input in the Dashboard filter bar.
- **elementVariantGroup**: skills sharing a group are compared after DPS calculation; only the highest-DPS variant survives in output (e.g., Paladin Holy Blast vs Charge Blast — auto-picks best element for current scenario).
- **knockbackRecovery**: per-skill override for KB recovery time. 0 for i-frame skills (Demolition, Barrage) that can't be interrupted.
- **headline/hidden**: skill visibility controls. `headline: false` skills only show when "show all skills" is toggled on. `hidden: true` skills are excluded from output entirely.

**Not yet implemented:**
- Training efficiency (kills/hr, EXP/hr on a given mob — AoE modeling done via `maxTargets`, still needs mob data).

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
- `className` is the lowercase filename stem in `data/skills/` (e.g., `hero`, `dark-knight`, `paladin`).
- `skill-slug` is the skill name lowercased with spaces/punctuation replaced by hyphens (e.g., `"Brandish (Sword)"` → `brandish-sword`).

**Valid fields:** any numeric property on a `SkillEntry` — typically `basePower`, `multiplier`, `hitCount`, `maxTargets`.

**`from` field:** optional but recommended. If present, the system validates that the current value matches, catching stale proposals.

The pipeline: `apply.ts` patches the skill data → `simulate.ts` runs DPS across all classes/tiers/scenarios → `compare.ts` produces before/after deltas with rank tracking → `markdown.ts` or `bbcode.ts` renders a report. When no proposal is given, the CLI runs in **baseline mode**: it simulates all classes and renders a ranked DPS table with an ASCII bar chart.

**Simulation controls:** `ScenarioConfig` defines evaluation conditions (buff overrides, element modifiers, targetCount, knockback parameters). Conditions are composed from individual toggles rather than predefined scenario presets. `targetCount` enables multi-target training simulation.

### 4. Balance Audit (`/src/audit`)
Analyzes simulation results and flags statistical outliers. Pure functions, no I/O.

- `analyze.ts` — `analyzeBalance(results: ScenarioResult[])` → `BalanceAudit`. Groups results by (scenario, tier), computes mean/stdDev/spread, flags skills >1.5σ from group mean as outliers, and detects unusual tier sensitivity (high/low DPS ratio outliers).
- `format.ts` — `formatAuditReport(audit: BalanceAudit)` → Markdown string with outlier, tier sensitivity, and group summary tables.
- `types.ts` — `BalanceAudit`, `OutlierEntry`, `TierSensitivity`, `GroupSummary`.

CLI: `npm run simulate -- --audit` appends the audit report after baseline rankings.

### 5. Web Interface (`/web`)
React + Vite single-page app with its own `package.json`. Consumes the engine via `src/core.ts` (a browser-safe re-export that excludes fs-based loaders). Deployed to Vercel (`vercel.json` config in root).

- Dashboard with baseline DPS rankings and composable filter controls (buff toggles, element toggles, KB toggle with boss parameters, target count, damage cap toggle)
- Skill detail drilldown — click a ranking row to see DPS breakdown by tier, crit contribution, damage range, attack time, cap loss, Shadow Partner status
- Build explorer — gear/stat overrides with sliders/inputs, real-time DPS recalc, marginal gain table ("what to upgrade next?"), per-slot template editor with GitHub issue integration
- Interactive proposal builder (create, edit, simulate) with comparison chart overlay and rank bump chart
- Formula reference page — full documentation of all engine formulas with LaTeX rendering
- URL sharing via lz-string compressed proposals (`#p=`), builds (`#b=`), and comparisons (`#c=`)
- BBCode export for royals.ms forum posts (`src/report/bbcode.ts`)
- CGS editor — per-tier Cape/Glove/Shoe WATK overrides with saved presets via localStorage
- Per-class saved builds — store and recall custom character configurations via localStorage
- Support class disclaimer — contextual note for Bishop/Archmage I/L in rankings
- Self-explanatory tier assumptions — collapsible breakdown of what each tier includes
- Game terminology tooltips via `utils/game-terms.ts`
- Error boundaries with recovery
- Mobile-responsive layout
- Playwright e2e tests in `web/e2e/`

## Royals Domain Knowledge

This is a v62-based Royals private server. Key differences from official GMS:
- Pre-Big Bang class balance and mechanics
- Fourth job skills are the endgame
- No potential system, no star force — funding is primarily via scrolling
- Attack speed is capped and the soft cap matters enormously for DPS
- Weapon Attack (WATK) and primary stat scaling differ by class

### Sources of Truth
1. **[MapleRoyals Skill Library](https://royals.ms/forum/threads/mapleroyals-skill-library.209540/)** — primary source for skill data (damage%, hit count, MP cost, etc.). Data extracted directly from game files by community member nut. Treat as authoritative for raw skill values.
2. **royals.ms forum** — primary source for Royals-specific mechanics, balance changes, and community-verified formulas. Treat forum-confirmed values as authoritative when they differ from generic v62 references.
3. **Source spreadsheet** (`data/source-sheet.xlsx`) — reference implementation being translated. Cross-check against forum when values seem uncertain.
4. **In-game verification** — ultimate authority when other sources disagree.

### Game Mechanics

Detailed formulas (damage, crit, attack speed, KB) are in `data/references/`. Read those files when working on engine code — don't rely on summaries here.

Key design points:
- Three damage formulas: standard (physical), throwing star (Night Lord), magic. Dispatched via `classData.damageFormula`.
- Three SE crit formula variants: `addBeforeMultiply` (default), `multiplicative` (mages), `scaleOnBase` (Arrow Bomb). Set per-class, overridable per-skill.
- `secondaryStat` can be an array (e.g., Shadower uses `["STR", "DEX"]`).

### Classes

14 classes implemented. Per-class details (weapons, multipliers, skill data, combo rotations) live in `data/skills/*.json` and `data/references/class-guides.md`. Classes with weapon variants (Hero/Axe, Paladin/BW) have separate skill files and gear templates.

### Funding & Gear

Four tiers: low, mid, high, perfect. A change that looks balanced at one tier may be wildly unbalanced at another — always evaluate across tiers. Templates assume full party buffs (MW20, SE, SI, Echo, Booster). See `data/gear-assumptions.md` for the full breakdown.

### Simulation Controls

All conditions are composed from individual toggles (not predefined scenarios):
- **Buff toggles** — SE, Echo, SI, MW, Attack Potion
- **Element toggles** (web only) — interact with per-line 199,999 damage cap
- **KB toggle** — boss attack interval/accuracy modeling. CLI: `--kb`
- **Target count** — multi-target training. CLI: `--targets N`

`ScenarioConfig` is built on-the-fly from active toggles.

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
- **Gear templates** are named `{class}-{tier}.json` (e.g., `hero-low.json`, `dark-knight-high.json`).
- **Skill slugs** are derived from skill names: lowercase, spaces/parentheses/commas replaced with hyphens, trailing hyphens stripped.
- **Auto-discovery**: the CLI auto-discovers classes and tiers by scanning `data/skills/` and `data/gear-templates/`. Adding a new class means adding its skill file + gear templates — no config changes needed.
- **SE crit formula**: each class's skill data specifies `seCritFormula` to handle the three known SE crit calculation variants (`addBeforeMultiply`, `multiplicative`, `scaleOnBase`). Can also be overridden per-skill.

## What NOT To Do

- **Don't over-engineer.** No ORMs, no databases, no microservices. This is a calculator, not a platform.
- **Don't over-complicate the web app.** Keep it a thin presentation layer over the engine. Business logic belongs in `src/engine/`, not in React components.
- **Don't guess at game mechanics.** If something is unclear, ask the user or leave a TODO. Wrong formulas are worse than missing ones.
- **Don't abstract prematurely.** If only one class uses a mechanic, it's okay to have class-specific code. Generalize when a second class needs the same thing.

## File Structure
```
metra/
├── CLAUDE.md
├── README.md
├── ROADMAP.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── vercel.json
├── data/
│   ├── source-sheet.xlsx        # original spreadsheet (read-only reference)
│   ├── gear-assumptions.md      # gear template assumptions documentation
│   ├── tier-defaults.json       # standardized potion + CGS values per tier
│   ├── weapons.json             # weapon type multipliers
│   ├── attack-speed.json        # speed tier → attack time table
│   ├── mw.json                  # MW level → stat multiplier
│   ├── skills/                  # one file per class (14 classes)
│   ├── gear-templates/          # {class}-{tier}.json — low, mid, high, perfect per class
│   └── references/              # extracted forum knowledge by topic
├── docs/
│   ├── audit/                   # gear template comparison reports
│   └── plans/                   # implementation plans (design + execution)
├── proposals/                   # balance change proposals
├── scripts/
│   └── dump-sheet.ts            # spreadsheet extraction utility
├── src/
│   ├── index.ts                 # library entry point
│   ├── core.ts                  # browser-safe re-exports (no fs loaders)
│   ├── cli.ts                   # CLI entry: baseline rankings or proposal comparison
│   ├── audit/                   # balance audit (outlier detection, tier sensitivity)
│   ├── data/
│   │   ├── types.ts             # WeaponData, ClassSkillData, CharacterBuild, SkillEntry, MixedRotation, etc.
│   │   ├── loader.ts            # JSON data loaders + discoverClassesAndTiers()
│   │   └── gear-merge.ts        # gear template inheritance (base + tier delta)
│   ├── engine/
│   │   ├── damage.ts            # raw damage range, range cap, adjusted range
│   │   ├── buffs.ts             # MW, Echo, total attack/stat calculation
│   │   ├── attack-speed.ts      # weapon speed resolution, attack time lookup
│   │   ├── dps.ts               # full DPS pipeline
│   │   ├── build-dps.ts         # build-level DPS calculation
│   │   ├── knockback.ts         # KB uptime modeling (Stance, Shadow Shifter)
│   │   └── marginal.ts          # marginal gain analysis
│   ├── proposals/
│   │   ├── types.ts             # Proposal, ScenarioResult, DeltaEntry, ComparisonResult
│   │   ├── apply.ts             # apply proposal changes to skill data
│   │   ├── validate.ts          # proposal JSON validation
│   │   ├── simulate.ts          # run DPS across all classes × tiers × skills
│   │   └── compare.ts           # before/after comparison with rank tracking
│   ├── report/
│   │   ├── markdown.ts          # Markdown rendering
│   │   ├── bbcode.ts            # BBCode rendering for royals.ms
│   │   ├── ascii-chart.ts       # terminal bar charts
│   │   └── utils.ts             # shared formatting helpers
│   └── sheets/
│       └── extract.ts           # read formulas/values from xlsx
└── web/                         # React + Vite SPA (separate package.json)
    ├── package.json
    ├── vite.config.ts
    ├── playwright.config.ts
    ├── index.html
    ├── e2e/                     # Playwright end-to-end tests
    └── src/
        ├── App.tsx              # routing + layout
        ├── theme.ts             # centralized color constants
        ├── data/bundle.ts       # static imports via import.meta.glob
        ├── context/             # SimulationControlsContext (buff/element/KB/cap state)
        ├── hooks/               # useSimulation, useBuildExplorer, useSavedBuilds, etc.
        ├── utils/               # format, cgs, class-colors, game-terms, url-encoding, etc.
        └── components/          # Dashboard, BuildExplorer, ProposalBuilder, FormulasPage, etc.
```
