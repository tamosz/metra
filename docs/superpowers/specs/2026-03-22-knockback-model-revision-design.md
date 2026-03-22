# Knockback Model Revision

Overarching spec for three independent improvements to the KB uptime model, ordered by priority and dependency.

## Status Quo

The KB model multiplies DPS by an uptime factor derived from boss attack frequency, class defenses (Stance/Shadow Shifter), and per-skill recovery time. Dodge from avoidability is modeled but always evaluates to 0 because no gear template sets an avoidability value.

Three problems identified:

1. The dodge formula is wrong (post-BB sqrt formula applied to a pre-BB server)
2. Recovery time constants are unverified community estimates
3. Avoidability is never populated, so dodge never contributes

## Workstream A: Fix Dodge Formula

### Problem

`calculateDodgeChance` uses:

```
dodgeRate = floor(sqrt(playerAvoid)) - floor(sqrt(monsterAccuracy))
```

Sourced from SouthPerry's "[BB] All Known Formulas" thread — a **post-Big Bang** reference. MapleRoyals is pre-BB (v62). The correct pre-BB formula for monster → player dodge, confirmed by client code extraction (iPippy, MapleLegends) and in-game testing on Royals (jamin, royals.ms forums), is:

```
dodgeRate = avoid / (4.5 * monsterAccuracy)
```

With class-specific caps:
- Non-thieves: [2%, 80%]
- Thieves (NL, Shadower): [5%, 95%]

And a level penalty (from the same client code extraction): `effectiveAvoid = avoid - (monsterLevel - charLevel) / 2` when monster level exceeds player level. Note: the reference doc (`knockback.md`) currently shows a different level penalty (`dodgeRate -= 5 * (monsterLevel - playerLevel)`) from the post-BB SouthPerry thread — this should be replaced with the pre-BB formula above.

The current formula also documents incorrectly on the web Formulas page (LaTeX rendering of the sqrt formula labeled as "pre-BB").

### Changes

**Engine (`packages/engine/src/knockback.ts`):**
- Replace `calculateDodgeChance` with the linear formula
- Accept explicit `minDodge`/`maxDodge` cap parameters (caller determines thief vs non-thief from class data)
- Add optional `levelDifference: number` parameter (default 0). Applied inside the function as `effectiveAvoid = avoid - max(0, levelDifference) / 2`. No caller uses this yet — it's a forward-compatible slot.
- Defaults: `minDodge=0.02, maxDodge=0.80` (non-thief). Callers pass `0.05, 0.95` for thieves.

**Simulation pipeline (`src/proposals/simulate.ts`):**
- Update the `calculateDodgeChance` call site to pass dodge caps based on class data
- Thief detection: classes with `shadowShifterRate > 0` use thief caps (this is already a reliable signal — only NL and Shadower have it)

**Types (`packages/engine/src/types.ts`):**
- No changes needed — `CharacterBuild.avoidability` already exists

**Tests (`src/engine/knockback.test.ts`):**
- Rewrite `calculateDodgeChance` tests against the linear formula
- Add cap boundary tests for thief vs non-thief
- Add level penalty tests

**Web (`web/src/components/formulas/KnockbackModelingSection.tsx`):**
- Update LaTeX formula to show the linear formula
- Update prose explaining dodge behavior
- Update the "avoidability > 255 for 1% dodge" statement (no longer true under the linear formula)

**Reference (`data/references/knockback.md`):**
- Replace the SouthPerry sqrt formula with the linear formula and corrected sources
- Note that the SouthPerry thread is post-BB, not pre-BB

### Verification

Spot-checks against known values:
1. Voodoos (accuracy ~210), 756 avoid → `756 / (4.5 * 210) = 80%` dodge (hits the non-thief cap)
2. Night Lord with 300 avoid vs boss accuracy 250 → `300 / (4.5 * 250) = 26.7%` dodge (within thief range [5%, 95%])
3. Warrior with 10 avoid vs accuracy 250 → `10 / (4.5 * 250) = 0.89%`, clamped to 2% minimum (non-thief floor)

## Workstream B: Calibrate Recovery Constants

### Problem

The two recovery constants are the highest-leverage numbers in the KB model:

| Constant | Current | Source |
|----------|---------|--------|
| `DEFAULT_KB_RECOVERY` (burst skills) | 0.6s | "Community timing estimates" |
| `CHANNEL_KB_RECOVERY` (Hurricane etc.) | 1.0s | "Community timing estimates" |

These are guesses. A 0.2s error on channel recovery shifts Bowmaster's KB uptime from 33% to 40% (or 27%), a 7-point DPS swing on their headline skill.

### Method

Frame-count analysis of recorded gameplay footage:

1. Record Hurricane channeling against a boss that knocks back
2. Step through frames (VLC `e` key) to measure: KB hit frame → first damage number frame
3. Repeat for 5-10 KB events, average the results
4. At 30fps: ±33ms precision, at 60fps: ±17ms — both sufficient

Same method for burst skills if footage is available (any melee class getting KB'd mid-attack).

### Changes

**Engine (`packages/engine/src/knockback.ts`):**
- Update `DEFAULT_KB_RECOVERY` and `CHANNEL_KB_RECOVERY` constants to measured values
- Possibly split `CHANNEL_KB_RECOVERY` into Hurricane vs Rapid Fire if they differ (the reference doc already notes RF can fire mid-air, suggesting shorter recovery)

**Reference (`data/references/knockback.md`):**
- Replace "community timing estimates" with measured values, methodology, and footage source

**Tests:**
- Update any tests that hardcode the old constants

### Dependency

Blocked on footage. Workstream A can proceed independently.

### Open questions

**Should Rapid Fire get its own recovery constant?** The reference doc says RF can fire mid-air unlike Hurricane, implying shorter recovery (~0.5s per the doc). If we can't get RF footage, we could keep the doc's 0.5s estimate and note the source, or leave RF at the Hurricane value with a TODO.

**Detection mechanism if RF splits from Hurricane:** Both Hurricane and Rapid Fire use 0.12s attack time, so the current `attackTime === 0.12` heuristic can't distinguish them. If they get different constants, the cleanest approach is adding explicit `knockbackRecovery` overrides on the skill data entries (same mechanism already used for i-frame skills), rather than complicating the heuristic.

## Workstream C: Model Per-Class Avoidability

### Problem

Every `CharacterBuild` has `avoidability: 0` (undefined, defaults to 0). Dodge never contributes to KB resistance. With the corrected linear formula, avoidability would meaningfully affect thieves:

| Class | Est. Avoid (endgame) | Dodge vs ACC 250 | Impact on KB uptime |
|-------|---------------------|-------------------|---------------------|
| Night Lord | ~300 LUK-based | ~27% | KB prob drops 0.70 → 0.51 |
| Shadower | ~250 LUK-based | ~22% | KB prob drops 0.60 → 0.47 |
| Warriors | ~50 | ~4% | Negligible (already have 90% stance) |
| Archers | ~80 | ~7% | Small but nonzero |
| Mages | ~100 INT-based? | ~9% | Small |

The thief impact is significant — NL's KB uptime would improve from ~72% to ~80%.

### Changes

**Data (`data/gear-templates/*.base.json` and `*-perfect.json`):**
- Add `avoidability` field to each class's gear template (base and mage perfect overrides if they differ)
- Values derived from: base avoid at level 200 + gear avoid from equipment + buff avoid

**Data computation (`src/data/gear-compute.ts`):**
- Pass avoidability through to `CharacterBuild`

**Web:**
- Expose avoidability in Build Explorer for manual override
- Show dodge chance in skill detail drilldown when KB is enabled

**CLI:** No changes needed — `simulate.ts` already reads `effectiveBuild.avoidability`, so values populated via gear templates flow through automatically.

### Open questions

**Where do endgame avoidability values actually come from?** Avoid scales with DEX (archers, some warriors), LUK (thieves), and gear. Need to research:
- Base avoid formula (level + stat contribution)
- Avoid from standard endgame gear (what scrolls/equipment give avoid?)
- Whether MW/buffs affect avoid

This is a research task that hasn't been done yet. The estimates in the table above are rough guesses. **This workstream should not start until the avoid formula and typical endgame values are researched.**

**Reference doc update:** The "Expected DPS Loss" table in `data/references/knockback.md` was computed assuming dodge = 0%. Once avoidability is populated, those figures change (especially NL and Shadower). The table should be regenerated as part of this workstream.

## Execution Order

```
A (dodge formula) ──→ can start now, no dependencies
B (recovery calibration) ──→ blocked on footage
C (avoidability modeling) ──→ blocked on avoid research, depends on A being merged
```

A and B are independent of each other. C depends on A (needs the correct formula to produce meaningful results).

## Files Touched

| File | A | B | C |
|------|---|---|---|
| `packages/engine/src/knockback.ts` | x | x | |
| `src/engine/knockback.test.ts` | x | x | |
| `src/proposals/simulate.ts` | x | | |
| `src/proposals/simulate.test.ts` | x | | |
| `data/references/knockback.md` | x | x | x |
| `web/src/components/formulas/KnockbackModelingSection.tsx` | x | | x |
| `data/gear-templates/*.base.json` | | | x |
| `data/gear-templates/*-perfect.json` | | | x |
| `src/data/gear-compute.ts` | | | x |
