# Chart Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate DPS bar chart, ranking table, and tier scaling chart when simulation filters change, with strong visual emphasis on the most-affected entries.

**Architecture:** A shared `useAnimatedDps` hook tracks previous DPS values and computes per-entry animation metadata (change ratio, high-impact flag). Called once in `Dashboard`, results flow down to three consumers: `DpsChart` (rAF bar width interpolation + SVG emphasis), `RankingTable` (FLIP row reorder + CSS emphasis + animated counter), and `TierScalingChart` (`dataVersion`-gated Recharts animation + stroke emphasis). All animations respect `prefers-reduced-motion`.

**Tech Stack:** React hooks, requestAnimationFrame, CSS transitions/keyframes, SVG `<animate>`, Recharts animation props

**Spec:** `docs/superpowers/specs/2026-03-18-chart-animations-design.md`

---

### Task 1: Animation Config Constants

**Files:**
- Create: `web/src/utils/animation-config.ts`

- [ ] **Step 1: Create the config file**

```typescript
export const TRANSITION_DURATION_MS = 400;
export const EMPHASIS_DURATION_MS = 1000;
export const HIGH_IMPACT_THRESHOLD = 1.5;
export const UNIFORM_SHIFT_STDDEV_THRESHOLD = 0.05;
export const EMPHASIS_DEBOUNCE_MS = 100;
export const EASING = 'ease-out';
```

- [ ] **Step 2: Commit**

```bash
git add web/src/utils/animation-config.ts
git commit -m "add animation config constants"
```

---

### Task 2: `useAnimatedNumber` Hook

**Files:**
- Create: `web/src/hooks/useAnimatedNumber.ts`
- Create: `web/src/hooks/useAnimatedNumber.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimatedNumber } from './useAnimatedNumber.js';

describe('useAnimatedNumber', () => {
  let rafCallbacks: Array<(time: number) => void>;
  let originalRaf: typeof requestAnimationFrame;
  let originalCaf: typeof cancelAnimationFrame;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    rafCallbacks = [];
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;
    originalMatchMedia = window.matchMedia;
    globalThis.requestAnimationFrame = (cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    };
    globalThis.cancelAnimationFrame = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
    window.matchMedia = originalMatchMedia;
  });

  function flushRaf(time: number) {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach((cb) => cb(time));
  }

  it('returns target value immediately on first render', () => {
    const { result } = renderHook(() => useAnimatedNumber(1000, 400));
    expect(result.current).toBe(1000);
  });

  it('interpolates from old to new value over duration', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 400),
      { initialProps: { target: 1000 } },
    );
    expect(result.current).toBe(1000);

    // Change target
    rerender({ target: 2000 });

    // First rAF: starts the animation
    act(() => flushRaf(0));
    // Halfway through
    act(() => flushRaf(200));
    expect(result.current).toBeGreaterThan(1000);
    expect(result.current).toBeLessThan(2000);

    // At the end
    act(() => flushRaf(400));
    expect(result.current).toBe(2000);
  });

  it('returns target immediately when prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 400),
      { initialProps: { target: 1000 } },
    );
    rerender({ target: 2000 });
    expect(result.current).toBe(2000);
  });

  it('cancels rAF on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ target }) => useAnimatedNumber(target, 400),
      { initialProps: { target: 1000 } },
    );
    rerender({ target: 2000 });
    act(() => flushRaf(0)); // start animation
    unmount();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/hooks/useAnimatedNumber.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

```typescript
import { useState, useEffect, useRef } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimatedNumber(target: number, duration: number): number {
  const [current, setCurrent] = useState(target);
  const prevTarget = useRef(target);
  const rafId = useRef(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTarget.current = target;
      setCurrent(target);
      return;
    }

    if (prefersReducedMotion() || prevTarget.current === target) {
      prevTarget.current = target;
      setCurrent(target);
      return;
    }

    const from = prevTarget.current;
    prevTarget.current = target;
    let startTime = 0;

    const step = (time: number) => {
      if (startTime === 0) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.round(from + (target - from) * progress));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    };

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return current;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/hooks/useAnimatedNumber.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/useAnimatedNumber.ts web/src/hooks/useAnimatedNumber.test.ts
git commit -m "add useAnimatedNumber hook with tests"
```

---

### Task 3: `useAnimatedDps` Hook

**Files:**
- Create: `web/src/hooks/useAnimatedDps.ts`
- Create: `web/src/hooks/useAnimatedDps.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimatedDps, type AnimationEntry } from './useAnimatedDps.js';
import type { ScenarioResult } from '@engine/proposals/types.js';

function makeResult(className: string, skillName: string, tier: string, dpsValue: number): ScenarioResult {
  return {
    className,
    skillName,
    tier,
    scenario: 'Baseline',
    dps: {
      skillName,
      attackTime: 0.6,
      damageRange: { min: 0, max: 0, average: 0 },
      skillDamagePercent: 0,
      critDamagePercent: 0,
      adjustedRangeNormal: 0,
      adjustedRangeCrit: 0,
      averageDamage: 0,
      dps: dpsValue,
      uncappedDps: dpsValue,
      capLossPercent: 0,
      totalCritRate: 0,
      hitCount: 1,
      hasShadowPartner: false,
    },
  };
}

describe('useAnimatedDps', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns zero changeRatio on first render', () => {
    const results = [makeResult('Hero', 'Brandish', 'high', 50000)];
    const { result } = renderHook(() => useAnimatedDps(results, true, true));

    expect(result.current.entries.size).toBe(1);
    const entry = result.current.entries.get('Hero|Brandish|high')!;
    expect(entry.changeRatio).toBe(0);
    expect(entry.isHighImpact).toBe(false);
    expect(entry.previousDps).toBe(50000);
  });

  it('detects high-impact entries after data change', () => {
    const initial = [
      makeResult('Hero', 'Brandish', 'high', 50000),
      makeResult('Night Lord', 'Triple Throw', 'high', 60000),
      makeResult('Paladin', 'Blast', 'high', 40000),
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useAnimatedDps(data, true, true),
      { initialProps: { data: initial } },
    );

    // Night Lord drops massively, others shift slightly
    const updated = [
      makeResult('Hero', 'Brandish', 'high', 48000),
      makeResult('Night Lord', 'Triple Throw', 'high', 40000),
      makeResult('Paladin', 'Blast', 'high', 39000),
    ];
    rerender({ data: updated });

    const nlEntry = result.current.entries.get('Night Lord|Triple Throw|high')!;
    expect(nlEntry.isHighImpact).toBe(true);
    expect(nlEntry.previousDps).toBe(60000);
    expect(nlEntry.changeRatio).toBeGreaterThan(1.5);
  });

  it('suppresses emphasis when all entries shift uniformly', () => {
    const initial = [
      makeResult('Hero', 'Brandish', 'high', 50000),
      makeResult('Night Lord', 'Triple Throw', 'high', 60000),
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useAnimatedDps(data, true, true),
      { initialProps: { data: initial } },
    );

    // Both drop by the same percentage (~10%)
    const updated = [
      makeResult('Hero', 'Brandish', 'high', 45000),
      makeResult('Night Lord', 'Triple Throw', 'high', 54000),
    ];
    rerender({ data: updated });

    for (const [, entry] of result.current.entries) {
      expect(entry.isHighImpact).toBe(false);
    }
  });

  it('returns no animation data when disabled', () => {
    const results = [makeResult('Hero', 'Brandish', 'high', 50000)];
    const { result, rerender } = renderHook(
      ({ data, enabled }) => useAnimatedDps(data, true, enabled),
      { initialProps: { data: results, enabled: false } },
    );

    const updated = [makeResult('Hero', 'Brandish', 'high', 40000)];
    rerender({ data: updated, enabled: false });

    const entry = result.current.entries.get('Hero|Brandish|high')!;
    expect(entry.changeRatio).toBe(0);
    expect(entry.isHighImpact).toBe(false);
  });

  it('handles zero change (no division by zero)', () => {
    const results = [makeResult('Hero', 'Brandish', 'high', 50000)];
    const { result, rerender } = renderHook(
      ({ data }) => useAnimatedDps(data, true, true),
      { initialProps: { data: results } },
    );

    // Same data again
    rerender({ data: [...results] });
    const entry = result.current.entries.get('Hero|Brandish|high')!;
    expect(entry.changeRatio).toBe(0);
    expect(entry.isHighImpact).toBe(false);
  });

  it('exposes prefersReducedMotion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useAnimatedDps([], true, true));
    expect(result.current.prefersReducedMotion).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/hooks/useAnimatedDps.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

```typescript
import { useRef, useMemo, useEffect, useState } from 'react';
import type { ScenarioResult } from '@engine/proposals/types.js';
import { HIGH_IMPACT_THRESHOLD, UNIFORM_SHIFT_STDDEV_THRESHOLD, EMPHASIS_DEBOUNCE_MS } from '../utils/animation-config.js';

export interface AnimationEntry {
  previousDps: number;
  changeRatio: number;
  isHighImpact: boolean;
}

export interface AnimatedDpsResult {
  entries: Map<string, AnimationEntry>;
  transitionId: number;
  prefersReducedMotion: boolean;
}

function entryKey(className: string, skillName: string, tier: string): string {
  return `${className}|${skillName}|${tier}`;
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimatedDps(
  results: ScenarioResult[],
  capEnabled: boolean,
  enabled: boolean,
): AnimatedDpsResult {
  const prevMapRef = useRef<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);
  const [transitionId, setTransitionId] = useState(0);
  const reducedMotion = getReducedMotion();

  const currentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of results) {
      const dps = Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps);
      map.set(entryKey(r.className, r.skillName, r.tier), dps);
    }
    return map;
  }, [results, capEnabled]);

  const entries = useMemo(() => {
    const map = new Map<string, AnimationEntry>();
    const prevMap = prevMapRef.current;

    if (isFirstRender.current || !enabled || reducedMotion) {
      for (const [key, dps] of currentMap) {
        map.set(key, { previousDps: dps, changeRatio: 0, isHighImpact: false });
      }
      return map;
    }

    // Compute deltas
    const deltas: { key: string; current: number; previous: number; absDelta: number; pctChange: number }[] = [];
    for (const [key, dps] of currentMap) {
      const prev = prevMap.get(key);
      if (prev === undefined) {
        map.set(key, { previousDps: dps, changeRatio: 0, isHighImpact: false });
        continue;
      }
      const absDelta = Math.abs(dps - prev);
      const pctChange = prev !== 0 ? absDelta / prev : 0;
      deltas.push({ key, current: dps, previous: prev, absDelta, pctChange });
    }

    if (deltas.length === 0) return map;

    const totalAbsDelta = deltas.reduce((sum, d) => sum + d.absDelta, 0);
    const meanAbsDelta = totalAbsDelta / deltas.length;

    // Check for uniform shift: stddev of percentage changes
    const meanPctChange = deltas.reduce((sum, d) => sum + d.pctChange, 0) / deltas.length;
    const variance = deltas.reduce((sum, d) => sum + (d.pctChange - meanPctChange) ** 2, 0) / deltas.length;
    const stddev = Math.sqrt(variance);
    const isUniformShift = stddev < UNIFORM_SHIFT_STDDEV_THRESHOLD;

    for (const d of deltas) {
      const changeRatio = meanAbsDelta > 0 ? d.absDelta / meanAbsDelta : 0;
      const isHighImpact = !isUniformShift && changeRatio > HIGH_IMPACT_THRESHOLD;
      map.set(d.key, { previousDps: d.previous, changeRatio, isHighImpact });
    }

    return map;
  }, [currentMap, enabled, reducedMotion]);

  // Update prevMap and transitionId after computing entries
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevMapRef.current = currentMap;
      return;
    }

    // Check if data actually changed
    const prevMap = prevMapRef.current;
    let changed = prevMap.size !== currentMap.size;
    if (!changed) {
      for (const [key, dps] of currentMap) {
        if (prevMap.get(key) !== dps) {
          changed = true;
          break;
        }
      }
    }

    prevMapRef.current = currentMap;

    if (changed && enabled) {
      // Debounce emphasis so rapid toggles don't flicker
      const timer = setTimeout(() => {
        setTransitionId((id) => id + 1);
      }, EMPHASIS_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }
  }, [currentMap, enabled]);

  return { entries, transitionId, prefersReducedMotion: reducedMotion };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/hooks/useAnimatedDps.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/useAnimatedDps.ts web/src/hooks/useAnimatedDps.test.ts
git commit -m "add useAnimatedDps hook with tests"
```

---

### Task 4: CSS Keyframes for Emphasis

**Files:**
- Modify: `web/src/index.css:26-50`

- [ ] **Step 1: Add keyframes and reduced-motion overrides to index.css**

Add after the existing `@layer base { ... }` block (after line 50):

```css
@keyframes row-emphasis {
  0% { background-color: var(--emphasis-color, rgba(59, 130, 246, 0.15)); }
  100% { background-color: transparent; }
}

.animate-row-emphasis {
  animation: row-emphasis 1s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-row-emphasis {
    animation: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/index.css
git commit -m "add row emphasis keyframe animation"
```

---

### Task 5: Wire `useAnimatedDps` into Dashboard

**Files:**
- Modify: `web/src/components/Dashboard.tsx:1-2,29-32,78,123,127`
- Modify: `web/src/components/DpsChart.tsx:48-52` (add new props)
- Modify: `web/src/components/dashboard/RankingTable.tsx:57-67` (add new props)
- Modify: `web/src/components/TierScalingChart.tsx:19-26` (add new props)

This task only adds the prop plumbing. Each consumer ignores the new props until its own task.

- [ ] **Step 1: Add import and hook call to Dashboard**

In `web/src/components/Dashboard.tsx`:

Add import (after line 16):
```typescript
import { useAnimatedDps } from '../hooks/useAnimatedDps.js';
```

Add hook call after the `filtered` memo (after line 58):
```typescript
  const animationEnabled = !editEnabled && !comparison.result;
  const animation = useAnimatedDps(filtered, capEnabled, animationEnabled);
```

- [ ] **Step 2: Pass animation props to DpsChart**

In `web/src/components/Dashboard.tsx`, update the `DpsChart` usage (line 123):

```tsx
<DpsChart data={filtered} editComparison={editEnabled ? comparison.result : null} breakdownMap={showBreakdown ? breakdownMap : undefined} animation={animation} />
```

- [ ] **Step 3: Pass animation props to RankingTable**

In `web/src/components/Dashboard.tsx`, update the `RankingTable` usage (line 127):

```tsx
<RankingTable data={filtered} allResults={results} capEnabled={capEnabled} editComparison={editEnabled ? comparison.result : null} animation={animation} />
```

- [ ] **Step 4: Pass animation props to TierScalingChart**

In `web/src/components/Dashboard.tsx`, update the `TierScalingChart` usage (line 78):

```tsx
<TierScalingChart data={results} capEnabled={capEnabled} activeGroups={activeGroups} targetCount={targetCount} selectedTier={selectedTier} editComparison={editEnabled ? comparison.result : null} animation={animation} />
```

- [ ] **Step 5: Add animation prop to DpsChart interface**

In `web/src/components/DpsChart.tsx`, update the props interface (around line 48):

```typescript
import type { AnimatedDpsResult } from '../hooks/useAnimatedDps.js';

interface DpsChartProps {
  data: ScenarioResult[];
  editComparison?: ComparisonResult | null;
  breakdownMap?: BuffBreakdownMap;
  animation?: AnimatedDpsResult;
}
```

Update function signature to destructure `animation`:
```typescript
export function DpsChart({ data, editComparison, breakdownMap, animation }: DpsChartProps) {
```

- [ ] **Step 6: Add animation prop to RankingTable**

In `web/src/components/dashboard/RankingTable.tsx`, update the props (around line 62):

```typescript
import type { AnimatedDpsResult } from '../../hooks/useAnimatedDps.js';
```

Add `animation?: AnimatedDpsResult` to the destructured props in the function signature.

- [ ] **Step 7: Add animation prop to TierScalingChart**

In `web/src/components/TierScalingChart.tsx`, update the interface (around line 19):

```typescript
import type { AnimatedDpsResult } from '../hooks/useAnimatedDps.js';

interface TierScalingChartProps {
  data: ScenarioResult[];
  capEnabled: boolean;
  activeGroups: Set<SkillGroupId>;
  targetCount: number;
  selectedTier: string;
  editComparison?: ComparisonResult | null;
  animation?: AnimatedDpsResult;
}
```

Update function signature to destructure `animation`.

- [ ] **Step 8: Run type check to verify no errors**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (animation prop is optional everywhere, so existing usage is fine)

- [ ] **Step 9: Run full tests to verify nothing broke**

Run: `cd web && npx vitest run`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add web/src/components/Dashboard.tsx web/src/components/DpsChart.tsx web/src/components/dashboard/RankingTable.tsx web/src/components/TierScalingChart.tsx
git commit -m "wire useAnimatedDps into dashboard and chart components"
```

---

### Task 6: DPS Bar Chart — Width Animation + Emphasis

**Files:**
- Modify: `web/src/components/DpsChart.tsx`

- [ ] **Step 1: Add rAF interpolation state to DpsChart**

In `web/src/components/DpsChart.tsx`, add imports and interpolation logic inside the `DpsChart` function, after the existing `chartData` memo:

```typescript
import { useMemo, useRef, useState, useEffect } from 'react';
import { TRANSITION_DURATION_MS } from '../utils/animation-config.js';
```

Add inside `DpsChart`, after `chartData`:

```typescript
  // rAF-based bar width interpolation
  const interpolatedRef = useRef<Map<string, number>>(new Map());
  const rafsRef = useRef<Map<string, number>>(new Map());
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!animation || animation.prefersReducedMotion || editComparison || showStacked) {
      // No animation: set all to final values
      interpolatedRef.current = new Map(chartData.map((d) => [d.uid, d.dps]));
      return;
    }

    // Start rAF loops for entries with previousDps
    for (const d of chartData) {
      const key = `${d.className}|${d.skillLabel}|${d.sublabel.toLowerCase()}`;
      const animEntry = animation.entries.get(key);
      const from = animEntry?.previousDps ?? d.dps;
      const to = d.dps;

      if (from === to) {
        interpolatedRef.current.set(d.uid, to);
        continue;
      }

      let startTime = 0;
      const step = (time: number) => {
        if (startTime === 0) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION_MS, 1);
        interpolatedRef.current.set(d.uid, Math.round(from + (to - from) * progress));
        forceRender((n) => n + 1);
        if (progress < 1) {
          rafsRef.current.set(d.uid, requestAnimationFrame(step));
        }
      };

      // Cancel any existing animation for this entry
      const existingRaf = rafsRef.current.get(d.uid);
      if (existingRaf) cancelAnimationFrame(existingRaf);
      rafsRef.current.set(d.uid, requestAnimationFrame(step));
    }

    return () => {
      for (const id of rafsRef.current.values()) cancelAnimationFrame(id);
      rafsRef.current.clear();
    };
  }, [chartData, animation, editComparison, showStacked]);
```

- [ ] **Step 2: Create AnimatedBarShape component**

Add this after the existing `GhostBarShape` function (around line 40):

```typescript
function AnimatedBarShape(props: unknown) {
  const { x, y, width, height, fill, fillOpacity, isHighImpact, transitionId } = props as {
    x: number; y: number; width: number; height: number;
    fill: string; fillOpacity: number;
    isHighImpact?: boolean; transitionId?: number;
  };

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} fill={fill} fillOpacity={fillOpacity}>
        {isHighImpact && (
          <animate
            key={transitionId}
            attributeName="fill-opacity"
            values="0.8;1;0.5;0.8"
            keyTimes="0;0.3;0.7;1"
            dur="1s"
            fill="remove"
          />
        )}
      </rect>
      {isHighImpact && (
        <rect x={x} y={y} width={width} height={height} rx={3} fill={fill} fillOpacity={0} filter={`drop-shadow(0 0 6px ${fill})`}>
          <animate
            key={transitionId}
            attributeName="fill-opacity"
            values="0;0.4;0"
            keyTimes="0;0.3;1"
            dur="1s"
            fill="remove"
          />
        </rect>
      )}
    </g>
  );
}
```

- [ ] **Step 3: Update chartData to include animation metadata**

In the `chartData` mapping, add interpolated DPS and animation fields. Update the `return` inside `data.map(...)` to include:

```typescript
      const animKey = `${r.className}|${r.skillName}|${r.tier}`;
      const animEntry = animation?.entries.get(animKey);

      return {
        // ... existing fields ...
        interpolatedDps: interpolatedRef.current.get(`${r.className} — ${r.skillName} [${r.tier}]`) ?? dps,
        isHighImpact: animEntry?.isHighImpact ?? false,
        transitionId: animation?.transitionId ?? 0,
      };
```

- [ ] **Step 4: Update renderBars to use AnimatedBarShape when animation is active**

Update the `renderBars` function signature to accept `animation`:

```typescript
function renderBars(
  showStacked: boolean,
  chartData: ChartEntry[],
  editComparison: ComparisonResult | null | undefined,
  animation: AnimatedDpsResult | undefined,
): React.ReactElement[] {
```

In the non-stacked branch, choose shape based on mode:

```typescript
  const useAnimated = !editComparison && animation && !animation.prefersReducedMotion;
  return [
    <Bar
      key="dps"
      dataKey={useAnimated ? 'interpolatedDps' : 'dps'}
      radius={[0, 3, 3, 0]}
      barSize={18}
      shape={editComparison ? GhostBarShape : (useAnimated ? AnimatedBarShape : undefined)}
    >
      {chartData.map((entry, index) => (
        <Cell
          key={index}
          fill={getClassColor(entry.className)}
          fillOpacity={0.8}
          {...(useAnimated ? { isHighImpact: entry.isHighImpact, transitionId: entry.transitionId } : {})}
        />
      ))}
    </Bar>,
  ];
```

Update the call site (line 209) to pass `animation`:
```typescript
{renderBars(showStacked, chartData, editComparison, animation)}
```

- [ ] **Step 5: Update ChartEntry type**

Add the new fields to the `ChartEntry` type:

```typescript
type ChartEntry = {
  className: string;
  dps: number;
  baseDps: number;
  seDps: number;
  siDps: number;
  echoDps: number;
  baselineDps?: number;
  interpolatedDps: number;
  isHighImpact: boolean;
  transitionId: number;
  [key: string]: unknown;
};
```

- [ ] **Step 6: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Run tests**

Run: `cd web && npx vitest run`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add web/src/components/DpsChart.tsx
git commit -m "add bar width animation and high-impact emphasis to DPS chart"
```

---

### Task 7: Ranking Table — FLIP Row Reorder

**Files:**
- Modify: `web/src/components/dashboard/RankingTable.tsx`

- [ ] **Step 1: Add FLIP refs and layout effect**

Add imports at the top:

```typescript
import { Fragment, useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { TRANSITION_DURATION_MS } from '../../utils/animation-config.js';
```

Inside `RankingTable`, add refs and FLIP logic:

```typescript
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());

  // FLIP: after each layout, compare old positions to new and animate the delta.
  // prevPositions is updated at the END of each useLayoutEffect cycle,
  // so next time it fires, it has the "before" snapshot.
  useLayoutEffect(() => {
    if (!animation || animation.prefersReducedMotion) {
      // Still capture positions so they're ready when animation enables
      const positions = new Map<string, number>();
      for (const [key, el] of rowRefs.current) {
        positions.set(key, el.getBoundingClientRect().top);
      }
      prevPositions.current = positions;
      return;
    }

    const prev = prevPositions.current;

    // Apply FLIP transforms
    if (prev.size > 0) {
      for (const [key, el] of rowRefs.current) {
        const oldTop = prev.get(key);
        if (oldTop === undefined) continue;
        const newTop = el.getBoundingClientRect().top;
        const delta = oldTop - newTop;
        if (Math.abs(delta) < 1) continue;
        // Skip expanded rows
        if (expandedRows.has(key)) continue;

        el.style.transform = `translateY(${delta}px)`;
        el.style.transition = 'none';

        requestAnimationFrame(() => {
          el.style.transition = `transform ${TRANSITION_DURATION_MS}ms ease-out`;
          el.style.transform = '';
        });
      }
    }

    // Snapshot current positions for next cycle
    const positions = new Map<string, number>();
    for (const [key, el] of rowRefs.current) {
      positions.set(key, el.getBoundingClientRect().top);
    }
    prevPositions.current = positions;
  }, [sorted, animation?.transitionId]);
```

- [ ] **Step 2: Add ref callbacks to table rows**

Update the `<tr>` for each data row (around line 284) to include a ref callback and `position: relative`:

```tsx
<tr
  ref={(el) => {
    if (el) rowRefs.current.set(rowKey, el);
    else rowRefs.current.delete(rowKey);
  }}
  style={{ position: 'relative' }}
  className={`border-b border-border-subtle hover:bg-white/[0.03] cursor-pointer ${
    change ? 'border-l-2 border-l-accent' : ''
  }`}
  onClick={() => toggleRow(rowKey)}
>
```

- [ ] **Step 3: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/dashboard/RankingTable.tsx
git commit -m "add FLIP row reorder animation to ranking table"
```

---

### Task 8: Ranking Table — High-Impact Emphasis + Animated Counter

**Files:**
- Modify: `web/src/components/dashboard/RankingTable.tsx`

- [ ] **Step 1: Add emphasis to high-impact rows via inline style**

Import animation config:
```typescript
import { EMPHASIS_DURATION_MS, TRANSITION_DURATION_MS } from '../../utils/animation-config.js';
```

Add emphasis state tracking inside `RankingTable` (after the FLIP refs):

```typescript
  // Track which rows are currently emphasized and when the emphasis started
  const [emphasisTransitionId, setEmphasisTransitionId] = useState(-1);
  const [emphasisFading, setEmphasisFading] = useState(false);

  useEffect(() => {
    if (!animation || animation.transitionId === emphasisTransitionId) return;
    // New transition — start emphasis
    setEmphasisTransitionId(animation.transitionId);
    setEmphasisFading(false);
    const timer = setTimeout(() => setEmphasisFading(true), EMPHASIS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [animation?.transitionId]);
```

In the row rendering (around line 284), compute emphasis state. **Do NOT change the Fragment key** — that would break FLIP by remounting DOM elements:

```typescript
const animKey = `${r.className}|${r.skillName}|${r.tier}`;
const animEntry = animation?.entries.get(animKey);
const isHighImpact = animEntry?.isHighImpact && !emphasisFading;
```

Set emphasis via inline `backgroundColor` style on the `<tr>` (this avoids CSS animation re-trigger issues and coexists with FLIP transforms):

```tsx
style={{
  position: 'relative',
  backgroundColor: isHighImpact ? `${getClassColor(r.className)}26` : undefined,
  transition: 'background-color 1s ease-out',
}}
```

The emphasis starts as a colored background, then fades to transparent via the CSS transition when `emphasisFading` flips to true (which removes the backgroundColor, transitioning to transparent).

- [ ] **Step 2: Add animated DPS counter**

Import `useAnimatedNumber`:
```typescript
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber.js';
```

Create a small wrapper component for the animated DPS cell (add before `RankingTable`):

```typescript
function AnimatedDpsCell({ value, prefersReducedMotion }: { value: number; prefersReducedMotion: boolean }) {
  const animated = useAnimatedNumber(value, prefersReducedMotion ? 0 : TRANSITION_DURATION_MS);
  return <>{formatDps(animated)}</>;
}
```

Update the DPS display cell (around line 314) to use the animated value:

```tsx
<td className="px-3 py-2 text-right tabular-nums">
  <div className="flex items-center justify-end gap-2">
    {animation && !animation.prefersReducedMotion
      ? <AnimatedDpsCell value={displayDps} prefersReducedMotion={animation.prefersReducedMotion} />
      : formatDps(displayDps)}
    {change !== 0 && (
      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
        change > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
      }`}>
        {change > 0 ? '+' : ''}{changePercent.toFixed(1)}%
      </span>
    )}
  </div>
</td>
```

- [ ] **Step 3: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Run tests**

Run: `cd web && npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/dashboard/RankingTable.tsx
git commit -m "add row emphasis and animated DPS counter to ranking table"
```

---

### Task 9: Tier Scaling Line Chart — Animation + Emphasis

**Files:**
- Modify: `web/src/components/TierScalingChart.tsx`

- [ ] **Step 1: Add dataVersion ref for gated animation**

Inside `TierScalingChart`, add a version counter that increments only when chart data changes:

```typescript
import { useState, useMemo, useRef, useEffect } from 'react';
import { TRANSITION_DURATION_MS, EMPHASIS_DURATION_MS } from '../utils/animation-config.js';
```

After the existing `chartData` memo:

```typescript
  const dataVersion = useRef(0);
  const prevChartDataRef = useRef(chartData);
  if (prevChartDataRef.current !== chartData) {
    dataVersion.current += 1;
    prevChartDataRef.current = chartData;
  }
```

- [ ] **Step 2: Add high-impact emphasis state**

```typescript
  const [emphasizedKeys, setEmphasizedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!animation || animation.prefersReducedMotion) return;
    const highImpact = new Set<string>();
    for (const line of lines) {
      const key = `${line.className}|${line.skillName}|${selectedTier}`;
      const entry = animation.entries.get(key);
      if (entry?.isHighImpact) highImpact.add(line.key);
    }
    if (highImpact.size === 0) return;
    setEmphasizedKeys(highImpact);
    const timer = setTimeout(() => setEmphasizedKeys(new Set()), EMPHASIS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [animation?.transitionId]);
```

- [ ] **Step 3: Update Line components with animation props**

Recharts `<Line>` does NOT have an `animationId` prop. To prevent animation from re-triggering on hover (which changes `strokeWidth`/`strokeOpacity`), use a composite `key` that includes `dataVersion` — this remounts the `<Line>` component only on data changes, and the mount animation plays once. Hover-driven re-renders don't change the key, so they don't re-trigger animation.

In the `lines.map(...)` (around line 223), update each `<Line>`:

```typescript
const isEmphasized = emphasizedKeys.has(line.key);
const effectiveStrokeWidth = isEmphasized ? 4 : (isHovered ? 3 : 2);
const effectiveStrokeOpacity = isEmphasized ? 1 : (isDimmed ? 0.12 : 0.85);

return (
  <Line
    key={`${line.key}-v${dataVersion.current}`}
    type="monotone"
    dataKey={line.key}
    stroke={getClassColor(line.className)}
    strokeWidth={effectiveStrokeWidth}
    strokeOpacity={effectiveStrokeOpacity}
    dot={{
      fill: getClassColor(line.className),
      r: isHovered ? 5 : (isEmphasized ? 4 : 3),
      fillOpacity: isDimmed ? 0.12 : 1,
      strokeWidth: 0,
    }}
    activeDot={{
      r: 5,
      fill: getClassColor(line.className),
      strokeWidth: 0,
      onMouseEnter: () => setHoveredKey(line.key),
    }}
    isAnimationActive={!animation?.prefersReducedMotion}
    animationDuration={TRANSITION_DURATION_MS}
    animationEasing="ease-out"
    connectNulls
    label={/* ... existing label function unchanged ... */}
    onMouseEnter={() => setHoveredKey(line.key)}
    onMouseLeave={() => setHoveredKey(null)}
  />
);
```

**Note:** Using `dataVersion` in the key means Recharts remounts all `<Line>` components on data changes. The mount animation (lines drawing from previous to new path) is the desired effect. On hover, the key is stable so no remount occurs — strokeWidth/strokeOpacity changes apply instantly without re-triggering path animation. If this causes issues (e.g., tooltip state lost on remount), fall back to `isAnimationActive={false}` and use CSS `d` property transitions on the SVG paths instead.

- [ ] **Step 4: Run type check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Run tests**

Run: `cd web && npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/components/TierScalingChart.tsx
git commit -m "add line animation and high-impact emphasis to tier scaling chart"
```

---

### Task 10: Integration Test + Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Run full test suite**

Run: `cd web && npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run type check on engine and web**

Run: `npx tsc --noEmit && cd web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Manual smoke test**

Run: `cd web && npm run dev`

Verify in browser:
1. Toggle SE off → bars smoothly shrink, highest-impact bars pulse/glow, table rows slide to new positions, DPS numbers count down, tier scaling lines animate to new positions
2. Toggle SE back on → reverse animation
3. Toggle KB → similar animation behavior
4. Change target count → smooth transitions
5. Verify edit mode → no animations, ghost bars work as before
6. Verify stacked breakdown mode → bars update instantly, no animation glitch
7. Verify initial page load → no animation on first render
8. Check `prefers-reduced-motion` (Chrome DevTools → Rendering → Emulate CSS media feature) → all animations disabled

- [ ] **Step 4: Commit any fixes from smoke testing**

If needed, fix and commit.

- [ ] **Step 5: Final commit with all changes**

If all tests pass and smoke test looks good, push the branch.
