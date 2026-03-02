# Self-Explanatory Tiers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible "Tier Assumptions" panel to the web dashboard so users understand what Low/Mid/High mean at a glance.

**Architecture:** One new React component (`TierAssumptions.tsx`) with static tier data and a toggle. Rendered in `Dashboard.tsx` between the filter bar and the chart. No engine or data layer changes.

**Tech Stack:** React, Tailwind CSS (existing web app stack)

---

### Task 1: Create TierAssumptions component

**Files:**
- Create: `web/src/components/TierAssumptions.tsx`

**Step 1: Write the component**

```tsx
import { useState } from 'react';

export function TierAssumptions() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 text-xs text-text-dim transition-colors hover:text-text-muted"
      >
        <span className="text-[10px]">{expanded ? '\u25BC' : '\u25B6'}</span>
        Tier Assumptions
      </button>
      {expanded && (
        <div className="mt-2 overflow-x-auto rounded border border-border-subtle bg-bg-raised">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-3 py-2 text-left font-medium text-text-dim" />
                <th className="px-3 py-2 text-left font-medium text-text-dim">Low (~Lv165)</th>
                <th className="px-3 py-2 text-left font-medium text-text-dim">Mid (~Lv185)</th>
                <th className="px-3 py-2 text-left font-medium text-text-dim">High (Lv200)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle">
                <td className="px-3 py-1.5 font-medium text-text-muted">Weapon</td>
                <td className="px-3 py-1.5 text-text-secondary">Budget</td>
                <td className="px-3 py-1.5 text-text-secondary">Well-scrolled</td>
                <td className="px-3 py-1.5 text-text-secondary">Near-perfect</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="px-3 py-1.5 font-medium text-text-muted">Potion</td>
                <td className="px-3 py-1.5 text-text-secondary">Stopper</td>
                <td className="px-3 py-1.5 text-text-secondary">Stopper</td>
                <td className="px-3 py-1.5 text-text-secondary">Apple</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-medium text-text-muted">C/G/S</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">15 / 12 / 10</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">17 / 14 / 10</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">19 / 17 / 13</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (no type errors)

**Step 3: Commit**

```
git add web/src/components/TierAssumptions.tsx
git commit -m "add TierAssumptions component"
```

### Task 2: Render in Dashboard

**Files:**
- Modify: `web/src/components/Dashboard.tsx`

**Step 1: Add the import**

At the top of Dashboard.tsx, add:
```tsx
import { TierAssumptions } from './TierAssumptions.js';
```

**Step 2: Render between filter bar and SupportClassNote**

In the Dashboard JSX, after the filter bar `<div className="mb-6 flex items-center gap-4">...</div>` and before `<SupportClassNote>`, add:

```tsx
<TierAssumptions />
```

**Step 3: Verify it compiles and tests pass**

Run: `cd web && npx tsc --noEmit && npm test`
Expected: PASS

**Step 4: Commit**

```
git add web/src/components/Dashboard.tsx
git commit -m "show tier assumptions panel on dashboard"
```

### Task 3: Visual check

**Step 1: Run the dev server and verify**

Run: `cd web && npm run dev`

Check:
- Panel shows "▸ Tier Assumptions" collapsed by default
- Clicking expands to show the comparison table
- Clicking again collapses it
- Table is readable and matches dashboard styling
- No layout shift or overflow issues

**Step 2: Push**

```
git push
```
