# Fix Dodge Formula Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wrong post-BB sqrt dodge formula with the correct pre-BB linear formula, and update KB recovery constants to calibrated values. Covers spec Workstreams A and B.

**Architecture:** The dodge formula lives in `packages/engine/src/knockback.ts` as a pure function. It's called from one place in the simulation pipeline (`src/proposals/simulate.ts`). The function signature gains optional cap/level parameters. The single caller is updated to pass thief-specific caps. Recovery constants are updated: burst 0.6→0.5s, channel expressed as burst+0.2s wind-up (0.7s). Tests are rewritten, reference docs and the web Formulas page are updated.

**Tech Stack:** TypeScript, Vitest, React (web Formulas page only)

**Spec:** `docs/superpowers/specs/2026-03-22-knockback-model-revision-design.md` (Workstreams A + B)

---

### Task 1: Rewrite `calculateDodgeChance` tests (TDD red phase)

**Files:**
- Modify: `src/engine/knockback.test.ts:24-49` (replace entire `calculateDodgeChance` describe block)

The new formula is `dodge = avoid / (4.5 * accuracy)`, clamped to `[minDodge, maxDodge]`, with a level penalty applied to avoidability first: `effectiveAvoid = avoid - max(0, levelDifference) / 2`.

- [ ] **Step 1: Replace the `calculateDodgeChance` test suite**

Replace the existing `describe('calculateDodgeChance', ...)` block (lines 24-49) with:

```typescript
describe('calculateDodgeChance', () => {
  it('returns minDodge when avoidability is 0 (non-thief)', () => {
    // 0 / (4.5 * 250) = 0, clamped to non-thief floor 0.02
    expect(calculateDodgeChance(0, 250)).toBeCloseTo(0.02);
  });

  it('returns minDodge when avoidability is 0 (thief)', () => {
    expect(calculateDodgeChance(0, 250, { minDodge: 0.05, maxDodge: 0.95 })).toBeCloseTo(0.05);
  });

  it('computes linear dodge for moderate avoidability', () => {
    // 300 / (4.5 * 250) = 0.2667
    expect(calculateDodgeChance(300, 250)).toBeCloseTo(0.2667, 3);
  });

  it('caps at maxDodge for non-thieves (80%)', () => {
    // 1000 / (4.5 * 250) = 0.889, capped to 0.80
    expect(calculateDodgeChance(1000, 250)).toBeCloseTo(0.80);
  });

  it('caps at maxDodge for thieves (95%)', () => {
    // 1000 / (4.5 * 100) = 2.22, capped to 0.95
    expect(calculateDodgeChance(1000, 100, { minDodge: 0.05, maxDodge: 0.95 })).toBeCloseTo(0.95);
  });

  it('spot-check: Voodoos (acc ~210), 756 avoid = 80% cap', () => {
    // 756 / (4.5 * 210) = 0.80, exactly at non-thief cap
    expect(calculateDodgeChance(756, 210)).toBeCloseTo(0.80);
  });

  it('spot-check: NL 300 avoid vs boss acc 250', () => {
    // 300 / (4.5 * 250) = 0.2667
    expect(calculateDodgeChance(300, 250, { minDodge: 0.05, maxDodge: 0.95 })).toBeCloseTo(0.2667, 3);
  });

  it('spot-check: warrior 10 avoid vs boss acc 250 hits floor', () => {
    // 10 / (4.5 * 250) = 0.0089, clamped to 0.02
    expect(calculateDodgeChance(10, 250)).toBeCloseTo(0.02);
  });

  it('applies level penalty to avoidability', () => {
    // effectiveAvoid = 300 - 20/2 = 290
    // 290 / (4.5 * 250) = 0.2578
    expect(calculateDodgeChance(300, 250, { levelDifference: 20 })).toBeCloseTo(0.2578, 3);
  });

  it('level penalty does not reduce avoidability below 0', () => {
    // effectiveAvoid = 10 - 200/2 = -90 → clamped to 0
    // 0 / (4.5 * 250) = 0, clamped to minDodge 0.02
    expect(calculateDodgeChance(10, 250, { levelDifference: 200 })).toBeCloseTo(0.02);
  });

  it('handles 0 accuracy gracefully (returns maxDodge)', () => {
    // Division by 0 → Infinity, capped to maxDodge
    expect(calculateDodgeChance(100, 0)).toBeCloseTo(0.80);
  });

  it('negative level difference is ignored', () => {
    // Player higher level than monster → no penalty
    // effectiveAvoid = 300 - max(0, -10)/2 = 300
    expect(calculateDodgeChance(300, 250, { levelDifference: -10 })).toBeCloseTo(0.2667, 3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/knockback.test.ts`

Expected: `calculateDodgeChance` tests fail (old sqrt formula produces different values). Other test suites in the file (`calculateKnockbackProbability`, `calculateKnockbackUptime`, `getKnockbackRecovery`) should still pass since they don't call `calculateDodgeChance`.

---

### Task 2: Implement the new `calculateDodgeChance`

**Files:**
- Modify: `packages/engine/src/knockback.ts:20-32` (replace `calculateDodgeChance` function)

- [ ] **Step 1: Replace `calculateDodgeChance` implementation**

Replace lines 20-32 with:

```typescript
/**
 * Calculate dodge chance from avoidability vs boss accuracy.
 *
 * Formula (pre-BB, monster → player, physical touch damage):
 *   effectiveAvoid = avoid - max(0, levelDifference) / 2
 *   dodgeRate = effectiveAvoid / (4.5 * monsterAccuracy)
 *
 * Clamped to class-specific range:
 *   Non-thieves: [2%, 80%]
 *   Thieves (NL, Shadower): [5%, 95%]
 *
 * Source: client code extraction (iPippy, MapleLegends forum),
 *         in-game testing on Royals (jamin, royals.ms/forum/threads/avoidability-question.174715/)
 */
export function calculateDodgeChance(
  avoidability: number,
  bossAccuracy: number,
  options?: { minDodge?: number; maxDodge?: number; levelDifference?: number }
): number {
  const { minDodge = 0.02, maxDodge = 0.80, levelDifference = 0 } = options ?? {};
  const levelPenalty = Math.max(0, levelDifference) / 2;
  const effectiveAvoid = Math.max(0, avoidability - levelPenalty);
  const dodgeRate = bossAccuracy > 0 ? effectiveAvoid / (4.5 * bossAccuracy) : maxDodge;
  return Math.max(minDodge, Math.min(dodgeRate, maxDodge));
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/engine/knockback.test.ts`

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/engine/src/knockback.ts src/engine/knockback.test.ts
git commit -m "replace dodge formula with correct pre-BB linear formula

the old formula (floor(sqrt(avoid)) - floor(sqrt(acc))) was from
SouthPerry's post-Big Bang thread. the correct pre-BB formula is
avoid / (4.5 * accuracy) with class-specific caps."
```

---

### Task 3: Update the simulation pipeline call site

**Files:**
- Modify: `src/proposals/simulate.ts:137-141` (the `calculateDodgeChance` call)

- [ ] **Step 1: Update the call site to pass thief caps**

Replace lines 137-141:

```typescript
        if (scenario.bossAttackInterval != null && scenario.bossAttackInterval > 0) {
          const dodgeChance = calculateDodgeChance(
            effectiveBuild.avoidability ?? 0,
            scenario.bossAccuracy ?? Infinity
          );
```

With:

```typescript
        if (scenario.bossAttackInterval != null && scenario.bossAttackInterval > 0) {
          const isThief = (classData.shadowShifterRate ?? 0) > 0;
          const dodgeChance = calculateDodgeChance(
            effectiveBuild.avoidability ?? 0,
            scenario.bossAccuracy ?? Infinity,
            isThief ? { minDodge: 0.05, maxDodge: 0.95 } : undefined
          );
```

- [ ] **Step 2: Run integration tests to verify existing KB tests pass**

Run: `npx vitest run src/proposals/simulate.test.ts -t "KB"`

Expected: Both KB-related tests pass. The 2% minimum dodge floor is new but tiny — it shifts KB probability from 1.0 to 0.98 for unprotected classes, well within the existing test bounds (which check relative comparisons, not exact values).

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/proposals/simulate.ts
git commit -m "pass thief-specific dodge caps in simulation pipeline

classes with Shadow Shifter (NL, Shadower) use [5%, 95%] caps,
all others use the default [2%, 80%]."
```

---

### Task 4: Update reference documentation

**Files:**
- Modify: `data/references/knockback.md:95-109` (Avoidability Formula section)

- [ ] **Step 1: Replace the avoidability formula section**

Replace the "Avoidability Formula (Monster → Player)" section (lines 95-109) with:

```markdown
## Avoidability Formula (Monster → Player)

**Source:** Client code extraction (iPippy, MapleLegends forum), confirmed on Royals by jamin
**Accessed:** 2026-03-22
**Forum threads:**
- [MapleLegends avoidability formula](https://forum.maplelegends.com/index.php?threads/maplelegends-avoidability-formula.26694/)
- [Royals avoidability question](https://royals.ms/forum/threads/avoidability-question.174715/)

Pre-BB formula for physical (touch) damage:

```
effectiveAvoid = avoid - max(0, monsterLevel - charLevel) / 2
dodgeRate = effectiveAvoid / (4.5 * monsterAccuracy)
```

Class-specific caps:
- Non-thieves: [2%, 80%]
- Thieves (NL, Shadower): [5%, 95%]

At boss accuracy 250 with 0 avoidability, dodge = 2% (non-thief floor).
For a Night Lord with ~300 avoid: `300 / (4.5 * 250) = 26.7%` dodge.

**Previous incorrect formula:** The codebase previously used
`floor(sqrt(avoid)) - floor(sqrt(accuracy))` from SouthPerry's "[BB] All Known
Formulas" thread — this is a post-Big Bang formula, not applicable to
MapleRoyals (v62/pre-BB).

**Not yet modeled:** Magic attack dodge uses a different formula:
`magicDodge = 10/9 - accuracy / (0.9 * avoid)`.
```

- [ ] **Step 2: Commit**

```bash
git add data/references/knockback.md
git commit -m "update knockback reference with correct pre-BB dodge formula"
```

---

### Task 5: Update the web Formulas page

**Files:**
- Modify: `web/src/components/formulas/KnockbackModelingSection.tsx:29-43` (Dodge Chance section)

- [ ] **Step 1: Replace the Dodge Chance section**

Replace lines 29-43 (the `<h4>` through the closing `</p>` of the dodge explanation) with:

```tsx
      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Dodge Chance</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        First, dodge chance is calculated from avoidability vs boss accuracy (pre-BB formula):
      </p>

      <div className="my-6">
        <BlockMath math="\text{dodge} = \frac{\text{avoidability}}{4.5 \times \text{bossAccuracy}}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Clamped to class-specific ranges: [2%, 80%] for non-thieves, [5%, 95%] for thieves
        (Night Lord, Shadower). When the boss is higher level than the player, avoidability
        is reduced by <InlineMath math="(\text{monsterLevel} - \text{charLevel}) / 2" /> first.
        In practice, dodge is small against endgame bosses — a Night Lord with 300 avoid
        vs boss accuracy 250 gets ~27% dodge.
      </p>
```

- [ ] **Step 2: Run type check on the web app**

Run: `cd web && npx tsc --noEmit`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/formulas/KnockbackModelingSection.tsx
git commit -m "update web formulas page with correct dodge formula"
```

---

### Task 6: Update recovery constants (Workstream B)

**Files:**
- Modify: `packages/engine/src/knockback.ts:1-18` (constants) and `getKnockbackRecovery`
- Modify: `src/engine/knockback.test.ts` (tests referencing old constants)
- Modify: `data/references/knockback.md` (recovery time table)
- Modify: `web/src/components/formulas/KnockbackModelingSection.tsx` (recovery time table)

Channel recovery is no longer a separate flat constant — it's `DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP` (0.5 + 0.2 = 0.7s). This keeps channel and burst recovery in sync.

- [ ] **Step 1: Update constants in knockback.ts**

Replace lines 1-18 with:

```typescript
import type { SkillEntry } from './types.js';

/**
 * Default KB recovery time for burst/normal skills (seconds).
 * Blink animation + minor reposition.
 */
export const DEFAULT_KB_RECOVERY = 0.5;

/**
 * Extra wind-up time for channeled skills to restart the channel (seconds).
 * Hurricane and Rapid Fire both have this overhead on top of the base recovery.
 */
export const CHANNEL_WIND_UP = 0.2;

/** Attack time threshold to detect channeled skills (Hurricane/Rapid Fire use 0.12s). */
const CHANNEL_ATTACK_TIME = 0.12;
```

- [ ] **Step 2: Update `getKnockbackRecovery` to derive channel recovery**

Replace the `getKnockbackRecovery` function with:

```typescript
/**
 * Get the KB recovery time for a skill.
 *
 * Priority:
 * 1. Explicit `knockbackRecovery` on the skill (i-frames = 0, custom overrides)
 * 2. Channeled skill heuristic: attackTime === 0.12s → DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP
 * 3. Default: DEFAULT_KB_RECOVERY
 */
export function getKnockbackRecovery(skill: SkillEntry, attackTime: number): number {
  if (skill.knockbackRecovery != null) return skill.knockbackRecovery;
  if (attackTime === CHANNEL_ATTACK_TIME) return DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP;
  return DEFAULT_KB_RECOVERY;
}
```

- [ ] **Step 3: Update tests**

In `src/engine/knockback.test.ts`:

Update the import — replace `CHANNEL_KB_RECOVERY` with `CHANNEL_WIND_UP`:

```typescript
import {
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  DEFAULT_KB_RECOVERY,
  CHANNEL_WIND_UP,
  type SkillEntry,
} from '@metra/engine';
```

In the `calculateKnockbackUptime` tests, update expected values for the new 0.5s recovery:

- "warrior with 90% stance" test: recovery 0.5 → `timeLost = 0.0667 * 0.5 = 0.0333`, uptime ≈ 0.967. Update `toBeCloseTo(0.97, 2)` and the comment to "loses ~3%".
- "Night Lord with 30% shifter" test: recovery 0.5 → `timeLost = 0.467 * 0.5 = 0.2333`, uptime ≈ 0.767. Update `toBeCloseTo(0.77, 2)` and comment to "loses ~23%".
- "Shadower with 40% shifter" test: recovery 0.5 → `timeLost = 0.4 * 0.5 = 0.2`, uptime ≈ 0.80. Update `toBeCloseTo(0.80, 2)` and comment to "loses ~20%".
- "no-defense class with channeled skill" test: recovery becomes 0.7 → `timeLost = 0.667 * 0.7 = 0.4667`, uptime ≈ 0.533. Update `toBeCloseTo(0.533, 2)` and comment.

In the `getKnockbackRecovery` tests:

- Replace `CHANNEL_KB_RECOVERY` with `DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP` in the "detects channeled skills" test:
  ```typescript
  expect(getKnockbackRecovery(skill, 0.12)).toBe(DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP);
  ```

- [ ] **Step 4: Update engine exports**

In `packages/engine/src/index.ts`, replace `CHANNEL_KB_RECOVERY` with `CHANNEL_WIND_UP`:

```typescript
// Knockback
export {
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  DEFAULT_KB_RECOVERY,
  CHANNEL_WIND_UP,
} from './knockback.js';
```

- [ ] **Step 5: Check for other references to `CHANNEL_KB_RECOVERY`**

Search the codebase for any other imports/references to `CHANNEL_KB_RECOVERY`. If any exist in the web app or elsewhere, update them to `CHANNEL_WIND_UP` (or `DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP` if they need the total).

- [ ] **Step 6: Run tests**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 7: Update the recovery time table in knockback.md**

In the "KB Recovery Times" section, update the table to:

```markdown
| Skill Type | Recovery Time | Notes |
|------------|--------------|-------|
| Burst/normal skills | ~0.5s | KB animation + reposition |
| Channeled (Hurricane, Rapid Fire) | ~0.7s | Base recovery (0.5s) + channel restart wind-up (0.2s) |
| I-frame skills (Demolition, Barrage) | 0s | Intangible during animation |
```

Also update the "Model Constants" section:

```markdown
DEFAULT_KB_RECOVERY  = 0.5   // burst skill recovery (seconds)
CHANNEL_WIND_UP      = 0.2   // extra wind-up for channeled skills (seconds)
BOSS_ATTACK_INTERVAL = 1.5   // representative endgame boss (seconds)
BOSS_ACCURACY        = 250   // representative endgame boss accuracy
```

And update the "Expected DPS Loss" table with new values.

- [ ] **Step 8: Update the recovery time table in KnockbackModelingSection.tsx**

Update the `recoveryTimes` array (line 13-17):

```typescript
  const recoveryTimes: Array<{ type: string; time: string; examples: string }> = [
    { type: 'Burst / normal', time: '0.5s', examples: 'Brandish, Crusher, Triple Throw, etc.' },
    { type: 'Channeled', time: '0.7s', examples: 'Hurricane, Rapid Fire (0.5s base + 0.2s wind-up)' },
    { type: 'I-frame', time: '0s', examples: 'Demolition, Barrage' },
  ];
```

- [ ] **Step 9: Commit**

```bash
git add packages/engine/src/knockback.ts packages/engine/src/index.ts src/engine/knockback.test.ts data/references/knockback.md web/src/components/formulas/KnockbackModelingSection.tsx
git commit -m "update KB recovery constants: burst 0.5s, channel 0.5+0.2s wind-up

burst recovery 0.6→0.5s. channel recovery expressed as
DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP (0.7s) instead of a flat 1.0s.
keeps channel in sync if burst constant changes later."
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full test suite (root)**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 2: Run web test suite**

Run: `cd web && npx vitest run`

Expected: All tests pass.

- [ ] **Step 3: Type-check both packages**

Run: `npx tsc --noEmit -p packages/engine/tsconfig.json && cd web && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Visual spot-check the Formulas page**

Run: `cd web && npm run dev`

Open the Formulas page in a browser, scroll to Knockback Modeling. Verify:
- The LaTeX formula shows `avoidability / (4.5 × bossAccuracy)` (not the old sqrt formula)
- The prose mentions class-specific caps and the level penalty
- The rest of the KB section (probability, uptime, recovery) is unchanged
