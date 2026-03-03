# Skill Detail Drilldown

Click a row in the baseline ranking table to expand an inline detail panel showing formula breakdown and cross-tier DPS comparison.

## Engine Change

Add `totalCritRate` (0-1) to `DpsResult`. This is the only engine change — everything else is already returned.

## Derived Stats (computed in UI)

- **Crit contribution %** — fraction of DPS attributable to crits: `(critDamagePercent * critRate) / (skillDamagePercent * (1-critRate) + critDamagePercent * critRate)`
- **Per-hit damage** — `averageDamage / hitCount`
- Cap loss already in `capLossPercent`

## Interaction

- Click row → expand detail panel below it, click again → collapse
- Multiple rows can be open simultaneously
- Chevron indicator (▸/▾) in rank column signals clickability
- No animation on expand/collapse

## Expanded Panel Layout

Two sections: left breakdown, right tier chart. Stacked on mobile.

### Left: Formula Breakdown

Compact grid of labeled stat pairs:

```
Damage Range    12,400 – 18,200      Attack Time     0.69s
Skill Damage    260%                 Crit Damage     520%
Crit Rate       65%                  Crit Contribution  71%
Avg Damage      189,400              Hit Count       2
Cap Loss        0.3%                 Shadow Partner  ✓
```

- Labels in `text-text-dim`, values in `text-text-primary`, `tabular-nums`
- Crit contribution and cap loss conditionally colored when notable

### Right: Tier Comparison

Mini horizontal bar chart showing DPS for this class+skill across all tiers. Current tier's bar highlighted. Class color for bars.

```
Low     ████████░░░░░░░░░░   127,356
Mid     ████████████░░░░░░   185,200
High    ████████████████░░   247,314
Perfect █████████████████░   312,400
```

Shows all tiers even when table is filtered to a single tier.

## Styling

- Panel background: `bg-bg-raised`
- Top border: thin line in class color
- Horizontal padding matches table cells, `py-4` vertical
- Desktop: side-by-side layout. Mobile: stacked.

## Scope

- Baseline ranking table only (not proposal comparison view)
- No buff sensitivity or marginal gains (future work)
