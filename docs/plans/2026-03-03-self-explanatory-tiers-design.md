# Self-Explanatory Tiers — Design

## Problem

When someone sees "Low", "Mid", "High" on the web dashboard, there's no indication of what those mean — level, funding, potion, scrolling quality. The detail exists in `gear-assumptions.md` but isn't surfaced in the UI.

## Solution

A collapsible "Tier Assumptions" panel on the Dashboard, placed between the filter bar and the chart/table.

### Collapsed state (default)

A single clickable row: `▸ Tier Assumptions` — minimal footprint for returning users.

### Expanded state

A compact side-by-side comparison table:

| | Low (~Lv165) | Mid (~Lv185) | High (Lv200) |
|---|---|---|---|
| **Weapon** | Budget | Well-scrolled | Near-perfect |
| **Potion** | Stopper | Stopper | Apple |
| **C/G/S** | 15 / 12 / 10 | 17 / 14 / 10 | 19 / 17 / 13 |

### Design decisions

- **Static data in the component.** These are canonical assumptions that rarely change. No new data files or engine changes.
- **Qualitative weapon descriptions** instead of WATK numbers. Weapon WATK varies dramatically by class (76 for NL Claw vs 150 for Hero 2H Sword), so raw numbers would be misleading. "Budget / Well-scrolled / Near-perfect" communicates funding intent.
- **Collapsed by default.** First-time users can expand it; returning users aren't cluttered.
- **Matches existing dashboard styling** — dark bg, subtle borders, dim labels, theme color tokens.

### Scope

- One new component: `TierAssumptions.tsx`
- One edit: `Dashboard.tsx` to render it
- No engine changes, no new data files, no CLI changes
