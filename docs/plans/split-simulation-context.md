# Split SimulationControlsContext

**Priority:** High
**Issue:** Monolithic context (38 fields) mixing unrelated concerns

## Problem

`web/src/context/SimulationControlsContext.tsx` bundles three distinct groups of state into a single context with 38 fields in its interface:

1. **Simulation filters** (14 fields) — targetCount, elementModifiers, buffOverrides, kbEnabled, bossAttackInterval, bossAccuracy, capEnabled, selectedTier, cgsValues, efficiencyOverrides, kbConfig, activeGroups, breakdownEnabled, and their setters
2. **Proposal editing** (12 fields) — editEnabled, editChanges, editMeta, addEditChange, removeEditChange, updateEditChange, clearEditChanges, setEditMeta, loadEditState, and their setters
3. **Derived/shared** — resetControls, toggleGroup

Any state change to any field triggers a re-render for all context consumers. The `useMemo` dependency array at line 181 has 26 items.

## Approach

Split into two contexts:

- **SimulationFiltersContext** — simulation parameters (targets, elements, buffs, KB, cap, tier, CGS, efficiency, groups, breakdown)
- **ProposalEditContext** — edit mode state (editEnabled, editChanges, editMeta, CRUD operations, loadEditState)

Keep `resetControls` in filters (it already clears edit state via calling setters — after the split it can call `clearEdit()` from the edit context or be split into two reset functions).

Both providers wrap at the same level in `App.tsx` so there's no refactoring needed in the component tree — just import changes.

## Files to change

- **Edit:** `web/src/context/SimulationControlsContext.tsx` — split into two contexts, two providers, two hooks
- **Edit:** Components that import `useSimulationControls()` — update imports to use the appropriate context hook
  - Components that only read simulation filters won't re-render on edit changes (and vice versa)
  - Grep for `useSimulationControls` to find all consumers

## Notes

This is a refactoring task with no behavior change. Run the web test suite and manually verify the dashboard after. The existing e2e tests should catch regressions.

An alternative approach is keeping one file but using `useSyncExternalStore` or separate `useState` + `useContext` pairs to avoid unnecessary re-renders. The split-context approach is simpler and more idiomatic React.
