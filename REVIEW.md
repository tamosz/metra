# Codebase Review Tasks

7 independent review tasks scoped to distinct areas. Each can be run in a separate worktree agent.

## 1. Data layer: skills, gear templates, and static JSON

**Scope:** `data/skills/`, `data/gear-templates/`, `data/weapons.json`, `data/attack-speed.json`, `data/mw.json`

Review for:
- Consistency across all 13 class skill files (field naming, required fields present, slug conventions)
- Gear template consistency across tiers (low/mid/high) and classes (stat progression makes sense, WATK values align with gear-assumptions.md)
- Weapon multiplier and attack speed data correctness
- Any missing or stale source annotations
- Cross-file referential integrity (e.g., weaponType in skills matches weapons.json keys, speed categories match attack-speed.json)

## 2. Engine: damage, buffs, attack-speed, DPS pipeline

**Scope:** `src/engine/` — damage.ts, buffs.ts, attack-speed.ts, dps.ts and their tests

Review for:
- Formula correctness (standard, throwing star, magic damage formulas)
- Edge cases in damage range calculations (floor rounding, damage cap, capped distributions)
- Buff aggregation logic (MW, Echo, total attack/stat — especially mage echo variant)
- Attack speed resolution (base - booster - SI) and lookup logic
- DPS pipeline integration (skill damage%, crit, range caps, Shadow Partner, fixedDamage, comboGroup, maxTargets)
- Test coverage gaps — are all formula branches exercised?
- Code quality: function size, naming, separation of concerns

## 3. Proposals: apply, validate, simulate, compare

**Scope:** `src/proposals/` — apply.ts, validate.ts, simulate.ts, compare.ts, types.ts and their tests

Review for:
- Proposal application correctness (field patching, from-value validation, error messages with change index)
- Validation logic (required fields, target format parsing, type checking)
- Simulation runner (class×tier×skill×scenario iteration, comboGroup aggregation, multi-target support, PDR application)
- Comparison logic (before/after deltas, rank tracking per scenario/tier group)
- Type definitions (ScenarioResult, DeltaEntry, ComparisonResult — are they clean and well-structured?)
- Error handling and edge cases (empty proposals, invalid targets, stale from-values)

## 4. Reports: markdown, bbcode, ascii-chart, utils

**Scope:** `src/report/` — markdown.ts, bbcode.ts, ascii-chart.ts, utils.ts and their tests

Review for:
- Output formatting correctness (number formatting, percentage display, rank arrows)
- Shared utils usage (formatNumber, formatChange, formatPercent, sortDeltas — is the DRY extraction clean?)
- Markdown report rendering (baseline and comparison modes, multi-scenario tables)
- BBCode rendering (forum-compatible output, table formatting)
- ASCII chart quality (bar scaling, alignment, terminal display)
- Test coverage — are report outputs being snapshot/string-tested adequately?

## 5. CLI, data loader, scenarios, and audit

**Scope:** `src/cli.ts`, `src/data/` (loader.ts, types.ts, integrity.test.ts), `src/scenarios.ts`, `src/audit/` (analyze.ts, format.ts, types.ts)

Review for:
- CLI argument parsing and mode dispatch (baseline vs proposal, --targets, --audit)
- Data loader robustness (JSON parsing, file path resolution, class/tier discovery logic, "/" handling)
- Type definitions in data/types.ts (are they comprehensive, well-named, avoid unnecessary complexity?)
- Data integrity tests (tier coverage, weapon refs — are they thorough?)
- Scenario definitions (are the 5 default scenarios well-structured?)
- Audit analysis (outlier detection math, tier sensitivity, group summaries)
- Audit formatting (Markdown tables, readability)
- Error handling throughout (missing files, malformed data, empty directories)

## 6. Web app: components, hooks, and state management

**Scope:** `web/src/` — React components, hooks, state management

Review for:
- Component structure and separation of concerns (is business logic in engine, not components?)
- Hook quality (useSimulation, useProposal — clean interfaces, proper memoization?)
- Data bundle approach (import.meta.glob static imports — any issues?)
- URL sharing implementation (lz-string compression, hash encoding/decoding)
- Custom tier editor and saved builds (localStorage usage, data validation)
- Proposal builder UX logic (create, edit, simulate flow)
- Theme/styling consistency (centralized theme.ts usage)
- General React best practices (key props, effect dependencies, unnecessary re-renders)

## 7. Web app: config, tests, and build setup

**Scope:** `web/` — vite.config.ts, playwright.config.ts, package.json, e2e tests, unit tests. Root: tsconfig.json, vitest.config.ts, vercel.json, `.githooks/`

Review for:
- Vite config (aliases @engine/@data, build settings, any issues?)
- Playwright e2e test coverage and quality
- Web unit test coverage (url-encoding, useSimulation — gaps?)
- Package.json dependencies (outdated? unnecessary? missing?)
- TypeScript config (strict mode, path aliases, include/exclude)
- Root vitest config (web exclusion working correctly?)
- Vercel deployment config
- Pre-commit hook — is it running the right checks?
