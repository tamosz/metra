# Damage Cap Toggle

## Problem

The 199,999 per-line damage cap is hardcoded in the DPS pipeline. Users can't see how much DPS each class loses to the cap, and can't toggle it off to see uncapped rankings.

## Design

### Approach: Always compute both

`calculateSkillDps` always computes both capped (199,999) and uncapped DPS. The toggle controls which value is displayed — no re-simulation needed.

### Engine (`dps.ts`)

`DpsResult` gains two fields:
- `uncappedDps: number` — DPS without the per-line damage cap
- `capLossPercent: number` — percentage of DPS lost to the cap (0–100)

`calculateAverageDamage` computes uncapped average alongside capped. Uncapped is straightforward since `adjustedRange = damageRange.average` when no cap applies:

```
uncappedAvg = damageRange.average * (skillMult * normalRate + critMult * critRate) * hitCount * shadowPartnerMult
```

`fixedDamage` skills (Snipe): `uncappedDps = dps`, `capLossPercent = 0`.

### Simulation (`simulate.ts`)

Post-calc multipliers (PDR, element, targets, KB) are all linear. Each `apply*` helper scales `uncappedDps` with the same factor as `dps`. Since both get the same multiplier, `capLossPercent` stays constant through post-processing.

Combo group aggregation sums both `dps` and `uncappedDps`, then recomputes `capLossPercent` from the totals.

### Reports (markdown, bbcode, ascii-chart)

Baseline report:
- Capped (default): show DPS + "Cap Loss" column
- Uncapped (`--uncapped`): show uncapped DPS, no cap loss column

Comparison report: no cap loss column (keeps deltas clean).

### CLI (`cli.ts`)

New flag: `--uncapped` — shows uncapped DPS in rankings. Default: capped DPS with cap loss column.

### Web

New toggle button next to KB toggle: "Cap" (on by default).
- ON (capped): rankings use `dps`, show cap loss column
- OFF (uncapped): rankings use `uncappedDps`, hide cap loss column
- Toggle is instant (no re-simulation)
