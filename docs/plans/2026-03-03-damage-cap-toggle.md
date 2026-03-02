# Damage Cap Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the 199,999 damage cap a toggle and show cap loss % alongside DPS rankings.

**Architecture:** Always compute both capped and uncapped DPS in the engine. Toggle controls display only — no re-simulation needed. Cap loss column appears in reports when cap is active.

**Tech Stack:** TypeScript engine, Vitest tests, React web app, CLI flags.

---

### Task 1: Add uncapped DPS fields to DpsResult and compute them in engine

**Files:**
- Modify: `src/engine/dps.ts:30-49` (DpsResult interface)
- Modify: `src/engine/dps.ts:133-167` (calculateAverageDamage)
- Modify: `src/engine/dps.ts:183-232` (calculateSkillDps)
- Test: `src/engine/dps.test.ts`

**Step 1: Write the failing test**

Add to `src/engine/dps.test.ts` inside the existing Hero describe block:

```typescript
it('returns uncappedDps and capLossPercent', () => {
  const brandish = heroData.skills.find((s) => s.name === 'Brandish (Sword)')!;
  const result = calculateSkillDps(heroHigh, heroData, brandish, weaponData, attackSpeedData, mwData);
  // uncappedDps should be >= dps (cap can only reduce DPS)
  expect(result.uncappedDps).toBeGreaterThanOrEqual(result.dps);
  // capLossPercent should be >= 0
  expect(result.capLossPercent).toBeGreaterThanOrEqual(0);
  // capLossPercent = (uncapped - capped) / uncapped * 100
  const expectedLoss = result.uncappedDps > 0
    ? ((result.uncappedDps - result.dps) / result.uncappedDps) * 100
    : 0;
  expect(result.capLossPercent).toBeCloseTo(expectedLoss, 5);
});
```

Also add a test for a low-tier class that doesn't hit the cap:

```typescript
it('capLossPercent is 0 when damage is below cap', () => {
  // Low-tier Paladin Blast should be well below the 199,999 cap
  const blast = paladinData.skills.find((s) => s.name === 'Blast (Holy, Sword)')!;
  const result = calculateSkillDps(paladinLow, paladinData, blast, weaponData, attackSpeedData, mwData);
  expect(result.capLossPercent).toBe(0);
  expect(result.uncappedDps).toBe(result.dps);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/dps.test.ts`
Expected: FAIL — `uncappedDps` and `capLossPercent` don't exist on DpsResult.

**Step 3: Implement the changes**

In `src/engine/dps.ts`, add to the `DpsResult` interface (after the `dps` field at line 48):

```typescript
/** DPS without the per-line damage cap. */
uncappedDps: number;
/** Percentage of DPS lost to the 199,999 per-line cap (0-100). */
capLossPercent: number;
```

Update `calculateAverageDamage` return type and body to also compute uncapped average. The uncapped average uses `damageRange.average` directly (no capping). Add to the return type: `uncappedAverageDamage: number`.

```typescript
function calculateAverageDamage(
  damageRange: DamageRange,
  skillDamagePercent: number,
  critDamagePercent: number,
  totalCritRate: number,
  hitCount: number,
  isMagic: boolean,
  shadowPartner: boolean | undefined
): { adjustedRangeNormal: number; adjustedRangeCrit: number; averageDamage: number; uncappedAverageDamage: number } {
  const skillMultiplier = toEffectiveMultiplier(skillDamagePercent, isMagic);
  const critMultiplier = toEffectiveMultiplier(critDamagePercent, isMagic);

  const rangeCap = DAMAGE_CAP / skillMultiplier;
  const rangeCapCrit = DAMAGE_CAP / critMultiplier;

  const adjustedRangeNormal = calculateAdjustedRange(damageRange, rangeCap);
  const adjustedRangeCrit = calculateAdjustedRange(damageRange, rangeCapCrit);

  let averageDamage: number;
  let uncappedAverageDamage: number;
  if (totalCritRate > 0) {
    const normalRate = 1 - totalCritRate;
    averageDamage =
      (skillMultiplier * normalRate * adjustedRangeNormal +
        critMultiplier * totalCritRate * adjustedRangeCrit) *
      hitCount;
    uncappedAverageDamage =
      (skillMultiplier * normalRate + critMultiplier * totalCritRate) *
      damageRange.average * hitCount;
  } else {
    averageDamage = skillMultiplier * adjustedRangeNormal * hitCount;
    uncappedAverageDamage = skillMultiplier * damageRange.average * hitCount;
  }

  if (shadowPartner) {
    averageDamage *= SHADOW_PARTNER_MULTIPLIER;
    uncappedAverageDamage *= SHADOW_PARTNER_MULTIPLIER;
  }

  return { adjustedRangeNormal, adjustedRangeCrit, averageDamage, uncappedAverageDamage };
}
```

Update `calculateSkillDps` to include the new fields in its return value:

For the fixedDamage branch (line 197-210), add:
```typescript
uncappedDps: totalDamage / attackTime,
capLossPercent: 0,
```

For the normal branch (line 220-232), destructure `uncappedAverageDamage` from `calculateAverageDamage`, then:
```typescript
const dps = averageDamage / attackTime;
const uncappedDps = uncappedAverageDamage / attackTime;
const capLossPercent = uncappedDps > 0 ? ((uncappedDps - dps) / uncappedDps) * 100 : 0;

return {
  skillName: skill.name,
  attackTime,
  damageRange,
  skillDamagePercent,
  critDamagePercent,
  adjustedRangeNormal,
  adjustedRangeCrit,
  averageDamage,
  dps,
  uncappedDps,
  capLossPercent,
};
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/dps.test.ts`
Expected: PASS

**Step 5: Fix all existing mockDpsResult helpers**

Every test file that constructs a `DpsResult` mock needs the two new fields. Search for `mockDpsResult` in:
- `src/report/markdown.test.ts`
- `src/report/bbcode.test.ts`

Add to each mock:
```typescript
uncappedDps: dps,
capLossPercent: 0,
```

Run: `npx vitest run`
Expected: All tests pass (type errors resolved).

**Step 6: Commit**

```
add uncapped dps and cap loss percent to engine
```

---

### Task 2: Thread uncappedDps through simulation post-multipliers and combo aggregation

**Files:**
- Modify: `src/proposals/simulate.ts:49-75` (apply* helpers)
- Modify: `src/proposals/simulate.ts:184-223` (aggregateComboGroups)

**Step 1: Write the failing test**

Add a test to `src/engine/dps.test.ts` (or use the integration test) that verifies combo groups sum uncappedDps. Actually, the existing combo group tests in integration tests should catch this if we run a full simulation. But let's add an explicit one.

Create or add to `src/integration.test.ts`:

```typescript
it('combo group aggregates uncappedDps', () => {
  // Run sim for Buccaneer which has Barrage + Demolition combo
  const results = runSimulation(
    { classes: ['bucc'], tiers: ['high'], scenarios: [{ name: 'Test' }] },
    classDataMap, gearTemplates, weaponData, attackSpeedData, mwData
  );
  const combo = results.find(r => r.skillName === 'Barrage + Demolition');
  expect(combo).toBeDefined();
  expect(combo!.dps.uncappedDps).toBeGreaterThan(0);
  expect(combo!.dps.capLossPercent).toBeGreaterThanOrEqual(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/integration.test.ts`
Expected: Likely a type error or NaN because apply* functions don't propagate `uncappedDps`.

**Step 3: Update apply* helpers**

Each of the four `apply*` functions in `src/proposals/simulate.ts` needs to also scale `uncappedDps`. The `capLossPercent` stays the same (linear multipliers don't change the ratio). Update each:

```typescript
function applyPdr(dps: DpsResult, pdr: number): DpsResult {
  const factor = 1 - pdr;
  return { ...dps, dps: dps.dps * factor, averageDamage: dps.averageDamage * factor, uncappedDps: dps.uncappedDps * factor };
}

function applyElementModifier(dps: DpsResult, modifier: number): DpsResult {
  return { ...dps, dps: dps.dps * modifier, averageDamage: dps.averageDamage * modifier, uncappedDps: dps.uncappedDps * modifier };
}

function applyTargetCount(dps: DpsResult, effectiveTargets: number): DpsResult {
  return { ...dps, dps: dps.dps * effectiveTargets, averageDamage: dps.averageDamage * effectiveTargets, uncappedDps: dps.uncappedDps * effectiveTargets };
}

function applyKnockbackUptime(dps: DpsResult, uptimeMultiplier: number): DpsResult {
  return { ...dps, dps: dps.dps * uptimeMultiplier, averageDamage: dps.averageDamage * uptimeMultiplier, uncappedDps: dps.uncappedDps * uptimeMultiplier };
}
```

**Step 4: Update aggregateComboGroups**

In `aggregateComboGroups`, add `uncappedDps` summing and `capLossPercent` recomputation:

```typescript
const totalDps = groupResults.reduce((sum, r) => sum + r.dps.dps, 0);
const totalAvgDamage = groupResults.reduce((sum, r) => sum + r.dps.averageDamage, 0);
const totalUncappedDps = groupResults.reduce((sum, r) => sum + r.dps.uncappedDps, 0);
const capLossPercent = totalUncappedDps > 0 ? ((totalUncappedDps - totalDps) / totalUncappedDps) * 100 : 0;

output.push({
  className: first.className,
  skillName: groupName,
  tier: first.tier,
  scenario: first.scenario,
  dps: {
    ...first.dps,
    skillName: groupName,
    dps: totalDps,
    averageDamage: totalAvgDamage,
    uncappedDps: totalUncappedDps,
    capLossPercent,
  },
});
```

**Step 5: Run all tests**

Run: `npx vitest run`
Expected: All pass.

**Step 6: Commit**

```
thread uncapped dps through simulation multipliers and combo groups
```

---

### Task 3: Add cap loss column to baseline reports (markdown + bbcode)

**Files:**
- Modify: `src/report/markdown.ts:127-143` (renderBaselineTable)
- Modify: `src/report/bbcode.ts:134-172` (renderBaselineCodeTable)
- Modify: `src/report/utils.ts` (add formatCapLoss helper)
- Test: `src/report/markdown.test.ts`
- Test: `src/report/bbcode.test.ts`

**Step 1: Write the failing tests**

Add to `src/report/markdown.test.ts`:

```typescript
describe('renderBaselineReport with cap loss', () => {
  function mockDpsWithCap(dps: number, capLossPercent: number): DpsResult {
    const uncappedDps = capLossPercent > 0 ? dps / (1 - capLossPercent / 100) : dps;
    return {
      ...mockDpsResult(dps),
      uncappedDps,
      capLossPercent,
    };
  }

  it('includes Cap Loss column in baseline table', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsWithCap(250000, 3.2) },
      { className: 'DrK', skillName: 'Crusher', tier: 'high', scenario: 'Buffed', dps: mockDpsWithCap(240000, 0) },
    ];

    const report = renderBaselineReport(results);
    expect(report).toContain('Cap Loss');
    expect(report).toContain('3.2%');
    // DrK has 0% cap loss — show dash or 0.0%
    expect(report).toMatch(/0\.0%|-/);
  });

  it('omits Cap Loss column when showCapLoss is false', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsWithCap(250000, 3.2) },
    ];

    const report = renderBaselineReport(results, { showCapLoss: false });
    expect(report).not.toContain('Cap Loss');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/report/markdown.test.ts`
Expected: FAIL — `renderBaselineReport` doesn't accept options or render cap loss.

**Step 3: Add formatCapLoss to utils**

In `src/report/utils.ts`:

```typescript
export function formatCapLoss(percent: number): string {
  if (percent < 0.05) return '-';
  return percent.toFixed(1) + '%';
}
```

**Step 4: Update renderBaselineReport and renderBaselineTable in markdown.ts**

Add an options parameter to `renderBaselineReport`:

```typescript
export interface BaselineReportOptions {
  showCapLoss?: boolean;
}

export function renderBaselineReport(results: ScenarioResult[], options?: BaselineReportOptions): string {
```

Pass `options` through to `renderBaselineTable`. Default `showCapLoss` to `true`.

In `renderBaselineTable`, add the Cap Loss column:

```typescript
function renderBaselineTable(lines: string[], results: ScenarioResult[], showCapLoss: boolean): void {
  const header = showCapLoss
    ? '| Rank | Class | Skill | Tier | DPS | Cap Loss |'
    : '| Rank | Class | Skill | Tier | DPS |';
  const separator = showCapLoss
    ? '|-----:|-------|-------|------|----:|---------:|'
    : '|-----:|-------|-------|------|----:|';
  lines.push(header);
  lines.push(separator);

  const sorted = [...results].sort((a, b) => b.dps.dps - a.dps.dps);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const row = [
      String(i + 1),
      r.className,
      r.skillName,
      capitalize(r.tier),
      formatNumber(r.dps.dps),
    ];
    if (showCapLoss) {
      row.push(formatCapLoss(r.dps.capLossPercent));
    }
    lines.push('| ' + row.join(' | ') + ' |');
  }
}
```

**Step 5: Update renderBaselineCodeTable in bbcode.ts**

Same pattern — add a `showCapLoss` parameter, add `capLoss` column to the aligned code table. Add an options parameter to `renderBaselineBBCode` matching the markdown pattern.

**Step 6: Run all tests**

Run: `npx vitest run`
Expected: All pass.

**Step 7: Commit**

```
add cap loss column to baseline reports
```

---

### Task 4: Add --uncapped CLI flag

**Files:**
- Modify: `src/cli.ts`
- No new test file needed (CLI is a thin orchestrator; test through manual run)

**Step 1: Add the flag**

In `src/cli.ts`, in `main()`:

```typescript
const uncapped = process.argv.includes('--uncapped');
```

Add `'--uncapped'` to the flags that get filtered from positional args:

```typescript
.filter((arg: string) => !arg.startsWith('--'))
```

(This already handles it since `--uncapped` starts with `--`.)

When rendering baseline report, pass `{ showCapLoss: !uncapped }`. When `uncapped` is true, swap the DPS values in the results before rendering:

```typescript
const displayResults = uncapped
  ? results.map(r => ({
      ...r,
      dps: { ...r.dps, dps: r.dps.uncappedDps, averageDamage: r.dps.uncappedDps * r.dps.attackTime },
    }))
  : results;
```

Update the scenario name when uncapped:

```typescript
const baseline: ScenarioConfig = {
  name: uncapped ? 'Baseline (Uncapped)' : (kbConfig ? 'Baseline (KB, experimental)' : 'Baseline'),
};
```

**Step 2: Manual test**

Run: `npm run simulate` → should show Cap Loss column
Run: `npm run simulate -- --uncapped` → should show uncapped DPS, no Cap Loss column

**Step 3: Commit**

```
add --uncapped cli flag
```

---

### Task 5: Add damage cap toggle to web dashboard

**Files:**
- Create: `web/src/components/CapToggle.tsx`
- Modify: `web/src/App.tsx` (add state)
- Modify: `web/src/components/Dashboard.tsx` (add toggle, cap loss column)

**Step 1: Create CapToggle component**

Create `web/src/components/CapToggle.tsx` following the KbToggle pattern:

```tsx
const STYLE_ON = 'border border-emerald-700/50 bg-emerald-950/40 text-emerald-400';
const STYLE_OFF = 'border border-border-default bg-bg-raised text-text-muted';

interface CapToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CapToggle({ enabled, onToggle }: CapToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Damage Cap</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Damage cap (199,999): ON — showing capped DPS (click for uncapped)' : 'Damage cap: OFF — showing uncapped DPS (click for capped)'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? STYLE_ON : STYLE_OFF}`}
        >
          Cap
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Wire up state in App.tsx**

Add to App.tsx state:
```typescript
const [capEnabled, setCapEnabled] = useState(true);
```

Pass to Dashboard:
```tsx
<Dashboard
  // ... existing props
  capEnabled={capEnabled}
  setCapEnabled={setCapEnabled}
/>
```

**Step 3: Update Dashboard**

Add `capEnabled` and `setCapEnabled` to `DashboardProps`.

Add `CapToggle` to the filter bar (after KbToggle):
```tsx
<CapToggle enabled={capEnabled} onToggle={setCapEnabled} />
```

In the `RankingTable` component, accept `capEnabled` prop. When `capEnabled` is false, display `r.dps.uncappedDps` instead of `r.dps.dps`. When `capEnabled` is true, show an additional "Cap Loss" column.

Update the `data` type on `RankingTable` to include the full `DpsResult` (not just `{ dps: number }`):
```typescript
data: { className: string; skillName: string; tier: string; dps: DpsResult }[];
```

Add cap loss column:
```tsx
{capEnabled && (
  <th className={`${thSortable} text-right`} onClick={() => handleSort('capLoss')}>
    Cap Loss{sortColumn === 'capLoss' && <SortArrow direction={sortDirection} />}
  </th>
)}
```

And in the body:
```tsx
{capEnabled && (
  <td className="px-3 py-2 text-right tabular-nums text-text-faint">
    {r.dps.capLossPercent < 0.05 ? '-' : `${r.dps.capLossPercent.toFixed(1)}%`}
  </td>
)}
```

When `!capEnabled`, use `r.dps.uncappedDps` for the DPS column value and for sorting.

Also update `DpsChart` to use `uncappedDps` when cap is disabled — pass `capEnabled` through to the chart. In the chart data mapping:
```typescript
dps: Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps),
```

**Step 4: Add capLoss to SortColumn type**

```typescript
type SortColumn = 'class' | 'skill' | 'tier' | 'dps' | 'capLoss';
```

Add sorting logic for `capLoss`:
```typescript
case 'capLoss': return dir * (a.dps.capLossPercent - b.dps.capLossPercent);
```

**Step 5: Update filtered memo to use the right DPS field**

The `filtered` memo sorts by `b.dps.dps - a.dps.dps`. When `!capEnabled`, sort by `uncappedDps` instead. Pass `capEnabled` as a dependency.

**Step 6: Run web tests and type-check**

Run: `cd web && npx tsc --noEmit && npm test`
Expected: All pass.

**Step 7: Commit**

```
add damage cap toggle to web dashboard
```

---

### Task 6: Final verification

**Step 1: Run all engine tests**

Run: `npx vitest run`
Expected: All pass.

**Step 2: Run web tests and type-check**

Run: `cd web && npx tsc --noEmit && npm test`
Expected: All pass.

**Step 3: Manual CLI smoke test**

Run: `npm run simulate` — verify Cap Loss column appears
Run: `npm run simulate -- --uncapped` — verify uncapped DPS and no Cap Loss column

**Step 4: Manual web smoke test**

Run: `cd web && npm run dev` — verify Cap toggle appears, toggling swaps DPS values, cap loss column toggles.

**Step 5: Commit any remaining fixes, push**
