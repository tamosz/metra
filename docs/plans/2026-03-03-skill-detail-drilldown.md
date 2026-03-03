# Skill Detail Drilldown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Click a row in the baseline ranking table to expand an inline detail panel with formula breakdown and cross-tier DPS comparison.

**Architecture:** Add `totalCritRate`, `hitCount`, and `hasShadowPartner` to `DpsResult` so the UI has everything it needs. Add `isComposite` to `ScenarioResult` to flag combo/mixed entries (formula breakdown is meaningless for those — only show tier comparison). Build a `SkillDetailPanel` component rendered inside the table when a row is expanded. Pass full unfiltered results to `RankingTable` so the panel can look up cross-tier data.

**Tech Stack:** TypeScript, Vitest (engine tests), React (web component), Tailwind CSS

---

### Task 1: Add `totalCritRate`, `hitCount`, `hasShadowPartner` to DpsResult

**Files:**
- Modify: `src/engine/dps.ts:30-53` (DpsResult interface)
- Modify: `src/engine/dps.ts:199-260` (calculateSkillDps return)
- Test: `src/engine/dps.test.ts`

**Step 1: Write the failing test**

In `src/engine/dps.test.ts`, add a new test inside the existing `'Hero Brandish (Sword) DPS'` describe block:

```typescript
it('includes totalCritRate, hitCount, and hasShadowPartner in result', () => {
  const brandish = heroData.skills.find(
    (s) => s.name === 'Brandish (Sword)'
  )!;
  const result = calculateSkillDps(heroHigh, heroData, brandish, weaponData, attackSpeedData, mwData);
  // Hero has SE active (sharpEyes: true in high template), SE crit rate is 0.15, no built-in crit
  expect(result.totalCritRate).toBeCloseTo(0.15, 2);
  expect(result.hitCount).toBe(2);
  expect(result.hasShadowPartner).toBe(false);
});
```

Add another test in the NL section for Shadow Partner:

```typescript
it('includes hasShadowPartner and built-in crit rate', () => {
  const tt = nlData.skills.find((s) => s.name === 'Triple Throw')!;
  const result = calculateSkillDps(nlHigh, nlData, tt, weaponData, attackSpeedData, mwData);
  // NL: builtInCritRate 0.50 + SE 0.15 = 0.65
  expect(result.totalCritRate).toBeCloseTo(0.65, 2);
  expect(result.hitCount).toBe(3);
  expect(result.hasShadowPartner).toBe(true);
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/dps.test.ts`
Expected: FAIL — `totalCritRate`, `hitCount`, `hasShadowPartner` don't exist on DpsResult

**Step 3: Implement**

In `src/engine/dps.ts`, add three fields to the `DpsResult` interface:

```typescript
/** Total crit rate (built-in + SE), 0-1. */
totalCritRate: number;
/** Number of damage lines per attack. */
hitCount: number;
/** Whether Shadow Partner is active (1.5× multiplier). */
hasShadowPartner: boolean;
```

In `calculateSkillDps`, the `totalCritRate` is already computed inside `calculateCritDamage` but not returned. Extract it:

```typescript
const { critDamagePercent, totalCritRate } = calculateCritDamage(skill, classData, build.sharpEyes);
```

This line already exists. Just add the new fields to the return object:

```typescript
return {
  skillName: skill.name,
  attackTime,
  damageRange,
  skillDamagePercent,
  critDamagePercent,
  totalCritRate,
  hitCount: skill.hitCount,
  hasShadowPartner: !!build.shadowPartner,
  adjustedRangeNormal,
  adjustedRangeCrit,
  averageDamage,
  dps,
  uncappedDps,
  capLossPercent,
};
```

Also update the `fixedDamage` early-return path (around line 217) to include:

```typescript
totalCritRate: 0,
hitCount: skill.hitCount,
hasShadowPartner: !!build.shadowPartner,
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/dps.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/dps.ts src/engine/dps.test.ts
git commit -m "add totalCritRate, hitCount, hasShadowPartner to DpsResult"
```

---

### Task 2: Add `isComposite` flag to ScenarioResult

**Files:**
- Modify: `src/proposals/types.ts:46-59` (ScenarioResult interface)
- Modify: `src/proposals/simulate.ts` (aggregateComboGroups, processMixedRotations)
- Test: `src/proposals/simulate.test.ts` (if it exists) or `src/integration.test.ts`

**Step 1: Check for existing simulation tests**

Look at `src/integration.test.ts` to find a suitable place for a test. If there are existing tests for combo groups, add the assertion there.

**Step 2: Add `isComposite` to ScenarioResult**

In `src/proposals/types.ts`, add to the `ScenarioResult` interface:

```typescript
/** True for combo group aggregates and mixed rotations (formula breakdown is not meaningful). */
isComposite?: boolean;
```

**Step 3: Set `isComposite` in simulate.ts**

In `aggregateComboGroups` (around line 281), add `isComposite: true` to the pushed result:

```typescript
output.push({
  className: first.className,
  skillName: groupName,
  tier: first.tier,
  scenario: first.scenario,
  isComposite: true,
  ...(isHeadline ? {} : { headline: false }),
  dps: { ... },
});
```

In `processMixedRotations` (around line 349), add `isComposite: true`:

```typescript
output.push({
  className,
  skillName: rotation.name,
  tier,
  scenario,
  description: rotation.description,
  isComposite: true,
  ...(isHeadline ? {} : { headline: false }),
  dps: { ... },
});
```

**Step 4: Write a quick assertion in integration tests**

In `src/integration.test.ts`, find an existing test that runs simulation for Buccaneer (which has combo groups) and add:

```typescript
const barrageDemoCombo = results.find(
  (r) => r.className === 'Buccaneer' && r.skillName === 'Barrage + Demolition'
);
expect(barrageDemoCombo?.isComposite).toBe(true);

// Non-combo skills should not have isComposite
const heroBrandish = results.find(
  (r) => r.className === 'Hero' && r.skillName === 'Brandish (Sword)'
);
expect(heroBrandish?.isComposite).toBeUndefined();
```

If no suitable test exists, add a focused test.

**Step 5: Run tests**

Run: `npx vitest run src/integration.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/proposals/types.ts src/proposals/simulate.ts src/integration.test.ts
git commit -m "add isComposite flag to ScenarioResult for combo/mixed entries"
```

---

### Task 3: Create `SkillDetailPanel` component

**Files:**
- Create: `web/src/components/SkillDetailPanel.tsx`
- Test: `web/src/components/SkillDetailPanel.test.tsx`

**Step 1: Write the component test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillDetailPanel } from './SkillDetailPanel.js';
import type { DpsResult } from '@engine/engine/dps.js';

const mockDps: DpsResult = {
  skillName: 'Brandish (Sword)',
  attackTime: 0.6,
  damageRange: { min: 12000, max: 18000, average: 15000 },
  skillDamagePercent: 520,
  critDamagePercent: 800,
  totalCritRate: 0.15,
  hitCount: 2,
  hasShadowPartner: false,
  adjustedRangeNormal: 14800,
  adjustedRangeCrit: 14500,
  averageDamage: 189000,
  dps: 315000,
  uncappedDps: 320000,
  capLossPercent: 1.5,
};

const mockTierData = [
  { tier: 'low', dps: 127000 },
  { tier: 'mid', dps: 185000 },
  { tier: 'high', dps: 315000 },
];

describe('SkillDetailPanel', () => {
  it('renders formula breakdown for non-composite entries', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={mockTierData}
        classColor="#e05555"
        isComposite={false}
        capEnabled={true}
        currentTier="high"
      />
    );
    expect(screen.getByText('12,000 – 18,000')).toBeTruthy();
    expect(screen.getByText('0.60s')).toBeTruthy();
    expect(screen.getByText('520%')).toBeTruthy();
    expect(screen.getByText('800%')).toBeTruthy();
    expect(screen.getByText('15%')).toBeTruthy();
  });

  it('hides formula breakdown for composite entries', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={mockTierData}
        classColor="#e05555"
        isComposite={true}
        capEnabled={true}
        currentTier="high"
      />
    );
    // Should not show formula details
    expect(screen.queryByText('520%')).toBeNull();
    // But should still show tier comparison
    expect(screen.getByText('127,000')).toBeTruthy();
    expect(screen.getByText('315,000')).toBeTruthy();
  });

  it('renders tier comparison bars for all tiers', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={mockTierData}
        classColor="#e05555"
        isComposite={false}
        capEnabled={true}
        currentTier="high"
      />
    );
    expect(screen.getByText('Low')).toBeTruthy();
    expect(screen.getByText('Mid')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run src/components/SkillDetailPanel.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement the component**

Create `web/src/components/SkillDetailPanel.tsx`:

```tsx
import type { DpsResult } from '@engine/engine/dps.js';
import { formatDps } from '../utils/format.js';

interface TierDpsEntry {
  tier: string;
  dps: number;
}

interface SkillDetailPanelProps {
  dps: DpsResult;
  tierData: TierDpsEntry[];
  classColor: string;
  isComposite: boolean;
  capEnabled: boolean;
  currentTier: string;
}

export function SkillDetailPanel({
  dps,
  tierData,
  classColor,
  isComposite,
  capEnabled,
  currentTier,
}: SkillDetailPanelProps) {
  const maxTierDps = Math.max(...tierData.map((t) => t.dps));

  // Crit contribution: what fraction of average damage comes from crits
  const critContribution =
    dps.totalCritRate > 0 && dps.critDamagePercent > 0
      ? (dps.critDamagePercent * dps.totalCritRate) /
        (dps.skillDamagePercent * (1 - dps.totalCritRate) +
          dps.critDamagePercent * dps.totalCritRate)
      : 0;

  return (
    <div
      className="bg-bg-raised px-3 py-4"
      style={{ borderTop: `2px solid ${classColor}` }}
      data-testid="skill-detail-panel"
    >
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        {/* Left: Formula breakdown (non-composite only) */}
        {!isComposite && (
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <StatRow label="Damage Range" value={`${formatDps(dps.damageRange.min)} – ${formatDps(dps.damageRange.max)}`} />
              <StatRow label="Attack Time" value={`${dps.attackTime.toFixed(2)}s`} />
              <StatRow label="Skill Damage" value={`${Math.round(dps.skillDamagePercent)}%`} />
              <StatRow label="Crit Damage" value={`${Math.round(dps.critDamagePercent)}%`} dim={dps.totalCritRate === 0} />
              <StatRow label="Crit Rate" value={`${Math.round(dps.totalCritRate * 100)}%`} dim={dps.totalCritRate === 0} />
              <StatRow label="Crit Contribution" value={`${Math.round(critContribution * 100)}%`} dim={critContribution === 0} />
              <StatRow label="Avg Damage" value={formatDps(dps.averageDamage)} />
              <StatRow label="Hit Count" value={String(dps.hitCount)} />
              {capEnabled && (
                <StatRow
                  label="Cap Loss"
                  value={dps.capLossPercent < 0.05 ? '-' : `${dps.capLossPercent.toFixed(1)}%`}
                  highlight={dps.capLossPercent >= 5}
                />
              )}
              {dps.hasShadowPartner && (
                <StatRow label="Shadow Partner" value="Active" />
              )}
            </div>
          </div>
        )}

        {/* Right: Tier comparison */}
        <div className={isComposite ? 'w-full' : 'flex-1 min-w-0'}>
          <div className="text-[11px] font-medium uppercase tracking-wide text-text-dim mb-2">
            DPS by Tier
          </div>
          <div className="flex flex-col gap-1.5">
            {tierData.map((t) => {
              const widthPercent = maxTierDps > 0 ? (t.dps / maxTierDps) * 100 : 0;
              const isCurrent = t.tier === currentTier;
              return (
                <div key={t.tier} className="flex items-center gap-2 text-sm">
                  <span className={`w-16 text-right tabular-nums ${isCurrent ? 'text-text-bright font-medium' : 'text-text-muted'}`}>
                    {t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}
                  </span>
                  <div className="flex-1 h-4 rounded-sm bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: classColor,
                        opacity: isCurrent ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <span className={`w-20 text-right tabular-nums ${isCurrent ? 'text-text-bright' : 'text-text-secondary'}`}>
                    {formatDps(t.dps)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  dim,
  highlight,
}: {
  label: string;
  value: string;
  dim?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-text-dim text-xs">{label}</span>
      <span
        className={`tabular-nums ${
          highlight ? 'text-negative' : dim ? 'text-text-faint' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run src/components/SkillDetailPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/SkillDetailPanel.tsx web/src/components/SkillDetailPanel.test.tsx
git commit -m "add SkillDetailPanel component with formula breakdown and tier chart"
```

---

### Task 4: Wire up expand/collapse in RankingTable

**Files:**
- Modify: `web/src/components/Dashboard.tsx`

**Step 1: Pass full results to RankingTable**

In `Dashboard`, the `RankingTable` currently gets `data` (the filtered list). Add a second prop `allResults` with the full unfiltered `results` array. Also pass `capEnabled` (already passed) and the tier list for display names.

Update the `RankingTable` call:

```tsx
<RankingTable
  data={filtered}
  allResults={results}
  customTierNames={customTierNames}
  capEnabled={capEnabled}
/>
```

**Step 2: Add expand/collapse state to RankingTable**

In `RankingTable`, add state:

```typescript
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
```

The key is `${className}-${skillName}-${tier}` (same as the existing row key).

Toggle function:

```typescript
const toggleRow = (key: string) => {
  setExpandedRows((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
};
```

**Step 3: Make rows clickable and add chevron**

Change the `<tr>` to have `onClick` and `cursor-pointer`. Add a chevron (▸/▾) in the rank cell:

```tsx
<tr
  key={rowKey}
  className="border-b border-border-subtle hover:bg-white/[0.03] cursor-pointer"
  onClick={() => toggleRow(rowKey)}
>
  <td className="px-3 py-2 w-8 text-text-faint">
    <span className="inline-flex items-center gap-1">
      <span className="text-[10px] text-text-faint">{expandedRows.has(rowKey) ? '▾' : '▸'}</span>
      {i + 1}
    </span>
  </td>
  {/* ... rest of cells unchanged */}
</tr>
```

**Step 4: Render SkillDetailPanel when expanded**

After each `<tr>`, if the row is expanded, render a second `<tr>` containing the panel:

```tsx
{expandedRows.has(rowKey) && (
  <tr key={`${rowKey}-detail`}>
    <td colSpan={columnCount} className="p-0">
      <SkillDetailPanel
        dps={r.dps}
        tierData={buildTierData(r, allResults, capEnabled)}
        classColor={getClassColor(r.className)}
        isComposite={!!r.isComposite}
        capEnabled={capEnabled}
        currentTier={r.tier}
      />
    </td>
  </tr>
)}
```

**Step 5: Build the `buildTierData` helper**

Add a helper function (above `RankingTable` or in a utils file) that finds matching (className, skillName) entries across all tiers:

```typescript
function buildTierData(
  row: { className: string; skillName: string },
  allResults: ScenarioResult[],
  capEnabled: boolean
): { tier: string; dps: number }[] {
  return allResults
    .filter(
      (r) =>
        r.className === row.className &&
        r.skillName === row.skillName &&
        r.scenario === allResults.find(
          (ar) => ar.className === row.className && ar.skillName === row.skillName
        )?.scenario
    )
    .sort((a, b) => compareTiers(a.tier, b.tier))
    .map((r) => ({
      tier: r.tier,
      dps: capEnabled ? r.dps.dps : r.dps.uncappedDps,
    }));
}
```

Note: filter to the same scenario as the current view (the first matching scenario in results).

**Step 6: Add imports**

Add to Dashboard.tsx imports:

```typescript
import { SkillDetailPanel } from './SkillDetailPanel.js';
import { getClassColor } from '../utils/class-colors.js';
import type { ScenarioResult } from '@engine/proposals/types.js';
```

**Step 7: Run type check and web tests**

Run: `cd web && npx vitest run && npx tsc --noEmit`
Expected: PASS

**Step 8: Commit**

```bash
git add web/src/components/Dashboard.tsx
git commit -m "wire up skill detail drilldown in ranking table"
```

---

### Task 5: Manual verification and polish

**Step 1: Run the web app**

Run: `cd web && npm run dev`

Open in browser, verify:
- Clicking a row expands the detail panel below it
- Chevron toggles between ▸ and ▾
- Formula breakdown shows correct values for non-composite entries
- Composite entries (Barrage + Demolition, BStep + Assassinate, Snipe + Strafe) show only tier comparison
- Tier comparison bars render with class color, current tier highlighted
- Multiple rows can be expanded simultaneously
- Filtering by tier still shows all tiers in the expanded panel
- Mobile layout stacks the two sections vertically

**Step 2: Fix any visual issues**

Adjust spacing, colors, or layout as needed based on how it actually looks in the browser.

**Step 3: Run all tests**

Run: `npx vitest run && cd web && npx vitest run`
Expected: All pass

**Step 4: Run type checks**

Run: `npm run type-check:all`
Expected: No errors

**Step 5: Commit any polish changes**

```bash
git add -A
git commit -m "polish skill detail drilldown styling"
```
