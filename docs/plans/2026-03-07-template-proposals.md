# Template Proposals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let non-technical users edit per-slot gear template values in the web UI and submit changes as a pre-filled GitHub issue.

**Architecture:** A `getGearBreakdown()` function in bundle.ts exposes raw per-slot data from gear template JSON files. A `TemplateEditor` component renders the breakdown as an editable grid inside the Build Explorer. A `TemplateProposal` component formats the diff as Markdown, builds a pre-filled GitHub issue URL, and offers a clipboard fallback.

**Tech Stack:** React, Vitest, no new dependencies

---

### Task 1: Expose raw gear breakdown from bundle

**Files:**
- Modify: `web/src/data/bundle.ts:27-31,53-86`

The raw `gearBreakdown` exists in the JSON template files and is loaded via `templateModules`, but only the computed `CharacterBuild` (with summed totals) is exposed. The template editor needs the per-slot breakdown.

**Step 1: Add `getGearBreakdown` function to bundle.ts**

Add this exported function after the `discoveredData` export (line 168):

```ts
/**
 * Get the raw per-slot gear breakdown for a template.
 * Returns the gearBreakdown object from the JSON file as-is.
 * CGS slots that come from tier-defaults are NOT included — only class-specific gear.
 */
export function getGearBreakdown(
  templateKey: string
): Record<string, Record<string, number>> | null {
  const matchingEntry = Object.entries(templateModules).find(
    ([path]) => path.endsWith(`/${templateKey}.json`)
  );
  if (!matchingEntry) return null;

  const raw = matchingEntry[1] as Record<string, unknown>;
  const breakdown = raw.gearBreakdown as
    | Record<string, Record<string, number>>
    | undefined;
  if (!breakdown) return null;

  // Deep clone so callers can't mutate the bundled data
  const result: Record<string, Record<string, number>> = {};
  for (const [slot, stats] of Object.entries(breakdown)) {
    result[slot] = { ...stats };
  }
  return result;
}
```

**Step 2: Verify type-check passes**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add web/src/data/bundle.ts
git commit -m "expose raw gear breakdown from bundle"
```

---

### Task 2: Create template proposal formatter with tests

**Files:**
- Create: `web/src/utils/template-proposal.ts`
- Create: `web/src/utils/template-proposal.test.ts`

**Step 1: Write the tests**

```ts
import { describe, it, expect } from 'vitest';
import {
  formatTemplateProposal,
  buildGitHubIssueUrl,
  generateProposalTitle,
  type SlotChange,
} from './template-proposal.js';

describe('generateProposalTitle', () => {
  it('generates title from changes', () => {
    const changes: SlotChange[] = [
      { slot: 'helmet', stat: 'STR', from: 22, to: 25 },
      { slot: 'pendant', stat: 'STR', from: 27, to: 30 },
    ];
    expect(generateProposalTitle('hero', 'high', changes)).toBe(
      'gear template: hero high — helmet STR, pendant STR'
    );
  });

  it('truncates when many changes', () => {
    const changes: SlotChange[] = Array.from({ length: 10 }, (_, i) => ({
      slot: `ring${i}`,
      stat: 'STR',
      from: 1,
      to: 2,
    }));
    const title = generateProposalTitle('hero', 'high', changes);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).toContain('...');
  });
});

describe('formatTemplateProposal', () => {
  it('generates markdown with changes table and justification', () => {
    const changes: SlotChange[] = [
      { slot: 'helmet', stat: 'STR', from: 22, to: 25 },
    ];
    const md = formatTemplateProposal('hero', 'high', changes, 'BiS helmet gives 25 STR');
    expect(md).toContain('## Gear Template Proposal: Hero (High)');
    expect(md).toContain('| helmet | STR | 22 | 25 |');
    expect(md).toContain('BiS helmet gives 25 STR');
    expect(md).toContain('`data/gear-templates/hero-high.json`');
  });

  it('includes empty justification section when no justification', () => {
    const changes: SlotChange[] = [
      { slot: 'weapon', stat: 'WATK', from: 140, to: 145 },
    ];
    const md = formatTemplateProposal('hero', 'high', changes, '');
    expect(md).toContain('### Justification');
    expect(md).toContain('_No justification provided._');
  });
});

describe('buildGitHubIssueUrl', () => {
  it('returns a URL for normal-length content', () => {
    const url = buildGitHubIssueUrl('test title', 'test body');
    expect(url).not.toBeNull();
    expect(url).toContain('github.com/tamosz/metra/issues/new');
    expect(url).toContain('title=');
    expect(url).toContain('body=');
    expect(url).toContain('labels=gear-template');
  });

  it('returns null when content exceeds URL limit', () => {
    const longBody = 'x'.repeat(9000);
    const url = buildGitHubIssueUrl('title', longBody);
    expect(url).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run src/utils/template-proposal.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```ts
import { formatClassName } from './format.js';

export interface SlotChange {
  slot: string;
  stat: string;
  from: number;
  to: number;
}

const GITHUB_REPO = 'tamosz/metra';
const MAX_URL_LENGTH = 8000;

export function generateProposalTitle(
  className: string,
  tier: string,
  changes: SlotChange[]
): string {
  const prefix = `gear template: ${className} ${tier} — `;
  const maxLen = 70;

  const parts = changes.map((c) => `${c.slot} ${c.stat}`);
  let suffix = parts.join(', ');

  if ((prefix + suffix).length > maxLen) {
    // Truncate and add ellipsis
    suffix = '';
    for (const part of parts) {
      const next = suffix ? `${suffix}, ${part}` : part;
      if ((prefix + next + ', ...').length > maxLen) {
        suffix += ', ...';
        break;
      }
      suffix = next;
    }
  }

  return prefix + suffix;
}

export function formatTemplateProposal(
  className: string,
  tier: string,
  changes: SlotChange[],
  justification: string
): string {
  const displayName = formatClassName(className);
  const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);

  const lines: string[] = [
    `## Gear Template Proposal: ${displayName} (${tierDisplay})`,
    '',
    '### Changes',
    '',
    '| Slot | Stat | Current | Proposed |',
    '|------|------|---------|----------|',
  ];

  for (const change of changes) {
    lines.push(`| ${change.slot} | ${change.stat} | ${change.from} | ${change.to} |`);
  }

  lines.push('');
  lines.push('### Justification');
  lines.push('');
  if (justification.trim()) {
    lines.push(justification.trim());
  } else {
    lines.push('_No justification provided._');
  }

  lines.push('');
  lines.push('### Template File');
  lines.push('');
  lines.push(`\`data/gear-templates/${className}-${tier}.json\``);

  return lines.join('\n');
}

export function buildGitHubIssueUrl(
  title: string,
  body: string
): string | null {
  const params = new URLSearchParams({
    title,
    body,
    labels: 'gear-template',
  });
  const url = `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
  if (url.length > MAX_URL_LENGTH) return null;
  return url;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd web && npx vitest run src/utils/template-proposal.test.ts`
Expected: PASS — all tests

**Step 5: Commit**

```bash
git add web/src/utils/template-proposal.ts web/src/utils/template-proposal.test.ts
git commit -m "add template proposal formatter and github issue url builder"
```

---

### Task 3: Create TemplateEditor component

**Files:**
- Create: `web/src/components/TemplateEditor.tsx`

This component shows the per-slot gear breakdown as an editable grid.

**Context you need to know:**
- `getGearBreakdown(templateKey)` returns `Record<string, Record<string, number>>` — each slot maps to its stats
- The grid shows one row per slot, one column per stat that appears anywhere in the breakdown
- Cells are inline number inputs; empty cells (stat not present in slot) are blank/disabled
- Changed cells get amber highlight
- A totals row sums each column

**Step 1: Write the component**

```tsx
import { useState, useMemo, useCallback } from 'react';
import { getGearBreakdown } from '../data/bundle.js';
import { TemplateProposal } from './TemplateProposal.js';
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

  // Reset edits when class/tier changes
  const [prevKey, setPrevKey] = useState(templateKey);
  if (templateKey !== prevKey) {
    setPrevKey(templateKey);
    setEdits({});
  }

  if (!breakdown) {
    return (
      <div className="py-4 text-sm text-text-dim">
        No gear breakdown available for this template.
      </div>
    );
  }

  const slots = Object.keys(breakdown);

  // Discover all stat columns from the breakdown
  const statColumns = useMemo(() => {
    const stats = new Set<string>();
    for (const slotStats of Object.values(breakdown)) {
      for (const stat of Object.keys(slotStats)) {
        stats.add(stat);
      }
    }
    // Sort: primary stats first (STR/DEX/INT/LUK), then attack stats
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

  // Compute totals
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

  // Collect changes for proposal
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

  const thStyle = 'px-2 py-1.5 text-[11px] uppercase tracking-wide text-text-dim font-medium text-right';
  const tdSlot = 'px-2 py-1 text-xs text-text-muted text-left';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th className={`${thStyle} text-left`}>Slot</th>
              {statColumns.map((stat) => (
                <th key={stat} className={thStyle}>{stat}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-b border-border-default/50">
                <td className={tdSlot}>{slot}</td>
                {statColumns.map((stat) => {
                  const original = getOriginal(slot, stat);
                  const hasStat = original !== null;
                  const edited = isEdited(slot, stat);

                  if (!hasStat) {
                    return <td key={stat} className="px-2 py-1" />;
                  }

                  return (
                    <td key={stat} className="px-2 py-0.5">
                      <div className="flex items-center justify-end gap-1">
                        {edited && (
                          <span className="text-[10px] text-text-faint line-through tabular-nums">
                            {original}
                          </span>
                        )}
                        <input
                          type="number"
                          value={getValue(slot, stat) ?? ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) handleChange(slot, stat, v);
                          }}
                          className={`w-14 rounded border px-1.5 py-0.5 text-right text-sm tabular-nums transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            edited
                              ? 'border-amber-600/50 bg-amber-950/20 text-amber-400'
                              : 'border-border-default bg-bg-surface text-text-primary'
                          }`}
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
              <td className={`${tdSlot} font-medium`}>Total</td>
              {statColumns.map((stat) => {
                const changed = totals[stat] !== originalTotals[stat];
                return (
                  <td key={stat} className="px-2 py-1.5 text-right">
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

      {changes.length > 0 && (
        <TemplateProposal className={className} tier={tier} changes={changes} />
      )}
    </div>
  );
}
```

**Step 2: Verify type-check passes (will fail — TemplateProposal doesn't exist yet)**

This is expected. We'll create TemplateProposal in the next task.

**Step 3: Commit**

```bash
git add web/src/components/TemplateEditor.tsx
git commit -m "add per-slot template editor component"
```

---

### Task 4: Create TemplateProposal component

**Files:**
- Create: `web/src/components/TemplateProposal.tsx`

This component appears below the grid when edits exist. It shows a justification textarea and two action buttons.

**Step 1: Write the component**

```tsx
import { useState, useCallback } from 'react';
import {
  formatTemplateProposal,
  buildGitHubIssueUrl,
  generateProposalTitle,
  type SlotChange,
} from '../utils/template-proposal.js';

interface TemplateProposalProps {
  className: string;
  tier: string;
  changes: SlotChange[];
}

export function TemplateProposal({ className, tier, changes }: TemplateProposalProps) {
  const [justification, setJustification] = useState('');
  const [copied, setCopied] = useState(false);

  const title = generateProposalTitle(className, tier, changes);
  const body = formatTemplateProposal(className, tier, changes, justification);
  const issueUrl = buildGitHubIssueUrl(title, body);

  const handleCopy = useCallback(async () => {
    const text = `**${title}**\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [title, body]);

  const btnBase =
    'cursor-pointer rounded border px-3 py-1.5 text-xs font-medium transition-colors';
  const btnPrimary = `${btnBase} border-accent bg-accent/10 text-accent hover:bg-accent/20`;
  const btnSecondary = `${btnBase} border-border-default bg-transparent text-text-muted hover:border-border-active hover:text-text-secondary`;

  return (
    <div className="mt-5 rounded border border-border-default bg-bg-surface p-4">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-dim">
        Propose Changes
      </div>
      <p className="mb-3 text-xs text-text-dim">
        {changes.length} change{changes.length !== 1 ? 's' : ''} to {className}-{tier} template.
        Submit as a GitHub issue for review.
      </p>

      <textarea
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        placeholder="Why should these values change? (optional but helpful)"
        rows={3}
        className="mb-3 w-full resize-y rounded border border-border-default bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
      />

      <div className="flex items-center gap-2">
        {issueUrl ? (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            Open as GitHub Issue
          </a>
        ) : (
          <span className="text-xs text-text-dim">
            Proposal too large for GitHub URL — use copy instead.
          </span>
        )}
        <button type="button" onClick={handleCopy} className={btnSecondary}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Run type-check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (TemplateEditor now has its import satisfied)

**Step 3: Commit**

```bash
git add web/src/components/TemplateProposal.tsx
git commit -m "add template proposal component with github issue and clipboard actions"
```

---

### Task 5: Integrate TemplateEditor into BuildExplorer

**Files:**
- Modify: `web/src/components/BuildExplorer.tsx`

Add an "Edit Template" toggle that shows the TemplateEditor below the stats/DPS section.

**Step 1: Add state and import**

At the top of `BuildExplorer.tsx`, add:

```ts
import { TemplateEditor } from './TemplateEditor.js';
```

Inside `BuildExplorer`, add state:

```ts
const [showTemplateEditor, setShowTemplateEditor] = useState(false);
```

**Step 2: Add the "Edit Template" button**

In the action buttons row (after the Save Build / Load section, around line 128), add:

```tsx
{template && (
  <button
    onClick={() => setShowTemplateEditor(!showTemplateEditor)}
    className={actionBtn}
  >
    {showTemplateEditor ? 'Hide Template' : 'Edit Template'}
  </button>
)}
```

**Step 3: Render the TemplateEditor**

After the stats/DPS grid (after the closing `</div>` of the `grid grid-cols-1` div, around line 155), add:

```tsx
{showTemplateEditor && template && (
  <div className="mt-6">
    <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-text-dim">
      Gear Breakdown — {formatClassName(selectedClass)} ({selectedTier})
    </div>
    <TemplateEditor className={selectedClass} tier={selectedTier} />
  </div>
)}
```

**Step 4: Run type-check**

Run: `cd web && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add web/src/components/BuildExplorer.tsx
git commit -m "add edit template toggle to build explorer"
```

---

### Task 6: Run full verification

**Step 1: Run engine tests**

Run: `npx vitest run`
Expected: all pass

**Step 2: Run web tests**

Run: `cd web && npx vitest run`
Expected: all pass (existing + new template-proposal tests)

**Step 3: Run type-checks**

Run: `npm run type-check:all`
Expected: PASS

**Step 4: Smoke test in browser**

Run: `cd web && npm run dev`

Verify:
- Go to Build Explorer, pick a class and tier
- "Edit Template" button appears
- Clicking it shows the per-slot grid with correct values
- Editing a cell highlights it amber, shows original value struck through
- Totals row updates live
- "Propose Changes" section appears below with change count
- Justification textarea works
- "Open as GitHub Issue" opens a new tab with pre-filled issue
- "Copy to Clipboard" copies formatted proposal text
- Switching class/tier resets the editor
- Hiding and re-showing the editor preserves no stale state

**Step 5: Push**

```bash
git push
```
