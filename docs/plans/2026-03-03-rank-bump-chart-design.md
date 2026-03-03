# Rank Bump Chart Design

## Purpose

Visualize how a proposal reshuffles class rankings. The existing comparison view shows DPS bars and a delta table, but rank movements are buried in small badges. A bump chart makes rank swaps immediately visible.

## What it is

A two-column connected dot chart: left column = "Before" ranks, right column = "After" ranks. Lines connect each class/skill from old rank to new rank. Crossing lines = rank swaps.

## Placement

In `ProposalResults`, between the existing `ComparisonChart` (bar chart) and `DeltaTable`. Only shown when a specific tier is selected (not "All Tiers") and ranks are present.

## Data

Consumes the same `filtered` deltas already in `ProposalResults`. Each `DeltaEntry` has `rankBefore` and `rankAfter`. No new data structures needed.

## Visual spec

- **Axes:** Two vertical columns labeled "Before" and "After", rank 1 at top
- **Dots:** Circles at each rank position, colored by class via `getClassColor()`
- **Lines:** Bezier curves connecting before → after. Movers get full opacity + thicker stroke. Unchanged ranks get muted/dashed lines
- **Labels:** Class + skill name next to dots (left of before-column, right of after-column)
- **Tooltips:** Class, skill, rank before → after, DPS before → after, % change
- **Height:** ~40px per rank position
- **Colors:** Class colors, muted lines use `colors.textFaint`

## Implementation

- New `RankBumpChart` component co-located in `ProposalResults.tsx`
- Built with Recharts `LineChart` — X-axis has two points, Y-axis is rank (reversed domain `[maxRank, 1]`), one `<Line>` per entry
- Section header: "Rank Movement"
- Gated on `selectedTier !== 'all' && hasRanks`

## Out of scope

- Animation
- "All Tiers" combined view
- New data structures or engine changes
