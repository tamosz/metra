# CGS Editor Design

## Summary

Replace the tier dropdown with tier preset buttons and 3 editable CGS (Cape/Glove/Shoe WATK) input boxes. Clicking a tier populates the boxes with that tier's defaults. Users can then freely adjust individual values with +/- steppers and see DPS charts update in real time.

## UI Layout

Tier preset buttons and CGS inputs form a single unified control group:

```
[ Low ] [ Mid ] [ High ] [ Perfect ]    Cape [  20  ] [+][-]   Glove [  18  ] [+][-]   Shoe [  16  ] [+][-]
```

- Tier buttons are toggle-style, one active at a time. Clicking sets all 3 CGS boxes to that tier's defaults.
- CGS inputs are numeric text fields with +/- stepper buttons. Step size: 1 WATK.
- When CGS values don't match any tier's defaults, no tier button is highlighted.
- Single-tier view only (remove "All" option).

## CGS Defaults Per Tier

| Tier    | Cape | Glove | Shoe |
|---------|------|-------|------|
| Low     | 10   | 12    | 10   |
| Mid     | 15   | 16    | 13   |
| High    | 20   | 18    | 16   |
| Perfect | 22   | 22    | 18   |

## Data Flow

1. User clicks a tier preset -> state: `{ selectedTier, cape, glove, shoe }` set to tier defaults.
2. User adjusts CGS via +/- or direct input -> CGS values update independently.
3. `useSimulation` receives `selectedTier` (for base gear template) and CGS override values.
4. For each physical class, compute adjusted WATK:
   - Load gear template for `{class}-{selectedTier}`
   - Extract original CGS from `gearBreakdown`: `origCGS = cape.WATK + glove.WATK + shoe.WATK`
   - `adjustedWATK = template.totalWeaponAttack - origCGS + userCape + userGlove + userShoe`
5. Mage classes use the selected tier's template unmodified (no CGS adjustment).
6. DPS updates reactively.

## State Management

- Dashboard state: `selectedTier: string`, `cgsValues: { cape: number, glove: number, shoe: number }`
- Clicking a tier preset sets both `selectedTier` and resets `cgsValues` to defaults.
- CGS floor at 0, no upper cap.
- Default to "High" tier on first load.

## URL Sharing

CGS values encoded in URL hash: `c=cape,glove,shoe` parameter alongside existing params. Allows shared links to preserve custom CGS.

## Mage Handling

Mages skip CGS adjustment. Their gear templates use INT in cape/glove/shoe, not WATK. They use the selected tier's template as-is.

## Components

- **`TierPresets`** — new: tier buttons + 3 CGS stepper inputs. Emits `onTierChange(tier)` and `onCgsChange({ cape, glove, shoe })`.
- **`CgsInput`** — new: label, numeric input, +/- buttons. Emits `onChange(value)`.
- **Dashboard** — swaps tier `FilterGroup` for `TierPresets`. Passes CGS values to `useSimulation`.

## What Changes

- Dashboard tier dropdown -> tier preset buttons + CGS inputs
- `useSimulation` hook gains CGS override parameter
- Single-tier view only (remove "All" option)

## What Stays the Same

- Custom tier feature (coexists, different purpose)
- Engine layer (no changes to damage/DPS functions)
- Gear template JSON files (untouched)
- Proposal builder / comparison
- CLI
