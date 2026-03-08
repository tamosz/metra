# Proposal Builder Redesign — What-If Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the separate Proposal Builder page with a "What If" toggle on the Dashboard that enables inline skill editing and live before/after comparison.

**Architecture:** Add what-if state (mode toggle, proposal changes, comparison results) to `SimulationControlsContext`. When active, the detail panel gains editable fields, the ranking table shows delta badges, the chart shows ghost bars, and a changes popover provides export. The existing engine comparison pipeline (`compareProposal`) is reused. ~8 proposal-specific components are deleted.

**Tech Stack:** React, TypeScript, Recharts, existing engine (`@engine/proposals/*`, `@metra/engine`), lz-string URL encoding.

---

### Task 1: Add what-if state to SimulationControlsContext

**Files:**
- Modify: `web/src/context/SimulationControlsContext.tsx`
- Modify: `web/src/hooks/useSimulation.ts` (for type imports only)

**Step 1: Write tests for the new context state**

Create `web/src/context/SimulationControlsContext.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react';
import { SimulationControlsProvider, useSimulationControls } from './SimulationControlsContext.js';
import type { ProposalChange } from '@engine/proposals/types.js';

function wrapper({ children }: { children: React.ReactNode }) {
  return <SimulationControlsProvider>{children}</SimulationControlsProvider>;
}

describe('what-if state', () => {
  it('starts with what-if mode off and empty changes', () => {
    const { result } = renderHook(() => useSimulationControls(), { wrapper });
    expect(result.current.whatIfEnabled).toBe(false);
    expect(result.current.whatIfChanges).toEqual([]);
    expect(result.current.whatIfMeta).toEqual({ name: '', author: '' });
  });

  it('toggles what-if mode', () => {
    const { result } = renderHook(() => useSimulationControls(), { wrapper });
    act(() => result.current.setWhatIfEnabled(true));
    expect(result.current.whatIfEnabled).toBe(true);
  });

  it('adds and removes changes', () => {
    const { result } = renderHook(() => useSimulationControls(), { wrapper });
    const change: ProposalChange = { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 };
    act(() => result.current.addWhatIfChange(change));
    expect(result.current.whatIfChanges).toEqual([change]);
    act(() => result.current.removeWhatIfChange(0));
    expect(result.current.whatIfChanges).toEqual([]);
  });

  it('clears changes when what-if mode is turned off', () => {
    const { result } = renderHook(() => useSimulationControls(), { wrapper });
    const change: ProposalChange = { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 };
    act(() => {
      result.current.setWhatIfEnabled(true);
      result.current.addWhatIfChange(change);
    });
    expect(result.current.whatIfChanges).length(1);
    act(() => result.current.setWhatIfEnabled(false));
    expect(result.current.whatIfChanges).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/context/SimulationControlsContext.test.tsx`
Expected: FAIL — `whatIfEnabled`, `whatIfChanges`, etc. don't exist on context type.

**Step 3: Add what-if state to the context**

In `web/src/context/SimulationControlsContext.tsx`:

Add import at top:
```ts
import type { ProposalChange } from '@engine/proposals/types.js';
```

Add to `SimulationControlsContextType` interface (after line 27):
```ts
  whatIfEnabled: boolean;
  setWhatIfEnabled: (enabled: boolean) => void;
  whatIfChanges: ProposalChange[];
  addWhatIfChange: (change: ProposalChange) => void;
  removeWhatIfChange: (index: number) => void;
  updateWhatIfChange: (index: number, change: ProposalChange) => void;
  clearWhatIfChanges: () => void;
  whatIfMeta: { name: string; author: string };
  setWhatIfMeta: (meta: { name: string; author: string }) => void;
```

Add state in `SimulationControlsProvider` (after line 42):
```ts
  const [whatIfEnabled, setWhatIfEnabledRaw] = useState(false);
  const [whatIfChanges, setWhatIfChanges] = useState<ProposalChange[]>([]);
  const [whatIfMeta, setWhatIfMeta] = useState({ name: '', author: '' });

  const setWhatIfEnabled = useCallback((enabled: boolean) => {
    setWhatIfEnabledRaw(enabled);
    if (!enabled) {
      setWhatIfChanges([]);
      setWhatIfMeta({ name: '', author: '' });
    }
  }, []);

  const addWhatIfChange = useCallback((change: ProposalChange) => {
    setWhatIfChanges(prev => [...prev, change]);
  }, []);

  const removeWhatIfChange = useCallback((index: number) => {
    setWhatIfChanges(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateWhatIfChange = useCallback((index: number, change: ProposalChange) => {
    setWhatIfChanges(prev => prev.map((c, i) => i === index ? change : c));
  }, []);

  const clearWhatIfChanges = useCallback(() => {
    setWhatIfChanges([]);
  }, []);
```

Add these to the `value` useMemo and its dependency array.

You'll also need to add `useCallback` to the React import on line 1.

**Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/context/SimulationControlsContext.test.tsx`
Expected: PASS

**Step 5: Commit**

```
add what-if state to simulation controls context
```

---

### Task 2: Create useWhatIfComparison hook

This hook runs `compareProposal` reactively when what-if changes exist, debounced.

**Files:**
- Create: `web/src/hooks/useWhatIfComparison.ts`
- Create: `web/src/hooks/useWhatIfComparison.test.ts`

**Step 1: Write the failing test**

Create `web/src/hooks/useWhatIfComparison.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWhatIfComparison } from './useWhatIfComparison.js';
import type { ProposalChange } from '@engine/proposals/types.js';

describe('useWhatIfComparison', () => {
  it('returns null when changes are empty', () => {
    const { result } = renderHook(() => useWhatIfComparison({
      changes: [],
      targetCount: 1,
    }));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns a comparison result for valid changes', () => {
    const changes: ProposalChange[] = [
      { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
    ];
    const { result } = renderHook(() => useWhatIfComparison({
      changes,
      targetCount: 1,
    }));
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.deltas.length).toBeGreaterThan(0);
  });

  it('returns error for invalid changes', () => {
    const changes: ProposalChange[] = [
      { target: 'nonexistent.skill', field: 'basePower', to: 100 },
    ];
    const { result } = renderHook(() => useWhatIfComparison({
      changes,
      targetCount: 1,
    }));
    expect(result.current.error).not.toBeNull();
    expect(result.current.result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/hooks/useWhatIfComparison.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the hook**

Create `web/src/hooks/useWhatIfComparison.ts`:

```ts
import { useMemo } from 'react';
import { compareProposal } from '@engine/proposals/compare.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ProposalChange, ComparisonResult, ScenarioConfig } from '@engine/proposals/types.js';
import type { BuffOverrides } from '../components/BuffToggles.js';
import { applyCgsOverride, type CgsValues } from '../utils/cgs.js';

import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';

export interface WhatIfComparisonOptions {
  changes: ProposalChange[];
  targetCount?: number;
  elementModifiers?: Record<string, number>;
  buffOverrides?: BuffOverrides;
  kbConfig?: { bossAttackInterval: number; bossAccuracy: number };
  cgsOverride?: { tier: string; values: CgsValues };
  efficiencyOverrides?: Record<string, number[]>;
}

export interface WhatIfComparisonResult {
  result: ComparisonResult | null;
  error: Error | null;
}

export function useWhatIfComparison(options: WhatIfComparisonOptions): WhatIfComparisonResult {
  const { changes, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides } = options;

  return useMemo(() => {
    if (changes.length === 0) {
      return { result: null, error: null };
    }

    try {
      const { classNames, tiers, classDataMap, gearTemplates } = discoveredData;

      let finalTemplates = new Map(gearTemplates);
      if (cgsOverride) {
        finalTemplates = applyCgsOverride(
          finalTemplates,
          classDataMap,
          classNames,
          cgsOverride.tier,
          cgsOverride.values,
        );
      }

      const hasElementMods = elementModifiers && Object.keys(elementModifiers).length > 0;
      const hasBuffOverrides = buffOverrides && Object.keys(buffOverrides).length > 0;
      const hasEfficiencyOverrides = efficiencyOverrides && Object.keys(efficiencyOverrides).length > 0;

      const scenario: ScenarioConfig = { name: 'Baseline' };
      if (hasElementMods) scenario.elementModifiers = { ...elementModifiers };
      if (hasBuffOverrides) scenario.overrides = { ...buffOverrides };
      if (kbConfig) {
        scenario.bossAttackInterval = kbConfig.bossAttackInterval;
        scenario.bossAccuracy = kbConfig.bossAccuracy;
      }
      if (hasEfficiencyOverrides) scenario.efficiencyOverrides = { ...efficiencyOverrides };

      const scenarios: ScenarioConfig[] = [scenario];
      if (targetCount != null && targetCount > 1) {
        const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
        if (hasElementMods) training.elementModifiers = { ...elementModifiers };
        if (hasBuffOverrides) training.overrides = { ...buffOverrides };
        if (kbConfig) {
          training.bossAttackInterval = kbConfig.bossAttackInterval;
          training.bossAccuracy = kbConfig.bossAccuracy;
        }
        if (hasEfficiencyOverrides) training.efficiencyOverrides = { ...efficiencyOverrides };
        scenarios.push(training);
      }

      const config: SimulationConfig = { classes: classNames, tiers, scenarios };
      const proposal = { name: '', author: '', changes };

      const result = compareProposal(
        proposal,
        config,
        classDataMap,
        finalTemplates,
        weaponData,
        attackSpeedData,
        mwData,
      );

      return { result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, [changes, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides]);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/hooks/useWhatIfComparison.test.ts`
Expected: PASS

**Step 5: Commit**

```
add useWhatIfComparison hook
```

---

### Task 3: Add What-If toggle to Dashboard toolbar

**Files:**
- Modify: `web/src/components/Dashboard.tsx`

**Step 1: Add the toggle to the toolbar**

In `web/src/components/Dashboard.tsx`:

Add to imports:
```ts
import type { ProposalChange } from '@engine/proposals/types.js';
```

In the component, after line 29 (`const [showAllSkills, setShowAllSkills] = useState(false);`), destructure what-if state:
```ts
  const { whatIfEnabled, setWhatIfEnabled, whatIfChanges } = useSimulationControls();
```

Note: `useSimulationControls` is already imported and called on line 27. Merge the destructuring — add `whatIfEnabled`, `setWhatIfEnabled`, `whatIfChanges` to the existing destructure on line 27.

In the toolbar `<div>` (line 57), add after the `AllSkillsToggle` (line 81) and before `EfficiencyPanel` (line 82):
```tsx
        <WhatIfToggle
          enabled={whatIfEnabled}
          changeCount={whatIfChanges.length}
          onToggle={setWhatIfEnabled}
        />
```

Add the `WhatIfToggle` component at the bottom of the file (after `AllSkillsToggle`):
```tsx
function WhatIfToggle({ enabled, changeCount, onToggle }: { enabled: boolean; changeCount: number; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">What If</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Exit what-if mode' : 'Enter what-if mode to tweak skill values'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          {enabled && changeCount > 0 ? `${changeCount} change${changeCount !== 1 ? 's' : ''}` : 'Edit'}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify it renders**

Run: `cd web && npx vitest run`
Expected: existing tests pass, toggle appears in toolbar.

**Step 3: Commit**

```
add what-if toggle to dashboard toolbar
```

---

### Task 4: Inline editing in SkillDetailPanel

When what-if mode is active, the detail panel shows editable number fields for key skill properties.

**Files:**
- Modify: `web/src/components/SkillDetailPanel.tsx`

**Step 1: Write the test**

Add to existing tests or create `web/src/components/SkillDetailPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillDetailPanel } from './SkillDetailPanel.js';
import type { DpsResult } from '@metra/engine';
import { describe, it, expect, vi } from 'vitest';

const mockDps: DpsResult = {
  skillName: 'Brandish (Sword)',
  dps: 100000,
  uncappedDps: 100000,
  averageDamage: 50000,
  damageRange: { min: 40000, max: 60000 },
  attackTime: 0.72,
  skillDamagePercent: 300,
  critDamagePercent: 350,
  totalCritRate: 0.15,
  hitCount: 1,
  capLossPercent: 0,
  hasShadowPartner: false,
};

describe('SkillDetailPanel what-if editing', () => {
  it('shows editable fields when whatIfEnabled is true', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={[{ tier: 'perfect', dps: 100000 }]}
        classColor="#fff"
        isComposite={false}
        capEnabled={true}
        currentTier="perfect"
        whatIfEnabled={true}
        skillFields={{ basePower: 260, multiplier: 1, hitCount: 1, maxTargets: 1 }}
        onFieldChange={vi.fn()}
        activeChanges={{}}
      />,
    );
    expect(screen.getByLabelText('basePower')).toBeDefined();
  });

  it('does not show editable fields when whatIfEnabled is false', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={[{ tier: 'perfect', dps: 100000 }]}
        classColor="#fff"
        isComposite={false}
        capEnabled={true}
        currentTier="perfect"
        whatIfEnabled={false}
        skillFields={{ basePower: 260, multiplier: 1, hitCount: 1, maxTargets: 1 }}
        onFieldChange={vi.fn()}
        activeChanges={{}}
      />,
    );
    expect(screen.queryByLabelText('basePower')).toBeNull();
  });

  it('calls onFieldChange when a value is changed', () => {
    const onChange = vi.fn();
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={[{ tier: 'perfect', dps: 100000 }]}
        classColor="#fff"
        isComposite={false}
        capEnabled={true}
        currentTier="perfect"
        whatIfEnabled={true}
        skillFields={{ basePower: 260, multiplier: 1, hitCount: 1, maxTargets: 1 }}
        onFieldChange={onChange}
        activeChanges={{}}
      />,
    );
    const input = screen.getByLabelText('basePower');
    fireEvent.change(input, { target: { value: '280' } });
    expect(onChange).toHaveBeenCalledWith('basePower', 280, 260);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/SkillDetailPanel.test.tsx`
Expected: FAIL — new props don't exist.

**Step 3: Add editable fields to SkillDetailPanel**

In `web/src/components/SkillDetailPanel.tsx`:

Update the props interface (lines 10-17):
```ts
interface SkillDetailPanelProps {
  dps: DpsResult;
  tierData: TierDpsEntry[];
  classColor: string;
  isComposite: boolean;
  capEnabled: boolean;
  currentTier: string;
  // What-if editing
  whatIfEnabled?: boolean;
  /** Current skill field values: { basePower, multiplier, hitCount, maxTargets } */
  skillFields?: Record<string, number>;
  /** Called when user edits a field: (fieldName, newValue, originalValue) */
  onFieldChange?: (field: string, value: number, original: number) => void;
  /** Fields with active what-if changes: { fieldName: modifiedValue } */
  activeChanges?: Record<string, number>;
}
```

Update the function signature to accept these props (add to destructure on lines 19-26).

Add an editable fields section at the top of the detail panel (before the formula breakdown, after line 43's opening `<div>`):

```tsx
        {/* What-if editable fields */}
        {whatIfEnabled && skillFields && !isComposite && (
          <div className="mb-3 pb-3 border-b border-border-subtle">
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-dim mb-2">
              Edit Values
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(skillFields).map(([field, originalValue]) => {
                const isChanged = activeChanges?.[field] !== undefined;
                return (
                  <label key={field} className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-text-muted">{field}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        aria-label={field}
                        defaultValue={isChanged ? activeChanges[field] : originalValue}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== originalValue && onFieldChange) {
                            onFieldChange(field, val, originalValue);
                          } else if (val === originalValue && onFieldChange) {
                            // Reset: user typed original value back
                            onFieldChange(field, val, originalValue);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className={`w-20 rounded border bg-bg-surface px-2 py-1 text-sm tabular-nums text-text-primary ${
                          isChanged ? 'border-accent' : 'border-border-default'
                        }`}
                      />
                      {isChanged && (
                        <span className="text-[10px] text-text-faint">was {originalValue}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
```

Note: The `memo` wrapper on line 107 should be kept. The new optional props won't break memoization since they're compared by reference.

**Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/components/SkillDetailPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```
add inline editing to skill detail panel for what-if mode
```

---

### Task 5: Wire inline editing to what-if state in RankingTable

Connect the detail panel's `onFieldChange` to the context so edits create/update proposal changes.

**Files:**
- Modify: `web/src/components/dashboard/RankingTable.tsx`

**Step 1: Plan the wiring**

The RankingTable needs to:
1. Know whether what-if mode is active
2. Know the current what-if changes (to pass `activeChanges` to the detail panel)
3. Look up skill fields for the expanded row (basePower, multiplier, hitCount, maxTargets)
4. Call `addWhatIfChange` / `updateWhatIfChange` / `removeWhatIfChange` when the user edits a field

**Step 2: Add what-if props and wiring**

In `web/src/components/dashboard/RankingTable.tsx`:

Add imports:
```ts
import { useSimulationControls } from '../../context/SimulationControlsContext.js';
import { discoveredData } from '../../data/bundle.js';
import { skillSlug } from '@engine/proposals/apply.js';
```

Inside `RankingTable` function (after line 64), add:
```ts
  const { whatIfEnabled, whatIfChanges, addWhatIfChange, updateWhatIfChange, removeWhatIfChange } = useSimulationControls();
```

Add a helper function inside the component to get skill fields and active changes for a row:
```ts
  function getSkillEditInfo(className: string, skillName: string) {
    // Find the class data key (lowercase filename stem)
    const classKey = [...discoveredData.classDataMap.entries()]
      .find(([, data]) => data.className === className)?.[0];
    if (!classKey) return null;

    const classData = discoveredData.classDataMap.get(classKey);
    if (!classData) return null;

    const skill = classData.skills.find(s => s.name === skillName);
    if (!skill) return null;

    const slug = skillSlug(skill.name);
    const target = `${classKey}.${slug}`;

    const skillFields: Record<string, number> = {
      basePower: skill.basePower,
      multiplier: skill.multiplier,
      hitCount: skill.hitCount,
      maxTargets: skill.maxTargets ?? 1,
    };

    // Find active changes for this skill
    const activeChanges: Record<string, number> = {};
    whatIfChanges.forEach(c => {
      if (c.target === target) {
        activeChanges[c.field] = c.to as number;
      }
    });

    return { skillFields, activeChanges, target };
  }

  function handleFieldChange(className: string, skillName: string, field: string, value: number, original: number) {
    const editInfo = getSkillEditInfo(className, skillName);
    if (!editInfo) return;

    const { target } = editInfo;
    const existingIndex = whatIfChanges.findIndex(c => c.target === target && c.field === field);

    if (value === original) {
      // Reset to original — remove the change
      if (existingIndex >= 0) removeWhatIfChange(existingIndex);
    } else if (existingIndex >= 0) {
      // Update existing change
      updateWhatIfChange(existingIndex, { target, field, from: original, to: value });
    } else {
      // Add new change
      addWhatIfChange({ target, field, from: original, to: value });
    }
  }
```

Update the `SkillDetailPanel` usage in the expanded row (around lines 175-184):
```tsx
                  {isExpanded && (() => {
                    const editInfo = whatIfEnabled ? getSkillEditInfo(r.className, r.skillName) : null;
                    return (
                      <tr>
                        <td colSpan={columnCount} className="p-0">
                          <SkillDetailPanel
                            dps={r.dps}
                            tierData={buildTierData(r, allResults, capEnabled)}
                            classColor={getClassColor(r.className)}
                            isComposite={!!r.isComposite}
                            capEnabled={capEnabled}
                            currentTier={r.tier}
                            whatIfEnabled={whatIfEnabled}
                            skillFields={editInfo?.skillFields}
                            onFieldChange={(field, value, original) =>
                              handleFieldChange(r.className, r.skillName, field, value, original)
                            }
                            activeChanges={editInfo?.activeChanges}
                          />
                        </td>
                      </tr>
                    );
                  })()}
```

**Step 3: Run all tests to verify nothing breaks**

Run: `cd web && npx vitest run`
Expected: PASS

**Step 4: Commit**

```
wire skill detail editing to what-if state
```

---

### Task 6: Add what-if comparison to Dashboard and show deltas in ranking table

Run the comparison when what-if changes exist and display delta badges in the DPS column.

**Files:**
- Modify: `web/src/components/Dashboard.tsx`
- Modify: `web/src/components/dashboard/RankingTable.tsx`

**Step 1: Hook up comparison in Dashboard**

In `web/src/components/Dashboard.tsx`:

Add import:
```ts
import { useWhatIfComparison } from '../hooks/useWhatIfComparison.js';
```

After the existing state hooks in the component (around line 29), add:
```ts
  const comparison = useWhatIfComparison({
    changes: whatIfChanges,
    targetCount: targetCount > 1 ? targetCount : undefined,
    elementModifiers: Object.keys(controls.elementModifiers).length > 0 ? controls.elementModifiers : undefined,
    buffOverrides: Object.keys(controls.buffOverrides).length > 0 ? controls.buffOverrides : undefined,
    kbConfig: controls.kbConfig,
    cgsOverride: { tier: selectedTier, values: cgsValues },
    efficiencyOverrides: Object.keys(controls.efficiencyOverrides).length > 0 ? controls.efficiencyOverrides : undefined,
  });
```

Note: Need to destructure the full `controls` from `useSimulationControls()`. Change line 27 to capture the full object or add the needed fields.

Pass comparison to RankingTable (update line 92):
```tsx
        <RankingTable
          data={filtered}
          allResults={results}
          capEnabled={capEnabled}
          whatIfComparison={whatIfEnabled ? comparison.result : null}
        />
```

**Step 2: Add delta badges to RankingTable**

In `web/src/components/dashboard/RankingTable.tsx`:

Add to props:
```ts
  whatIfComparison?: ComparisonResult | null;
```

Add import:
```ts
import type { ComparisonResult, DeltaEntry } from '@engine/proposals/types.js';
```

Add helper to find delta for a row:
```ts
  function getDelta(r: typeof data[0]): DeltaEntry | undefined {
    if (!whatIfComparison) return undefined;
    return whatIfComparison.deltas.find(
      d => d.className === r.className && d.skillName === r.skillName && d.tier === r.tier
    );
  }
```

In the DPS cell (lines 163-165), add delta badge:
```tsx
                    <td className="px-3 py-2 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        {formatDps(getDps(r))}
                        {(() => {
                          const delta = getDelta(r);
                          if (!delta || delta.change === 0) return null;
                          const isPositive = delta.change > 0;
                          return (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                              isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                            }`}>
                              {isPositive ? '+' : ''}{delta.changePercent.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </div>
                    </td>
```

Also add rank movement to the # column (lines 146-151). When `whatIfComparison` is present and rank changed:
```tsx
                    <td className="px-3 py-2 w-8 text-text-faint">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-[10px] text-text-faint">{isExpanded ? '\u25BE' : '\u25B8'}</span>
                        {i + 1}
                        {(() => {
                          const delta = getDelta(r);
                          if (!delta?.rankBefore || !delta?.rankAfter || delta.rankBefore === delta.rankAfter) return null;
                          const diff = delta.rankBefore - delta.rankAfter;
                          return (
                            <span className={`text-[9px] font-medium ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {diff > 0 ? `\u2191${diff}` : `\u2193${-diff}`}
                            </span>
                          );
                        })()}
                      </span>
                    </td>
```

Add subtle accent left border on affected rows. Update the `<tr>` className (line 143):
```tsx
                    <tr
                      className={`border-b border-border-subtle hover:bg-white/[0.03] cursor-pointer ${
                        getDelta(r)?.change ? 'border-l-2 border-l-accent' : ''
                      }`}
                      onClick={() => toggleRow(rowKey)}
                    >
```

**Step 3: Run all tests**

Run: `cd web && npx vitest run`
Expected: PASS

**Step 4: Commit**

```
show what-if deltas in ranking table
```

---

### Task 7: Add ghost bars to DpsChart

Show baseline values as ghost bars behind the main bars for skills affected by what-if changes.

**Files:**
- Modify: `web/src/components/DpsChart.tsx`

**Step 1: Add comparison prop and ghost bar**

In `web/src/components/DpsChart.tsx`:

Update props (line 16-18):
```ts
interface DpsChartProps {
  data: ScenarioResult[];
  whatIfComparison?: ComparisonResult | null;
}
```

Import:
```ts
import type { ComparisonResult } from '@engine/proposals/types.js';
```

Update the component signature (line 20):
```ts
export function DpsChart({ data, whatIfComparison }: DpsChartProps) {
```

Modify `chartData` (lines 24-32) to include baseline DPS:
```ts
  const chartData = data.map((r) => {
    const delta = whatIfComparison?.deltas.find(
      d => d.className === r.className && d.skillName === r.skillName && d.tier === r.tier
    );
    return {
      label: `${r.className} — ${r.skillName}`,
      sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
      uid: `${r.className} — ${r.skillName} [${r.tier}]`,
      dps: Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps),
      baselineDps: delta && delta.change !== 0 ? Math.round(delta.before) : undefined,
      className: r.className,
      description: r.description,
    };
  });
```

Add a ghost bar before the main bar (inside the `<BarChart>`, before the existing `<Bar>` on line 119):
```tsx
          {whatIfComparison && (
            <Bar dataKey="baselineDps" radius={[0, 3, 3, 0]} barSize={18} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.baselineDps !== undefined ? getClassColor(entry.className) : 'transparent'}
                  fillOpacity={0.2}
                />
              ))}
            </Bar>
          )}
```

Update the tooltip to show before/after when applicable:
```tsx
                  {d.baselineDps !== undefined && (
                    <>
                      <div className="mt-1 text-text-dim">
                        Before: {d.baselineDps.toLocaleString()} DPS
                      </div>
                      <div className={d.dps > d.baselineDps ? 'text-emerald-400' : 'text-red-400'}>
                        {d.dps > d.baselineDps ? '+' : ''}{(d.dps - d.baselineDps).toLocaleString()} DPS
                        ({((d.dps - d.baselineDps) / d.baselineDps * 100).toFixed(1)}%)
                      </div>
                    </>
                  )}
```

**Step 2: Pass comparison from Dashboard**

In `web/src/components/Dashboard.tsx`, update line 89:
```tsx
      <DpsChart data={filtered} whatIfComparison={whatIfEnabled ? comparison.result : null} />
```

**Step 3: Run all tests**

Run: `cd web && npx vitest run`
Expected: PASS

**Step 4: Commit**

```
add ghost bars to dps chart for what-if changes
```

---

### Task 8: Create changes popover

The popover shows proposal metadata, the list of active changes, and export buttons.

**Files:**
- Create: `web/src/components/dashboard/WhatIfPopover.tsx`

**Step 1: Write the component**

Create `web/src/components/dashboard/WhatIfPopover.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';
import { useSimulationControls } from '../../context/SimulationControlsContext.js';
import { useWhatIfComparison, type WhatIfComparisonResult } from '../../hooks/useWhatIfComparison.js';
import { ChangeRow } from '../proposal/ChangeRow.js';
import { discoveredData } from '../../data/bundle.js';
import { setProposalInUrl, clearProposalFromUrl } from '../../utils/url-encoding.js';
import { renderComparisonReport } from '@engine/report/markdown.js';
import { renderComparisonBBCode } from '@engine/report/bbcode.js';
import type { ComparisonResult } from '@engine/proposals/types.js';

interface WhatIfPopoverProps {
  comparison: WhatIfComparisonResult;
}

export function WhatIfPopover({ comparison }: WhatIfPopoverProps) {
  const { whatIfChanges, whatIfMeta, setWhatIfMeta, removeWhatIfChange } = useSimulationControls();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Update URL when changes exist
  useEffect(() => {
    if (whatIfChanges.length > 0) {
      setProposalInUrl({
        name: whatIfMeta.name || '(What-If)',
        author: whatIfMeta.author,
        changes: whatIfChanges,
      });
    } else {
      clearProposalFromUrl();
    }
  }, [whatIfChanges, whatIfMeta]);

  if (whatIfChanges.length === 0) return null;

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleCopyLink() {
    copyText(window.location.href, 'link');
  }

  function handleCopyMarkdown() {
    if (!comparison.result) return;
    copyText(renderComparisonReport(comparison.result), 'markdown');
  }

  function handleCopyBBCode() {
    if (!comparison.result) return;
    copyText(renderComparisonBBCode(comparison.result), 'bbcode');
  }

  const btnClass = 'cursor-pointer rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors';

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
      >
        {whatIfChanges.length} change{whatIfChanges.length !== 1 ? 's' : ''}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80 rounded-lg border border-border-active bg-bg-surface p-4 shadow-xl">
          {/* Metadata */}
          <div className="mb-3 flex gap-2">
            <label className="flex-1 flex flex-col gap-0.5">
              <span className="text-[10px] text-text-dim uppercase">Name</span>
              <input
                type="text"
                value={whatIfMeta.name}
                onChange={(e) => setWhatIfMeta({ ...whatIfMeta, name: e.target.value })}
                placeholder="Proposal name"
                className="rounded border border-border-default bg-bg-raised px-2 py-1 text-sm text-text-primary"
              />
            </label>
            <label className="flex-1 flex flex-col gap-0.5">
              <span className="text-[10px] text-text-dim uppercase">Author</span>
              <input
                type="text"
                value={whatIfMeta.author}
                onChange={(e) => setWhatIfMeta({ ...whatIfMeta, author: e.target.value })}
                placeholder="Optional"
                className="rounded border border-border-default bg-bg-raised px-2 py-1 text-sm text-text-primary"
              />
            </label>
          </div>

          {/* Changes list */}
          <div className="mb-3 max-h-48 overflow-y-auto">
            {whatIfChanges.map((change, i) => (
              <ChangeRow
                key={`${change.target}-${change.field}-${i}`}
                change={change}
                discovery={discoveredData}
                onRemove={() => removeWhatIfChange(i)}
              />
            ))}
          </div>

          {/* Export */}
          <div className="flex gap-2 border-t border-border-subtle pt-3">
            <button type="button" className={btnClass} onClick={handleCopyLink}>
              {copied === 'link' ? 'Copied!' : 'Copy Link'}
            </button>
            <button type="button" className={btnClass} onClick={handleCopyMarkdown} disabled={!comparison.result}>
              {copied === 'markdown' ? 'Copied!' : 'Markdown'}
            </button>
            <button type="button" className={btnClass} onClick={handleCopyBBCode} disabled={!comparison.result}>
              {copied === 'bbcode' ? 'Copied!' : 'BBCode'}
            </button>
          </div>

          {comparison.error && (
            <div className="mt-2 rounded border border-red-700/30 bg-red-950/20 px-2 py-1 text-xs text-red-400">
              {comparison.error.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Integrate popover into Dashboard**

In `web/src/components/Dashboard.tsx`, add import:
```ts
import { WhatIfPopover } from './dashboard/WhatIfPopover.js';
```

In the toolbar, after the `WhatIfToggle`, add:
```tsx
        {whatIfEnabled && <WhatIfPopover comparison={comparison} />}
```

**Step 3: Run all tests**

Run: `cd web && npx vitest run`
Expected: PASS

**Step 4: Commit**

```
add changes popover with export buttons
```

---

### Task 9: Handle combo group editing in detail panel

When a combo group row is expanded, show editable fields for each sub-skill.

**Files:**
- Modify: `web/src/components/dashboard/RankingTable.tsx`
- Modify: `web/src/components/SkillDetailPanel.tsx`

**Step 1: Extend RankingTable to pass combo sub-skill data**

In the `getSkillEditInfo` function in `RankingTable.tsx`, handle composite rows:

```ts
  function getComboSkillEditInfo(className: string, comboGroupName: string) {
    const classKey = [...discoveredData.classDataMap.entries()]
      .find(([, data]) => data.className === className)?.[0];
    if (!classKey) return null;

    const classData = discoveredData.classDataMap.get(classKey);
    if (!classData) return null;

    const subSkills = classData.skills.filter(s => s.comboGroup === comboGroupName);
    if (subSkills.length === 0) return null;

    return subSkills.map(skill => {
      const slug = skillSlug(skill.name);
      const target = `${classKey}.${slug}`;
      const skillFields: Record<string, number> = {
        basePower: skill.basePower,
        multiplier: skill.multiplier,
        hitCount: skill.hitCount,
        maxTargets: skill.maxTargets ?? 1,
      };
      const activeChanges: Record<string, number> = {};
      whatIfChanges.forEach(c => {
        if (c.target === target) activeChanges[c.field] = c.to as number;
      });
      return { name: skill.name, skillFields, activeChanges, target };
    });
  }
```

**Step 2: Add `comboSkills` prop to SkillDetailPanel**

In `web/src/components/SkillDetailPanel.tsx`, add to props:
```ts
  comboSkills?: Array<{
    name: string;
    skillFields: Record<string, number>;
    activeChanges: Record<string, number>;
    target: string;
  }>;
  onComboFieldChange?: (target: string, field: string, value: number, original: number) => void;
```

Add a section for composite skill editing (inside the `isComposite` branch or alongside it):
```tsx
        {whatIfEnabled && isComposite && comboSkills && comboSkills.length > 0 && (
          <div className="mb-3 pb-3 border-b border-border-subtle">
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-dim mb-2">
              Edit Sub-Skills
            </div>
            {comboSkills.map((sub) => (
              <div key={sub.name} className="mb-3">
                <div className="text-xs text-text-secondary mb-1">{sub.name}</div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(sub.skillFields).map(([field, originalValue]) => {
                    const isChanged = sub.activeChanges[field] !== undefined;
                    return (
                      <label key={field} className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-text-muted">{field}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            aria-label={`${sub.name} ${field}`}
                            defaultValue={isChanged ? sub.activeChanges[field] : originalValue}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && onComboFieldChange) {
                                onComboFieldChange(sub.target, field, val, originalValue);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className={`w-20 rounded border bg-bg-surface px-2 py-1 text-sm tabular-nums text-text-primary ${
                              isChanged ? 'border-accent' : 'border-border-default'
                            }`}
                          />
                          {isChanged && (
                            <span className="text-[10px] text-text-faint">was {originalValue}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
```

**Step 3: Wire it up in RankingTable**

In the expanded row section, update the composite case to pass combo data:
```tsx
                    const comboSkills = whatIfEnabled && r.isComposite
                      ? getComboSkillEditInfo(r.className, r.skillName)
                      : null;
```

Pass to SkillDetailPanel:
```tsx
                          comboSkills={comboSkills ?? undefined}
                          onComboFieldChange={(target, field, value, original) => {
                            const existingIndex = whatIfChanges.findIndex(c => c.target === target && c.field === field);
                            if (value === original) {
                              if (existingIndex >= 0) removeWhatIfChange(existingIndex);
                            } else if (existingIndex >= 0) {
                              updateWhatIfChange(existingIndex, { target, field, from: original, to: value });
                            } else {
                              addWhatIfChange({ target, field, from: original, to: value });
                            }
                          }}
```

**Step 4: Run all tests**

Run: `cd web && npx vitest run`
Expected: PASS

**Step 5: Commit**

```
add combo group sub-skill editing in what-if mode
```

---

### Task 10: Handle URL loading and remove old proposal page

Load `#p=` URLs into what-if mode. Remove the old ProposalBuilder route.

**Files:**
- Modify: `web/src/App.tsx`

**Step 1: Update URL loading logic**

In `web/src/App.tsx`:

Remove imports for `ProposalBuilder`, `ProposalResults`, and `useProposal` (lines 3-4, 9):
```ts
// DELETE:
// import { ProposalBuilder } from './components/ProposalBuilder.js';
// import { ProposalResults } from './components/ProposalResults.js';
// import { useProposal } from './hooks/useProposal.js';
```

Remove the `proposalState` hook (line 40):
```ts
// DELETE:
// const proposalState = useProposal(controls.targetCount > 1 ? controls.targetCount : undefined);
```

Remove `'proposal'` from the `Page` type (line 18):
```ts
type Page = 'dashboard' | 'build' | 'compare' | 'formulas';
```

Update the URL loading `useEffect` (lines 65-70) to load `#p=` into what-if mode:
```ts
    const urlProposal = getProposalFromUrl();
    if (urlProposal) {
      controls.setWhatIfEnabled(true);
      urlProposal.changes.forEach(c => controls.addWhatIfChange(c));
      if (urlProposal.name) controls.setWhatIfMeta({ name: urlProposal.name, author: urlProposal.author || '' });
      setPage('dashboard');
    }
```

Note: `controls` here is from `useSimulationControls()` already destructured on line 29.

Remove the proposal page rendering (lines 154-163):
```ts
// DELETE:
//        {page === 'proposal' && (
//          <ErrorBoundary>
//            <ProposalBuilder proposalState={proposalState} simulation={simulation} />
//            {proposalState.result && (
//              <ProposalResults
//                result={proposalState.result}
//                proposal={proposalState.proposal}
//              />
//            )}
//          </ErrorBoundary>
//        )}
```

Remove "Proposal Builder" from both desktop and mobile nav (lines 86-88, 129-131).

**Step 2: Run all tests**

Run: `cd web && npx vitest run`
Expected: Some proposal-specific tests may fail — that's expected since we're removing the page.

**Step 3: Commit**

```
remove proposal builder page, load #p= urls into what-if mode
```

---

### Task 11: Delete old proposal components

Remove the files that are no longer used.

**Files:**
- Delete: `web/src/components/ProposalBuilder.tsx`
- Delete: `web/src/components/ProposalResults.tsx`
- Delete: `web/src/hooks/useProposal.ts`
- Delete: `web/src/components/proposal/AddChangeForm.tsx`
- Delete: `web/src/components/proposal/Input.tsx`
- Delete: `web/src/components/proposal/JsonPanel.tsx`
- Delete: `web/src/components/proposal/ComparisonChart.tsx`
- Delete: `web/src/components/proposal/RankBumpChart.tsx`
- Delete: `web/src/components/proposal/DeltaTable.tsx`
- Delete: `web/src/components/proposal/FilterGroup.tsx` (if it exists)

**Keep:**
- `web/src/components/proposal/ChangeRow.tsx` — used by WhatIfPopover
- `web/src/components/proposal/RankCell.tsx` — used by RankingTable (if needed)

**Step 1: Delete the files**

```bash
cd web
rm src/components/ProposalBuilder.tsx
rm src/components/ProposalResults.tsx
rm src/hooks/useProposal.ts
rm src/components/proposal/AddChangeForm.tsx
rm src/components/proposal/Input.tsx
rm src/components/proposal/JsonPanel.tsx
rm src/components/proposal/ComparisonChart.tsx
rm src/components/proposal/RankBumpChart.tsx
rm src/components/proposal/DeltaTable.tsx
```

Also check for and remove any now-unused imports across the codebase.

**Step 2: Update e2e tests**

Delete or update:
- `web/e2e/proposal-builder.spec.ts` — delete (page no longer exists)
- `web/e2e/proposal-results.spec.ts` — delete (page no longer exists)
- `web/e2e/navigation.spec.ts` — update to remove proposal nav references

**Step 3: Run all tests**

Run: `cd web && npx vitest run` and `cd web && npx playwright test`
Expected: All pass (some e2e tests deleted).

**Step 4: Commit**

```
delete old proposal builder components and tests
```

---

### Task 12: Add e2e tests for what-if mode

**Files:**
- Create: `web/e2e/what-if.spec.ts`

**Step 1: Write e2e tests**

Create `web/e2e/what-if.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('What-If Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ranking-table"]');
  });

  test('what-if toggle appears in toolbar', async ({ page }) => {
    await expect(page.getByText('What If')).toBeVisible();
    await expect(page.getByRole('button', { name: /Edit/i })).toBeVisible();
  });

  test('clicking toggle enables what-if mode', async ({ page }) => {
    await page.getByRole('button', { name: /Edit/i }).click();
    // Toggle should show active state
    const toggle = page.getByRole('button', { name: /Edit/i });
    await expect(toggle).toHaveClass(/emerald/);
  });

  test('expanding a skill row in what-if mode shows editable fields', async ({ page }) => {
    // Enable what-if
    await page.getByRole('button', { name: /Edit/i }).click();
    // Click first ranking row
    const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();
    await firstRow.click();
    // Should see editable input for basePower
    await expect(page.getByLabelText('basePower')).toBeVisible();
  });

  test('editing a value shows changes pill and delta badge', async ({ page }) => {
    // Enable what-if
    await page.getByRole('button', { name: /Edit/i }).click();
    // Click first row
    const firstRow = page.locator('[data-testid="ranking-table"] tbody tr').first();
    await firstRow.click();
    // Edit basePower
    const input = page.getByLabelText('basePower');
    await input.fill('999');
    await input.blur();
    // Changes pill should appear
    await expect(page.getByText('1 change')).toBeVisible();
    // Delta badge should appear somewhere in the table
    await expect(page.locator('.bg-emerald-500\\/15, .bg-red-500\\/15').first()).toBeVisible();
  });

  test('#p= URL loads into what-if mode', async ({ page }) => {
    // Create a URL with an encoded proposal
    // Use a known proposal that targets hero.brandish-sword
    await page.goto('/#p=N4IgDgTgpgbg+gSwHYBcCWBnAFjEAaEAVwDsBjAF2oE8QBPAC2IDMB3agIwBsBDAJwCeAbQC6IkAF8gA');
    await page.waitForSelector('[data-testid="ranking-table"]');
    // What-if mode should be enabled
    // Changes pill should be visible
    await expect(page.getByText(/change/)).toBeVisible();
  });
});
```

Note: The `#p=` URL in the last test is a placeholder — the actual encoded string will need to be generated from a real proposal. You can generate it by running `encodeProposal` in a test or REPL.

**Step 2: Run e2e tests**

Run: `cd web && npx playwright test e2e/what-if.spec.ts`
Expected: PASS

**Step 3: Commit**

```
add e2e tests for what-if mode
```

---

### Task 13: Final cleanup and type-check

**Step 1: Run full type check**

Run: `cd web && npx tsc --noEmit`
Expected: No errors.

**Step 2: Run all unit tests**

Run: `cd web && npx vitest run`
Expected: All pass.

**Step 3: Run all e2e tests**

Run: `cd web && npx playwright test`
Expected: All pass.

**Step 4: Run root tests and type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass.

**Step 5: Run formatter if configured**

Check for prettier/biome/eslint config and run it.

**Step 6: Commit any remaining fixes**

```
final cleanup
```
