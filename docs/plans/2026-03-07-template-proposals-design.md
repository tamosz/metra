# Template Proposals — Community Gear Template Editing

## Problem

Gear templates are the most contentious part of the simulator. Non-technical users can't easily propose changes — they'd need to edit JSON, understand git, and create a PR. We need a way for anyone to review per-slot gear breakdowns, edit values they disagree with, and submit a proposal with one click.

## Design

Add a per-slot **template editor** to the Build Explorer that lets users edit individual gear piece stats and submit their changes as a pre-filled GitHub issue.

### User Flow

1. User is in the Build Explorer, picks a class and tier
2. They click "Edit Template"
3. A per-slot editor opens showing the `gearBreakdown` from the gear template JSON — each slot with its stats
4. User edits any value — changed cells are highlighted showing `current → proposed`
5. A "Propose Changes" section appears with:
   - A text area for justification/reasoning
   - "Open as GitHub Issue" button (primary) — opens pre-filled issue in new tab
   - "Copy to Clipboard" button (fallback) — for pasting on Discord, forum, etc.

### Per-Slot Editor

Shows the `gearBreakdown` as a grid:

```
Slot        STR    DEX    WATK
───────────────────────────────
weapon       18            140
helmet       22     30
top          32
...
───────────────────────────────
Total       ...    ...     ...
```

- Only columns relevant to the class are shown (warriors: STR/DEX/WATK, mages: INT/LUK/MATK)
- Each cell is an inline number input
- Changed cells get amber highlight showing `current → proposed`
- Summary row at the bottom shows totals for sanity-checking
- Users can only edit existing slots — no adding/removing slots

### GitHub Issue Format

Title: `gear template: hero high — helmet STR, pendant STR` (auto-generated, truncated if needed)

Body:
```markdown
## Gear Template Proposal: Hero (High)

### Changes

| Slot | Stat | Current | Proposed |
|------|------|---------|----------|
| helmet | STR | 22 | 25 |
| pendant | STR | 27 | 30 |

### Justification

[user's text]

### Template File

`data/gear-templates/hero-high.json`
```

Pre-filled via `github.com/.../issues/new?title=...&body=...&labels=gear-template`. Falls back to copy-to-clipboard if URL exceeds GitHub's ~8KB limit.

### Technical Architecture

**New components:**
- `TemplateEditor` — per-slot grid with inline inputs, tracks edits as overrides
- `TemplateProposal` — justification textarea + action buttons, appears when edits exist

**New utilities:**
- `formatTemplateProposal(className, tier, changes, justification)` — generates Markdown issue body
- `buildGitHubIssueUrl(title, body)` — constructs pre-filled URL, returns null if too long

**Integration:** Build Explorer gets an "Edit Template" button that toggles the TemplateEditor. Self-contained — doesn't interact with the personal build/override system.

**No backend. No auth. No new dependencies.** Just UI that formats text and opens a URL.

**Unchanged:** engine, simulation, data loader, Build Explorer's personal build system, gear template JSON files (only changed by maintainers when merging proposals).
