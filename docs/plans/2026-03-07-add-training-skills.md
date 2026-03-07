# Add Training Skills: Arrow Bomb, Dragon Strike

## Summary

Add two AoE training skills relevant for multi-target scenarios.

## Arrow Bomb (Bowmaster)

- **basePower**: 130
- **multiplier**: 1
- **hitCount**: 1
- **maxTargets**: 6
- **speedCategory**: "Strafe/Snipe" (existing)
- **weaponType**: "Bow"
- **builtInCritRate**: 0.40 (Critical Shot, same as Hurricane)
- **builtInCritDamageBonus**: 100
- **source**: ayumilove, hidden-street, royals.ms thread #237950

**TODO**: Arrow Bomb may use a multiplicative crit formula instead of addBeforeMultiply.
Forum thread says "130% * 2 = 260%" for normal crit and "130% * 3.4 = 442%" with SE.
If addBeforeMultiply: (130+100)*1 = 230%, which doesn't match 260%.
Needs investigation — for now, uses class-level addBeforeMultiply like other BM skills.

## Dragon Strike (Buccaneer)

- **basePower**: 900
- **multiplier**: 1.0
- **hitCount**: 1
- **maxTargets**: 6
- **speedCategory**: "Brandish" (speed-dependent, 0.63s at speed 2 — inferred from combo math)
- **weaponType**: "Knuckle"
- **knockbackRecovery**: 0 (Super Transformation required, like Demo)
- **source**: dmg sheet D25=900, E25=900*1. Speed inferred: B+Demo 4.04s - Demo 2.34s = Barrage 1.70s; B+DS 2.34s - 1.70s = DS 0.64s ≈ Brandish 0.63s

## Snatch (Buccaneer) — PARKED

Waiting on attack speed data. Known values:
- **basePower**: 600 (at lv30) — MapleSaga skill DB, Ayumilove
- **hitCount**: 1 (likely, unconfirmed)
- **maxTargets**: 6 — MapleSaga, Donn1e's guide
- **prerequisite**: Super Transformation
- **attack speed**: UNKNOWN — forum mentions it "feels slow", no ms value found
- Planned for DS + Snatch combo once delay is known

## Implementation Steps

1. Add Arrow Bomb to `data/skills/bowmaster.json`
2. Add Dragon Strike to `data/skills/bucc.json`
3. Add tests for both skills in build-dps tests
4. Run full test suite, verify no regressions
5. Commit
