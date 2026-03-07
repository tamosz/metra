# Template Editor Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align TemplateEditor and TemplateProposal with the site's design language — spinners, card wrapper, table styling, slot capitalization, tooltip.

**Architecture:** All changes in `web/`. One new utility for slot display names, component rewrites for TemplateEditor and TemplateProposal, test updates.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react, Tailwind CSS

---

### Task 1: Add slot display name utility

**Files:**
- Create: `web/src/utils/slot-names.ts`
- Create: `web/src/utils/slot-names.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { slotDisplayName, OVERALL_TOOLTIP } from './slot-names.js';

describe('slotDisplayName', () => {
  it('capitalizes simple slot names', () => {
    expect(slotDisplayName('weapon')).toBe('Weapon');
    expect(slotDisplayName('helmet')).toBe('Helmet');
    expect(slotDisplayName('pendant')).toBe('Pendant');
  });

  it('maps top to Overall', () => {
    expect(slotDisplayName('top')).toBe('Overall');
  });

  it('splits numbered slots', () => {
    expect(slotDisplayName('ring1')).toBe('Ring 1');
    expect(slotDisplayName('ring4')).toBe('Ring 4');
  });

  it('falls back to capitalized key for unknown slots', () => {
    expect(slotDisplayName('unknown')).toBe('Unknown');
  });

  it('exports tooltip constant', () => {
    expect(OVERALL_TOOLTIP).toContain('Top and bottom');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run slot-names`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

```typescript
const SLOT_NAMES: Record<string, string> = {
  weapon: 'Weapon',
  shield: 'Shield',
  helmet: 'Helmet',
  top: 'Overall',
  earring: 'Earring',
  eye: 'Eye',
  face: 'Face',
  pendant: 'Pendant',
  belt: 'Belt',
  medal: 'Medal',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  ring3: 'Ring 3',
  ring4: 'Ring 4',
  cape: 'Cape',
  shoe: 'Shoe',
  glove: 'Glove',
};

export const OVERALL_TOOLTIP = 'Top and bottom are combined into a single slot.';

export function slotDisplayName(key: string): string {
  return SLOT_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
```

**Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run slot-names`
Expected: PASS.

**Step 5: Commit**

```
add slot display name utility
```

---

### Task 2: Rewrite TemplateEditor with spinners and site styling

This is the main task. Replace the entire TemplateEditor component body with spinners, card wrapper, TH constant, proper padding/borders/hover, and slot display names.

**Files:**
- Modify: `web/src/components/TemplateEditor.tsx`

**Reference:** The spinner pattern from `BuildStatEditor.tsx` (lines 141-168):
- `useSpinner(callback)` from `../hooks/useSpinner.js` for hold-to-repeat
- Button: `h-6 w-5 bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted`
- Input: `w-[48px] border-x border-border-default bg-bg-raised px-1 py-1 text-center text-sm tabular-nums`
- Container: `flex items-stretch overflow-hidden rounded border border-border-default`

**Step 1: Rewrite the component**

Replace the full contents of `TemplateEditor.tsx` with:

```tsx
import { useState, useMemo, useCallback } from 'react';
import { getGearBreakdown } from '../data/bundle.js';
import { useSpinner } from '../hooks/useSpinner.js';
import { TemplateProposal } from './TemplateProposal.js';
import { slotDisplayName, OVERALL_TOOLTIP } from '../utils/slot-names.js';
import { TH } from '../utils/styles.js';
import type { SlotChange } from '../utils/template-proposal.js';

interface TemplateEditorProps {
  className: string;
  tier: string;
}

type Edits = Record<string, Record<string, number>>;

export function TemplateEditor({ className, tier }: TemplateEditorProps) {
  const templateKey = `${className}-${tier}`;
  const breakdown = useMemo(() => getGearBreakdown(templateKey), [templateKey]);
  const [edits, setEdits] = useState<Edits>({});

  if (!breakdown) {
    return (
      <div className="py-4 text-sm text-text-dim">
        No gear breakdown available for this template.
      </div>
    );
  }

  const slots = Object.keys(breakdown);

  const statColumns = useMemo(() => {
    const stats = new Set<string>();
    for (const slotStats of Object.values(breakdown)) {
      for (const stat of Object.keys(slotStats)) {
        stats.add(stat);
      }
    }
    const order = ['STR', 'DEX', 'INT', 'LUK', 'WATK', 'MATK'];
    return [...stats].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [breakdown]);

  const getValue = useCallback(
    (slot: string, stat: string): number | null => {
      const edited = edits[slot]?.[stat];
      if (edited !== undefined) return edited;
      return breakdown[slot]?.[stat] ?? null;
    },
    [breakdown, edits]
  );

  const getOriginal = useCallback(
    (slot: string, stat: string): number | null => {
      return breakdown[slot]?.[stat] ?? null;
    },
    [breakdown]
  );

  const isEdited = useCallback(
    (slot: string, stat: string): boolean => {
      const edited = edits[slot]?.[stat];
      if (edited === undefined) return false;
      const original = breakdown[slot]?.[stat] ?? 0;
      return edited !== original;
    },
    [breakdown, edits]
  );

  const handleChange = useCallback(
    (slot: string, stat: string, value: number) => {
      setEdits((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], [stat]: value },
      }));
    },
    []
  );

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const stat of statColumns) {
      t[stat] = 0;
      for (const slot of slots) {
        const v = getValue(slot, stat);
        if (v !== null) t[stat] += v;
      }
    }
    return t;
  }, [statColumns, slots, getValue]);

  const originalTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const stat of statColumns) {
      t[stat] = 0;
      for (const slot of slots) {
        const v = breakdown[slot]?.[stat] ?? 0;
        t[stat] += v;
      }
    }
    return t;
  }, [statColumns, slots, breakdown]);

  const changes: SlotChange[] = useMemo(() => {
    const result: SlotChange[] = [];
    for (const slot of slots) {
      for (const stat of statColumns) {
        if (isEdited(slot, stat)) {
          result.push({
            slot,
            stat,
            from: breakdown[slot]?.[stat] ?? 0,
            to: edits[slot]![stat]!,
          });
        }
      }
    }
    return result;
  }, [slots, statColumns, isEdited, breakdown, edits]);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th className={`${TH} text-left`}>Slot</th>
              {statColumns.map((stat) => (
                <th key={stat} className={`${TH} text-right`}>{stat}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-b border-border-subtle hover:bg-white/[0.03]">
                <td className="px-3 py-2 text-xs text-text-muted">
                  {slot === 'top' ? (
                    <span title={OVERALL_TOOLTIP} className="cursor-help underline decoration-dotted decoration-text-faint underline-offset-2">
                      {slotDisplayName(slot)}
                    </span>
                  ) : (
                    slotDisplayName(slot)
                  )}
                </td>
                {statColumns.map((stat) => {
                  const original = getOriginal(slot, stat);
                  const hasStat = original !== null;
                  const edited = isEdited(slot, stat);

                  if (!hasStat) {
                    return <td key={stat} className="px-3 py-2" />;
                  }

                  return (
                    <td key={stat} className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {edited && (
                          <span className="text-[10px] text-text-faint line-through tabular-nums">
                            {original}
                          </span>
                        )}
                        <CellSpinner
                          value={getValue(slot, stat) ?? 0}
                          edited={edited}
                          onChange={(v) => handleChange(slot, stat, v)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-default">
              <td className="px-3 py-2 text-xs font-medium text-text-muted">Total</td>
              {statColumns.map((stat) => {
                const changed = totals[stat] !== originalTotals[stat];
                return (
                  <td key={stat} className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {changed && (
                        <span className="text-[10px] text-text-faint line-through tabular-nums">
                          {originalTotals[stat]}
                        </span>
                      )}
                      <span className={`text-sm font-medium tabular-nums ${changed ? 'text-amber-400' : 'text-text-secondary'}`}>
                        {totals[stat]}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {!slots.some((s) => ['cape', 'glove', 'shoe'].includes(s)) && (
        <p className="mt-2 text-[11px] text-text-faint">
          Cape, glove, and shoe use standardized tier values (configurable via dashboard CGS controls).
        </p>
      )}

      {changes.length > 0 && (
        <TemplateProposal className={className} tier={tier} changes={changes} />
      )}
    </div>
  );
}

function CellSpinner({
  value,
  edited,
  onChange,
}: {
  value: number;
  edited: boolean;
  onChange: (value: number) => void;
}) {
  const decrement = useCallback(() => {
    onChange(Math.max(0, value - 1));
  }, [value, onChange]);

  const increment = useCallback(() => {
    onChange(value + 1);
  }, [value, onChange]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  const btnClass = 'flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted';

  return (
    <div className={`flex items-stretch overflow-hidden rounded border ${
      edited ? 'border-amber-600/50' : 'border-border-default'
    }`}>
      <button type="button" tabIndex={-1} className={btnClass} {...decSpinner}>
        &minus;
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
        className={`w-[48px] border-x px-1 py-1 text-center text-sm tabular-nums transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          edited
            ? 'border-amber-600/50 bg-amber-950/20 text-amber-400'
            : 'border-border-default bg-bg-raised text-text-primary'
        }`}
      />
      <button type="button" tabIndex={-1} className={btnClass} {...incSpinner}>
        +
      </button>
    </div>
  );
}
```

Key changes:
- Removed `activeInput` state (spinners handle increment/decrement natively, no need for text-mode tracking)
- Added `CellSpinner` sub-component matching `BuildStatEditor`'s `StatInput` pattern
- Imported `useSpinner` from `../hooks/useSpinner.js`
- Imported `TH` from `../utils/styles.js`, `slotDisplayName`/`OVERALL_TOOLTIP` from `../utils/slot-names.js`
- Card wrapper: `rounded-lg border border-border-subtle bg-bg-raised p-4`
- Table rows: `border-border-subtle hover:bg-white/[0.03]`
- Cell padding: `px-3 py-2` (slot column), `px-3 py-1.5` (spinner cells — slightly less vertical to keep row height reasonable)
- "Overall" slot gets dotted-underline tooltip via `title` attribute
- Spinner border turns amber when edited, matching the input highlight

**Step 2: Run type-check**

Run: `cd web && npx tsc --noEmit`
Expected: No errors.

**Step 3: Visually verify**

Run: `cd web && npm run dev`
Check the Build Explorer → Edit Template to confirm spinners render, slot names are capitalized, "Overall" has tooltip, card looks right.

**Step 4: Commit**

```
restyle template editor with spinners and site styling
```

---

### Task 3: Fix TemplateProposal background

**Files:**
- Modify: `web/src/components/TemplateProposal.tsx`

**Step 1: Change the container background**

On line 40, change:
```tsx
<div className="mt-5 rounded border border-border-default bg-bg-surface p-4">
```
to:
```tsx
<div className="mt-5 rounded border border-border-subtle bg-bg-raised p-4">
```

**Step 2: Commit**

```
fix template proposal background to match card pattern
```

---

### Task 4: Update tests for new slot display names

The existing tests check for raw slot names like `'weapon'` and `'helmet'`. These are now capitalized.

**Files:**
- Modify: `web/src/components/TemplateEditor.test.tsx`

**Step 1: Update the test assertions**

Replace lines 21-27 (the first test body):

```typescript
it('renders slot rows and stat columns from breakdown', () => {
  render(<TemplateEditor className="hero" tier="high" />);
  expect(screen.getByText('Weapon')).toBeTruthy();
  expect(screen.getByText('Helmet')).toBeTruthy();
  expect(screen.getByText('STR')).toBeTruthy();
  expect(screen.getByText('WATK')).toBeTruthy();
  expect(screen.getByText('DEX')).toBeTruthy();
});
```

Update the edit tests (lines 34-48, 51-61) — the spinbutton lookup by value still works since we're finding inputs by value, not by label. But check that `screen.getByText('18')` still works for the struck-through original. This should be fine since the struck-through span text doesn't change.

**Step 2: Run all web tests**

Run: `cd web && npx vitest run`
Expected: All template-related tests pass. Pre-existing localStorage failures are unrelated.

**Step 3: Commit**

```
update template editor tests for capitalized slot names
```

---

### Task 5: Final verification

**Step 1: Run web type-check**

Run: `cd web && npx tsc --noEmit`
Expected: No errors.

**Step 2: Run all web tests**

Run: `cd web && npx vitest run`
Expected: All template-related tests pass.

**Step 3: Run engine tests**

Run: `npx vitest run`
Expected: All engine tests pass.
