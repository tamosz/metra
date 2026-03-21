# Extract shared scenario builder

**Priority:** High
**Issue:** Scenario-building logic is duplicated verbatim across 3 hooks

## Problem

Three hooks independently construct `ScenarioConfig[]` from the same inputs with identical logic (~20 lines each):

- `web/src/hooks/useSimulation.ts:54-77` — builds baseline + optional training scenario
- `web/src/hooks/useEditComparison.ts:60-83` — same construction, passed to `compareProposal()`
- `web/src/hooks/useBuffBreakdown.ts:27-61` — same construction, with an extra `buffOff` merge

All three check for element modifiers, spread buff overrides, inject KB config, add efficiency overrides, and conditionally append a training scenario. Adding a new simulation control (e.g., PDR toggle) would require changing all three.

The CGS override application is also duplicated across the same three hooks.

## Approach

Extract a `buildScenariosFromControls(options: SimulationOptions): ScenarioConfig[]` utility into `web/src/utils/scenario-builder.ts`. Accept an optional `extraOverrides` parameter for the buff breakdown case (where `buffOff` gets merged into overrides).

Also extract the CGS template preparation into a shared helper since all three hooks do the same `applyCgsOverride()` dance.

## Files to change

- **Create:** `web/src/utils/scenario-builder.ts` — `buildScenarios()` and `prepareTemplates()` functions
- **Edit:** `web/src/hooks/useSimulation.ts` — replace inline scenario construction with shared utility
- **Edit:** `web/src/hooks/useEditComparison.ts` — same
- **Edit:** `web/src/hooks/useBuffBreakdown.ts` — same, passing `buffOff` as `extraOverrides`
- **Create:** `web/src/utils/scenario-builder.test.ts` — unit tests for the extracted utility

## Notes

`useBuffBreakdown` already has a local `buildScenarios()` function doing this — the extraction is essentially promoting that to a shared utility and making the other two hooks use it.
