# Bullseye Toggle Design

## Problem

Bullseye's 1.2x damage modifier is hardcoded into the `multiplier` field on Battleship Cannon and Rapid Fire in `data/skills/sair.json`. This means it can't be toggled off independently, and users can't see unbuffed Corsair DPS.

## Behavior

Bullseye amplifies all damage on a single target. For the purposes of this simulator:
- Applies to single-target skills only (`maxTargets === 1` or undefined)
- Does NOT apply to multi-target skills (e.g., Battleship Torpedo)
- Defaults to on (matching current behavior and typical bossing scenario)
- Toggleable via a buff toggle in the web UI

## Approach

Add a `bullseye: true` field to affected skills in skill data, remove the hardcoded 1.2x from their `multiplier`, and add a `bullseye` toggle to `ScenarioConfig.overrides`. The DPS pipeline conditionally applies the 1.2x based on skill flag + scenario state.

## Data Layer

### `data/skills/sair.json`

- Remove `multiplier: 1.2` from Battleship Cannon and Rapid Fire (set to `1.0` or remove)
- Add `"bullseye": true` to both skills
- Update `description` and `source` fields to reflect Bullseye is no longer baked in

### `src/data/types.ts`

- Add `bullseye?: boolean` to `SkillEntry`
- Add `bullseye?: boolean` to `CharacterBuild`, defaulting to `true`

## Engine

### `src/engine/dps.ts`

In `calculateSkillDps()`, when computing `skillDamagePercent = basePower * multiplier`, conditionally multiply by 1.2 if:
- The skill has `bullseye: true`
- The build has `bullseye: true` (or undefined, since default is on)

Same position in the pipeline as before — no change to order of operations. The 1.2x still feeds into `skillDamagePercent`, still interacts with the damage cap correctly via range cap adjustment.

### `src/proposals/types.ts`

Add `bullseye?: boolean` to the `overrides` type in `ScenarioConfig`, alongside `sharpEyes`, `echoActive`, etc.

### Behavior matrix

| `build.bullseye` | `skill.bullseye` | Result |
|---|---|---|
| `true` (default) | `true` | 1.2x applied |
| `false` (toggled off) | `true` | no multiplier |
| any | `false`/undefined | no multiplier |

## Web UI

### Toggle placement

Add a "Bullseye" toggle to the `BuffToggles` component, same style as SE/Echo/SI/MW/Pot toggles.

### Conditional visibility

Toggle only appears when Corsair is visible in the simulation results.

### Context changes

- Add `bullseye` to `BuffOverrides` in `SimulationControlsContext`, defaulting to `true`
- Wire through to `ScenarioConfig.overrides` the same way existing buff toggles work

## Tests

### Engine tests (`src/engine/dps.test.ts`)

- Corsair skill with `bullseye: true` + build `bullseye: true` -> 1.2x applied
- Same skill + build `bullseye: false` -> no 1.2x
- Skill without `bullseye: true` -> unaffected regardless of toggle

### Regression

- Verify Battleship Cannon and Rapid Fire produce identical DPS to current values (1.2x was baked in, now applied dynamically with default on)
