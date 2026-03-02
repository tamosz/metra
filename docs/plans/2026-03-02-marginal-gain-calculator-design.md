# Marginal Gain Calculator

## Purpose

Answer "which stat gives me the most DPS per point right now?" in the Build Explorer.

## Engine

New file `src/engine/marginal.ts` with a pure function:

```typescript
interface MarginalGain {
  stat: string;        // "WATK", "STR", "DEX", etc.
  currentValue: number;
  dpsGain: number;     // DPS(+1) - DPS(current)
  percentGain: number; // dpsGain / currentDps * 100
}

function calculateMarginalGains(
  build: CharacterBuild,
  classData: ClassSkillData,
  skill: SkillEntry,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData
): MarginalGain[]
```

Runs `calculateSkillDps` at baseline, then with +1 to each stat axis:
- **WATK** (+1 `totalWeaponAttack`)
- **Primary stat** (+1 to class's `primaryStat` in `gearStats`)
- **Secondary stat** (+1 to each stat in `secondaryStat` — shown separately for array types like Shadower's `["STR", "DEX"]`)

For mages, WATK maps to MATK (same `totalWeaponAttack` field). Stat names come from `classData.primaryStat` / `classData.secondaryStat`.

For comboGroup skills: sum the DPS of all sub-skills at baseline and at +1, then take the delta.

Returns results sorted by `dpsGain` descending.

## Web

New component `MarginalGainsTable` in Build Explorer, below `BuildDpsResults`.

- Computes marginal gains for the best skill (highest DPS)
- Shows a table: Stat | Current | +1 DPS | +1 %
- Best gain row highlighted with accent color
- Subtitle notes which skill the analysis is based on

## Scope boundaries

- Engine + web only, no CLI output yet
- Best-skill only (no per-skill breakdown)
- No cost/meso modeling
- comboGroup handled via aggregate DPS
