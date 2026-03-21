# Fix seCritFormula validation in integrity tests

**Priority:** High
**Issue:** Integrity test is missing a valid enum value and doesn't validate per-skill overrides

## Problem

`src/data/integrity.test.ts:170-179` validates class-level `seCritFormula` against an incomplete set:

```typescript
const validFormulas = new Set(['addBeforeMultiply', 'multiplicative']);
```

The type system allows three values: `'addBeforeMultiply' | 'multiplicative' | 'scaleOnBase'`. Bowmaster's Arrow Bomb uses `scaleOnBase` as a per-skill override (`data/skills/bowmaster.json:34`), which the test doesn't check at all — it only loops over class-level `seCritFormula`, not individual skills.

If someone added `seCritFormula: "scaleOnBase"` at the class level, the test would incorrectly fail. If someone added an invalid per-skill `seCritFormula`, the test wouldn't catch it.

## Approach

1. Add `'scaleOnBase'` to the `validFormulas` set
2. Add a new test that iterates over every skill in every class and validates `skill.seCritFormula` when present

## Files to change

- **Edit:** `src/data/integrity.test.ts` — fix the existing test and add per-skill validation

## Notes

This is a ~10 line fix. The class-level formula validation set just needs the missing value, and the per-skill test is a nested loop over `classDataMap` → `classData.skills`.
