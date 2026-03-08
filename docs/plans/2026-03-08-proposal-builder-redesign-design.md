# Proposal Builder Redesign — What-If Mode on Dashboard

## Problem

The proposal builder is a separate page with a worse UX than the dashboard. Building changes one-by-one via dropdowns feels like filling out a form. Results require a manual "Simulate" click and appear in a disconnected results view. The dashboard is interactive and explorable; the proposal builder is a static form → static results pipeline.

## Design

Replace the proposal builder page with a **"What If" toggle on the dashboard**. Activating it makes skill detail panels editable — click a skill, type new values, rankings update live. No simulate button, no separate results page.

### What-If Toggle

New toggle in the dashboard toolbar, styled like existing toggles (CapToggle, KbToggle).

- Toggles `whatIfMode` boolean in the simulation controls context
- When active: accent-colored `TOGGLE_ON` style. A **changes pill** appears next to it showing active change count ("3 changes"). Clicking the pill opens the changes popover.
- When inactive: dashboard looks exactly as it does today
- Turning it off clears all proposal changes and returns to baseline

All existing filter controls (buffs, elements, KB, targets, cap) continue to work normally in what-if mode.

### Inline Editing in the Detail Panel

When what-if mode is on and a ranking row is expanded:

- Editable number inputs appear at the top of the detail panel for `basePower`, `multiplier`, `hitCount`, `maxTargets`
- Pre-filled with current values, subtle labels
- Editing a value immediately adds/updates a proposal change and triggers re-simulation
- Clearing a field removes that change
- Fields with active changes get an accent-colored border
- Original value shown dimmed below/beside the modified value

**Combo groups** (e.g., Barrage + Demolition): the detail panel shows each sub-skill as a labeled section with its own editable fields. Individual sub-skill DPS breakdowns are shown alongside the combo total. Same treatment for mixed rotations.

### Changes Popover

Anchored to the changes pill. Contains:

- **Proposal name** — text input, required for export
- **Author** — text input, optional
- **Changes list** — compact ChangeRow-style entries (class, skill, field, from → to, remove button). Clicking a change scrolls to that skill and expands its detail panel.
- **Export row** — three buttons: "Copy Link", "Copy Markdown", "Copy BBCode"

### Dashboard Visual Treatment

When what-if mode is active and changes exist:

**Ranking table:**
- Affected rows get a subtle accent left border
- DPS column shows `before → after` with a colored delta badge (+4.2% green, -2.1% red)
- Rank column shows movement arrows via existing RankCell component
- Unaffected rows unchanged

**DPS chart:**
- Affected skills get a ghost bar behind the main bar (~30% opacity) showing baseline value
- Unaffected bars unchanged

**Detail panel:**
- Breakdown section shows before/after for shifted values (DPS, damage range, crit, etc.)

No separate ComparisonChart, RankBumpChart, or DeltaTable — deltas are embedded in the dashboard's own visualizations.

### State Management

New state in `SimulationControlsContext`:
- `whatIfMode: boolean`
- `proposalChanges: ProposalChange[]`
- `proposalMeta: { name: string, author: string }`

Simulation flow:
- When what-if mode is on with changes, apply proposal patches to skill data before computing DPS (reuse `applyProposal` from `src/proposals/apply.ts`)
- Store both baseline and patched results so UI can show deltas
- Re-simulation debounced (~200ms)

### URL & Routing

- Remove `/proposals` route and nav link
- Stale `/proposals` URLs redirect to `/`
- `#p=` share URLs auto-enable what-if mode on the dashboard with changes pre-loaded
- `#b=` and `#c=` URL schemes unchanged

### Components Removed

- `ProposalBuilder.tsx`
- `ProposalResults.tsx`
- `useProposal.ts`
- `proposal/AddChangeForm.tsx`
- `proposal/Input.tsx`
- `proposal/JsonPanel.tsx`
- `proposal/ComparisonChart.tsx`
- `proposal/RankBumpChart.tsx`
- `proposal/DeltaTable.tsx`

### Components Kept/Reused

- `proposal/ChangeRow.tsx` — in the changes popover
- `proposal/RankCell.tsx` — already in ranking table
- `src/proposals/apply.ts`, `compare.ts`, `simulate.ts` — engine logic
- `src/report/markdown.ts`, `src/report/bbcode.ts` — export buttons
