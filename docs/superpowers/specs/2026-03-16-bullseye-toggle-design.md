# Bullseye Toggle Design

## Problem

Bullseye's 1.2x damage modifier is hardcoded into the `multiplier` field on Battleship Cannon and Rapid Fire in `data/skills/sair.json`. This means it can't be toggled off independently, and users can't see unbuffed Corsair DPS.

## Behavior

Bullseye amplifies all damage on a single target. For the purposes of this simulator:
- Applies to single-target skills only (`maxTargets === 1` or undefined)
- Does NOT apply to multi-target skills (e.g., Battleship Torpedo)
- Defaults to on (matching current behavior and typical bossing scenario)
- Toggleable via a buff toggle in the web UI and CLI

## Approach

Add a `bullseye: true` field to affected skills in skill data, remove the hardcoded 1.2x from their `multiplier`, and add a `bullseye` toggle to `ScenarioConfig.overrides`. The DPS pipeline conditionally applies the 1.2x based on skill flag + scenario state.

## Data Layer

### `data/skills/sair.json`

- Remove `multiplier: 1.2` from Battleship Cannon and Rapid Fire (set to `1.0` or remove)
- Add `"bullseye": true` to both skills
- Update `description` and `source` fields to reflect Bullseye is no longer baked in

### `packages/engine/src/types.ts`

- Add `bullseye?: boolean` to `SkillEntry`
- Add `bullseye?: boolean` to `CharacterBuild` (default treated as `true` in the engine when undefined — no gear template changes needed)

## Engine

### `packages/engine/src/dps.ts`

Compute an effective multiplier early in `calculateSkillDps()`:

```typescript
const effectiveMultiplier = skill.multiplier *
  (skill.bullseye && build.bullseye !== false ? 1.2 : 1);
```

Use `effectiveMultiplier` in place of `skill.multiplier` in all 4 locations:
- `skillDamagePercent = basePower * effectiveMultiplier` (line 249)
- All 3 crit damage formulas in `calculateCritDamage()` (lines 86, 88, 90)

This ensures the 1.2x feeds into both normal and crit damage paths, matching current behavior. No change to order of operations — the multiplier still interacts with the damage cap correctly via range cap adjustment.

Note: `calculateCritDamage()` is a separate function that receives the skill. Either pass the effective multiplier as a parameter, or compute it inside that function too.

### `src/proposals/types.ts`

Add `'bullseye'` to the `Pick` union in `ScenarioConfig.overrides`:

```typescript
overrides?: Partial<Pick<CharacterBuild,
    'sharpEyes' | 'echoActive' | 'speedInfusion' |
    'mwLevel' | 'attackPotion' | 'shadowPartner' | 'bullseye'>>;
```

### Behavior matrix

| `build.bullseye` | `skill.bullseye` | Result |
|---|---|---|
| `true` / `undefined` (default) | `true` | 1.2x applied |
| `false` (toggled off) | `true` | no multiplier |
| any | `false`/undefined | no multiplier |

## CLI

Add `--no-bullseye` flag to the CLI (`src/cli.ts`) that sets `bullseye: false` in scenario overrides. Bullseye is on by default, so no `--bullseye` flag is needed.

## Web UI

### Toggle placement

Add a "Bullseye" toggle to the `BuffToggles` component, same style as SE/Echo/SI/MW/Pot toggles.

### Conditional visibility

Toggle only appears when Corsair is visible in the simulation results. The `BuffToggles` component will need access to which classes are present — pass this as a prop from the parent.

### Context changes

- Add `'bullseye'` to the `Pick` union in `BuffOverrides` type, defaulting to `true`
- Wire through to `ScenarioConfig.overrides` the same way existing buff toggles work

## Tests

### Engine tests (`packages/engine/src/dps.test.ts`)

- Corsair skill with `bullseye: true` + build `bullseye: true` -> 1.2x applied to both normal and crit damage
- Same skill + build `bullseye: false` -> no 1.2x
- Skill without `bullseye: true` -> unaffected regardless of toggle

### Regression

- Verify Battleship Cannon and Rapid Fire produce identical DPS to current values (1.2x was baked in, now applied dynamically with default on)
