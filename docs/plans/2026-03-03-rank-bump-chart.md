# Rank Bump Chart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a bump chart to the proposal results view that visualizes how a proposal reshuffles class DPS rankings within a tier.

**Architecture:** New `RankBumpChart` component in `ProposalResults.tsx`, built with Recharts `LineChart`. Two X-axis points ("Before", "After"), Y-axis is rank (inverted, 1 at top). One `<Line>` per class/skill entry. Shown only when a specific tier is selected and rank data exists.

**Tech Stack:** React, Recharts (already installed), Tailwind CSS

---

### Task 1: Build `RankBumpChart` component

**Files:**
- Modify: `web/src/components/ProposalResults.tsx`

**Step 1: Add the `RankBumpChart` component**

Add this component above the `RankCell` function (after the `ComparisonChart` function, around line 271):

```tsx
function RankBumpChart({ deltas }: { deltas: DeltaEntry[] }) {
  const isMobile = useIsMobile();

  // Only entries with rank data
  const ranked = deltas.filter(
    (d) => d.rankBefore != null && d.rankAfter != null
  );
  if (ranked.length === 0) return null;

  const maxRank = Math.max(
    ...ranked.map((d) => Math.max(d.rankBefore!, d.rankAfter!))
  );

  // Transform: one line per entry, two data points each
  // Recharts LineChart needs a shared data array, so we use one row per X point
  // with a key per entry
  const data = [
    { x: 'Before', ...Object.fromEntries(ranked.map((d, i) => [`r${i}`, d.rankBefore])) },
    { x: 'After', ...Object.fromEntries(ranked.map((d, i) => [`r${i}`, d.rankAfter])) },
  ];

  const rowHeight = 40;
  const chartHeight = Math.max(200, maxRank * rowHeight + 60);
  const labelWidth = isMobile ? 140 : 200;

  return (
    <div data-testid="rank-bump-chart" className="mb-6">
      <h3 className="mb-3 text-sm font-medium text-text-secondary">Rank Movement</h3>
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 16, right: labelWidth, left: labelWidth, bottom: 16 }}>
            <XAxis
              dataKey="x"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.textMuted, fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              type="number"
              domain={[1, maxRank]}
              reversed
              hide
              allowDecimals={false}
            />
            {ranked.map((d, i) => {
              const moved = d.rankBefore !== d.rankAfter;
              const color = getClassColor(d.className);
              return (
                <Line
                  key={i}
                  dataKey={`r${i}`}
                  stroke={color}
                  strokeWidth={moved ? 2.5 : 1.5}
                  strokeOpacity={moved ? 0.9 : 0.25}
                  strokeDasharray={moved ? undefined : '4 4'}
                  dot={{
                    r: moved ? 5 : 3.5,
                    fill: color,
                    fillOpacity: moved ? 1 : 0.4,
                    stroke: 'none',
                  }}
                  isAnimationActive={false}
                  label={({ x, y, index }: { x: number; y: number; index: number }) => {
                    // Label on left for "Before" (index 0), right for "After" (index 1)
                    const label = `${d.className} ${d.skillName}`;
                    if (index === 0) {
                      return (
                        <text
                          x={x - 10}
                          y={y}
                          textAnchor="end"
                          dominantBaseline="central"
                          fill={moved ? colors.textSecondary : colors.textDim}
                          fontSize={isMobile ? 10 : 12}
                        >
                          {label}
                        </text>
                      );
                    }
                    return (
                      <text
                        x={x + 10}
                        y={y}
                        textAnchor="start"
                        dominantBaseline="central"
                        fill={moved ? colors.textSecondary : colors.textDim}
                        fontSize={isMobile ? 10 : 12}
                      >
                        {label}
                      </text>
                    );
                  }}
                />
              );
            })}
            <Tooltip
              content={({ active, label }) => {
                if (!active) return null;
                // Tooltip isn't great for multi-line charts — skip for now
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

Add the `Line` import to the existing Recharts imports at the top of the file:

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
} from 'recharts';
```

**Step 2: Wire it into `ProposalResults`**

In the `ProposalResults` component, add the bump chart between `ComparisonChart` and `DeltaTable`. Replace lines 187-189:

```tsx
      {changed.length > 0 && <ComparisonChart deltas={changed} />}

      <DeltaTable deltas={filtered} showTierGroups={selectedTier === 'all'} />
```

with:

```tsx
      {changed.length > 0 && <ComparisonChart deltas={changed} />}

      {selectedTier !== 'all' && filtered.some((d) => d.rankBefore != null) && (
        <RankBumpChart deltas={filtered} />
      )}

      <DeltaTable deltas={filtered} showTierGroups={selectedTier === 'all'} />
```

**Step 3: Verify it compiles**

Run: `cd web && npx tsc --noEmit`
Expected: no errors

**Step 4: Visual check**

Run: `cd web && npm run dev`
Open the app, go to Proposal Builder, simulate a proposal (e.g. Brandish +20), select a specific tier (e.g. "High"), and verify the bump chart appears between the bar chart and the table.

Check:
- Lines connect before → after rank positions
- Movers have solid, thick lines; unchanged have dashed, faded lines
- Labels appear on both sides
- Class colors match the bar chart and table

**Step 5: Commit**

```bash
git add web/src/components/ProposalResults.tsx
git commit -m "add rank bump chart to proposal results"
```

---

### Task 2: Add e2e test

**Files:**
- Modify: `web/e2e/proposal-results.spec.ts`

**Step 1: Write the test**

Add this test inside the existing `test.describe('proposal results', ...)` block:

```typescript
test('rank bump chart shows when tier is selected', async ({ page }) => {
  // Select a specific tier to make bump chart visible
  await page.getByRole('button', { name: /High/i }).click();

  const chart = page.getByTestId('rank-bump-chart');
  await expect(chart).toBeVisible();
  await expect(chart.locator('text', { hasText: 'Rank Movement' })).toBeVisible();
});

test('rank bump chart hidden when all tiers selected', async ({ page }) => {
  // "All Tiers" is default — bump chart should not be visible
  const chart = page.getByTestId('rank-bump-chart');
  await expect(chart).not.toBeVisible();
});
```

**Step 2: Run the e2e tests**

Run: `cd web && npx playwright test proposal-results.spec.ts`
Expected: all tests pass (including the two new ones)

**Step 3: Commit**

```bash
git add web/e2e/proposal-results.spec.ts
git commit -m "add e2e tests for rank bump chart"
```

---

### Task 3: Polish and edge cases

**Files:**
- Modify: `web/src/components/ProposalResults.tsx`

**Step 1: Test with a multi-class proposal**

Use the `warrior-rebalance.json` proposal (or create one touching 3+ classes) to verify the chart handles many lines without visual overlap. Check both mobile and desktop widths.

**Step 2: Adjust if labels overlap**

If labels collide on the Y-axis (two entries at adjacent ranks), consider adding a small vertical offset or reducing font size. This is a visual judgment call — only fix if it's actually a problem.

**Step 3: Run all tests**

Run: `npx vitest run && cd web && npm test && npx tsc --noEmit`
Expected: all pass

**Step 4: Commit any polish changes**

```bash
git add -A
git commit -m "polish rank bump chart layout"
```
