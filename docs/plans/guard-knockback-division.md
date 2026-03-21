# Guard against division by zero in knockback calculation

**Priority:** Medium
**Issue:** `calculateKnockbackUptime` divides by `bossAttackInterval` without validating it

## Problem

`packages/engine/src/knockback.ts:66`:

```typescript
const kbsPerSecond = kbProbability / bossAttackInterval;
```

If `bossAttackInterval` is 0 or negative, this produces `Infinity` or `-Infinity`, which flows into `timeLostPerSecond` and then into the `Math.max(0.1, ...)` clamp. The clamp prevents a truly degenerate result, but the function silently returns 0.1 (10% uptime) for nonsensical input rather than flagging the error.

In practice, `bossAttackInterval` comes from either the CLI (`--kb-interval`, validated > 0 at `cli.ts:48-50`) or the web UI (constrained by input controls). But the engine function itself has no guard, so a caller passing bad input gets silently wrong results.

## Approach

Add an early validation throw:

```typescript
export function calculateKnockbackUptime(
  kbProbability: number,
  bossAttackInterval: number,
  recoveryTime: number
): number {
  if (bossAttackInterval <= 0) {
    throw new Error('bossAttackInterval must be positive');
  }
  // ... rest unchanged
}
```

## Files to change

- **Edit:** `packages/engine/src/knockback.ts` — add input validation
- **Edit:** `packages/engine/src/knockback.test.ts` — add test for the error case

## Notes

This is a 2-line code change + 1 test. The existing clamp at `Math.max(0.1, ...)` stays as a safety net for legitimate edge cases (very high KB rate), the new guard just catches invalid input.
