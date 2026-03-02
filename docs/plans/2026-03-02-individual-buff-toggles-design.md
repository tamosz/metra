# Individual Buff Toggles

Replace pre-baked Unbuffed/No-Echo scenarios with composable per-buff toggles in the web UI, mirroring the element toggle pattern.

## Buffs

5 toggles, all on by default:

| Toggle | Label | On | Off |
|--------|-------|----|----|
| Sharp Eyes | SE | `sharpEyes: true` | `sharpEyes: false` |
| Echo of Hero | Echo | `echoActive: true` | `echoActive: false` |
| Speed Infusion | SI | `speedInfusion: true` | `speedInfusion: false` |
| Maple Warrior | MW | `mwLevel: 20` | `mwLevel: 0` |
| Attack Potion | Pot | `attackPotion: <tier default>` | `attackPotion: 0` |

Binary on/off toggles (not tri-state like elements).

## Scenarios after change

Remove from `DEFAULT_SCENARIOS`:
- `Unbuffed` (all buffs off)
- `No-Echo` (echo off)

Keep:
- `Buffed` (no overrides — baseline)
- `Bossing (50% PDR)` (pdr: 0.5)
- `Bossing (KB)` (pdr: 0.5, knockback model)

The buff toggles compose onto whichever scenario is selected, same as elements.

## Data flow

Same pattern as `elementModifiers`:

1. `App` holds `buffOverrides` state (`Partial<Pick<CharacterBuild, ...>>`)
2. Passed to `useSimulation`, which merges overrides into each scenario's `overrides` field
3. `BuffToggles` component renders in the Dashboard filter bar next to `ElementToggles`
4. All toggles default to on (empty overrides = fully buffed)
5. Toggling one off adds it to the overrides object; toggling back on removes it

## Visual style

Inverse of elements: on = dim/subtle (default, not noteworthy), off = highlighted color (red/warning to show "you're missing this buff"). A label group "Buffs" above the row, matching the "Elements" label.

## Scope

- **Web only** — no CLI buff toggle support (CLI keeps running remaining scenarios)
- **Engine unchanged** — `ScenarioConfig.overrides` already supports all these fields
- **Simulation unchanged** — `applyScenarioOverrides` already handles these overrides

## Files to change

### Core
- `src/scenarios.ts` — remove Unbuffed and No-Echo entries

### Web (new/modified)
- `web/src/components/BuffToggles.tsx` — new component
- `web/src/components/Dashboard.tsx` — add BuffToggles to filter bar
- `web/src/hooks/useSimulation.ts` — merge buffOverrides into scenarios (same pattern as elementModifiers)
- `web/src/App.tsx` — add buffOverrides state, pass down
- `web/src/utils/game-terms.ts` — remove Unbuffed/No-Echo descriptions

### Tests to update
- `src/scenarios.test.ts` — remove Unbuffed/No-Echo assertions
- `src/proposals/simulate.test.ts` — replace scenario names in test data
- `src/proposals/compare.test.ts` — replace scenario names in test data
- `src/audit/analyze.test.ts` — replace scenario names in test data
- `src/integration.test.ts` — replace scenario names in test data
- `src/report/markdown.test.ts` — replace scenario names in test data
- `src/report/bbcode.test.ts` — replace scenario names in test data
- `src/report/utils.test.ts` — replace scenario names in test data
- `web/src/hooks/useSimulation.test.ts` — remove from expected scenarios list
- `web/src/utils/game-terms.test.ts` — remove Unbuffed/No-Echo test cases
- `web/e2e/dashboard.spec.ts` — replace Unbuffed button click with buff toggle interaction
- `web/e2e/proposal-results.spec.ts` — replace Unbuffed button click

### Docs
- `CLAUDE.md` — update scenario list
- `ROADMAP.md` — update milestone description
