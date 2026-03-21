# Reduce redundant simulation passes in Dashboard

**Priority:** Medium
**Issue:** Dashboard triggers up to 4 full simulation runs per state change

## Problem

When the Dashboard renders with edit mode and buff breakdown both enabled, it runs:

1. `useSimulation()` — baseline rankings (full sim)
2. `useEditComparison()` — proposal deltas (full sim x2: before + after)
3. `useBuffBreakdown()` — runs 3 additional sims (SE off, SI off, Echo off) to isolate buff contributions

Each sim iterates 14 classes x 4 tiers x 30+ skills. While individually fast (~50-100ms), the total can approach 400ms on state changes — noticeable as slight jank.

## Approach

`useBuffBreakdown` already receives `fullResults` (the baseline sim output) and re-runs sims with each buff individually toggled off. The core issue is that it calls `runSimulation()` independently rather than reusing any shared preparation.

Two options:

**Option A (simpler):** Extract the template preparation and scenario construction (see `extract-scenario-builder.md`) so the redundant setup cost is eliminated. The actual DPS computation must still run separately per buff-off variant — that's inherent to the breakdown approach. This addresses the overhead without changing the architecture.

**Option B (deeper):** Cache and share the intermediate simulation state. The `runSimulation` function builds a `SimulationConfig` and iterates the nested loop each time. A memoized `SimulationContext` could cache the base sim results and only re-run when controls change, with buff breakdown computed as a derivative.

Recommend Option A first — it eliminates duplicated setup and is a natural follow-on from `extract-scenario-builder.md`. Option B is premature unless profiling shows the actual DPS loop is the bottleneck.

## Files to change

- **Edit:** `web/src/hooks/useBuffBreakdown.ts` — use shared scenario builder and template preparation
- Depends on: `extract-scenario-builder.md` landing first

## Notes

The buff breakdown design (run N sims with each buff toggled off, diff against baseline) is fundamentally correct — there's no shortcut to isolating SE/SI/Echo contributions without re-running the sim. The win here is eliminating repeated setup work, not eliminating the sim runs themselves.
