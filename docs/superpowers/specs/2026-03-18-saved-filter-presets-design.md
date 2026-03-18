# Saved Filter Presets

Save and recall named toggle combinations for one-click context switching on the dashboard.

## Decisions

- **Coexists with CGS presets** — CGS presets remain as-is; filter presets are a separate, parallel feature.
- **State captured:** uses `FilterState` from `filter-url.ts` but **omits the `cgs` field**. Presets capture: tier, buffs, elements, KB settings, target count, cap, skill groups, breakdown. CGS values are managed separately by the existing CGS presets system. A new `PresetFilterState = Omit<FilterState, 'cgs'>` type alias makes this explicit. Dirty detection and `buildFilterState` calls for presets strip `cgs` before comparing.
- **Storage strategy:** store all fields; apply all fields. Missing fields (from older presets predating new toggles) fall back to current defaults.
- **Built-in presets:** ship with 3 deletable defaults (Bossing, Training, Unbuffed). Treated identically to user presets — can be deleted, no special protection.
- **Dirty tracking:** when the user modifies a toggle while a preset is active, the preset button shows an amber "modified" indicator (matching the existing tier + custom CGS pattern).
- **UI placement:** dedicated row above the filter bar. Presets act as a mode switch for everything below.
- **Approach:** standalone hook + component (not embedded in SimulationControlsContext).

## Built-in Presets

| Preset | Tier | Buffs | KB | Targets | Cap | Elements | Groups |
|--------|------|-------|----|---------|-----|----------|--------|
| Bossing | perfect | all default (on) | off | 1 | on | none | main |
| Training | perfect | all default (on) | off | 15 | on | none | main, multi-target |
| Unbuffed | perfect | SE off, Echo off, SI off, MW off, Potion off | off | 1 | on | none | main |

As `FilterState` objects (only non-default fields stored):

```typescript
const BUILTIN_PRESETS: FilterPreset[] = [
  { id: 'builtin-bossing', name: 'Bossing', state: {}, builtIn: true },
  { id: 'builtin-training', name: 'Training', state: { targets: 15, groups: ['main', 'multi-target'] }, builtIn: true },
  {
    id: 'builtin-unbuffed', name: 'Unbuffed',
    state: {
      buffs: { sharpEyes: false, echoActive: false, speedInfusion: false, mwLevel: 0, attackPotion: 0 },
    },
    builtIn: true,
  },
];
```

Note: `bullseye` is intentionally omitted from the Unbuffed preset — it's a Corsair self-buff, not a party buff, so "unbuffed" refers to the absence of external party buffs.

## Data Model

```typescript
// web/src/utils/filter-presets.ts

type PresetFilterState = Omit<FilterState, 'cgs'>;

interface FilterPreset {
  id: string;                // 'preset-<timestamp><random>' for user presets
                             // 'builtin-<slug>' for built-in presets
  name: string;
  state: PresetFilterState;  // FilterState without cgs — CGS managed separately
  builtIn: boolean;
}
```

**localStorage key:** `'royals-sim:filter-presets'`

Only user-created presets are persisted. Built-in presets are defined in code and merged at load time. If a user deletes a built-in preset, its ID is stored in a separate key (`'royals-sim:filter-presets:dismissed'`) so it stays deleted across sessions.

**ID generation:** follows existing pattern — `'preset-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`.

## Hook: `useFilterPresets`

New file: `web/src/hooks/useFilterPresets.ts`

```typescript
interface FilterPresetsState {
  presets: FilterPreset[];        // built-in (not dismissed) + user presets
  activePresetId: string | null;
  isDirty: boolean;               // active preset state ≠ current controls
  save: (name: string) => void;   // snapshot current FilterState as new preset
  remove: (id: string) => void;   // delete user preset or dismiss built-in
  apply: (id: string) => void;    // set all controls to preset state
  revert: () => void;             // re-apply active preset (clear dirty state)
}
```

### Behaviors

- **`save(name)`** — captures current filter state using `buildFilterState(controls)` (extracted from `useFilterPermalink.ts`). Creates a new `FilterPreset`, persists to localStorage, sets it as active.
- **`apply(id)`** — sets active preset ID. Resets only the controls that presets manage (tier, buffs, elements, KB, targets, cap, groups, breakdown) to their defaults, then overlays the preset's stored values. Specifically: calls `setSelectedTier(FILTER_DEFAULTS.tier)`, `setBuffOverrides({})`, `setElementModifiers({})`, `setKbEnabled(false)`, `setBossAttackInterval(FILTER_DEFAULTS.bossAttackInterval)`, `setBossAccuracy(FILTER_DEFAULTS.bossAccuracy)`, `setTargetCount(1)`, `setCapEnabled(true)`, `setActiveGroups(defaultActiveGroups())`, `setBreakdownEnabled(false)` — then applies preset overrides on top. Does **not** touch CGS values, efficiency overrides, or edit mode state.
- **`isDirty`** — computed by comparing `buildFilterState(controls)` (with `cgs` stripped) against `activePreset.state` via deep equality. Recalculated on every control change. CGS changes do not affect dirty state since presets don't manage CGS.
- **`revert()`** — calls `apply(activePresetId)` to re-apply the preset and clear dirty state.
- **`remove(id)`** — for user presets: removes from localStorage. For built-in presets: adds ID to the dismissed set in localStorage. Clears active ID if removing the active preset.
- **Clicking active non-dirty preset** — deselects (sets activePresetId to null). Handled in the component, not the hook.
- **Clicking active dirty preset** — reverts to saved state. Handled in the component by calling `revert()`.

### `buildFilterState` extraction

`buildFilterState()` currently lives as a local function in `useFilterPermalink.ts`. It gets moved to `web/src/utils/filter-state.ts` and exported. Both `useFilterPermalink` and `useFilterPresets` import from there. No behavior change.

## Component: `FilterPresets`

New file: `web/src/components/FilterPresets.tsx`

### Layout

Rendered in `Dashboard.tsx` as a row above the existing filter bar, inside a matching container (rounded border, subtle bg).

```
[PRESET label] [Bossing] [Training] [Unbuffed] [Custom1] [Custom2] ...  [Save current...]
```

### Styling

- **Inactive preset:** transparent bg, dim text, hover highlight. Same styling as inactive tier buttons in `TierPresets`.
- **Active preset (clean):** indigo border/bg — `border-border-active bg-bg-active text-text-bright`. Matches active tier button style.
- **Active preset (dirty):** amber border/bg — `border-amber-700/50 bg-amber-950/30 text-amber-400`. Matches tier-with-modified-CGS style.
- **Label:** `PRESET` in the same `text-[11px] font-medium uppercase tracking-wide text-text-dim` style as other filter bar labels.

### Interactions

- **Click inactive preset** — applies it (calls `apply(id)`).
- **Click active clean preset** — deselects it (sets active to null, controls stay as-is).
- **Click active dirty preset** — reverts to saved state (calls `revert()`).
- **"Save current..." link** — shows inline text input + OK button (same pattern as CGS build save). Enter confirms, Escape cancels. Input auto-focuses.
- **Delete (×)** — appears on hover for all presets. Clicking removes/dismisses the preset. Confirmation not needed (consistent with CGS build delete).

### Save button visibility

"Save current..." is always visible unless:
- The save input is already showing.
- The current state exactly matches the active preset (not dirty, preset selected).

### Responsive behavior

Row uses `flex flex-wrap` — wraps naturally on narrow screens, consistent with the existing filter bar.

## Integration Points

### Dashboard.tsx

Add `FilterPresets` component above the existing filter bar div. Pass the `useFilterPresets()` state as props (or the component can consume context directly + accept the presets state).

### useFilterPermalink.ts

Extract `buildFilterState()` to `web/src/utils/filter-state.ts`. Import from new location. No behavior change.

### App.tsx (URL loading)

No changes needed. `#f=` URL loading already applies filter state via context setters. Presets don't interact with URL loading — if you load a `#f=` URL, no preset is active (even if the state happens to match one).

## Files Changed

| File | Change |
|------|--------|
| `web/src/utils/filter-presets.ts` | **New.** `FilterPreset` type, `BUILTIN_PRESETS` constant. |
| `web/src/utils/filter-state.ts` | **New.** Extracted `buildFilterState()` + `filterStatesEqual()` + `stripCgs()` helpers. |
| `web/src/hooks/useFilterPresets.ts` | **New.** Hook with CRUD, apply, dirty detection. |
| `web/src/components/FilterPresets.tsx` | **New.** Preset row component. |
| `web/src/hooks/useFilterPermalink.ts` | **Modified.** Import `buildFilterState` from new location. |
| `web/src/components/Dashboard.tsx` | **Modified.** Add `FilterPresets` above filter bar. |

## Testing

- **`useFilterPresets` hook tests** — save/remove/apply/revert/dirty detection logic. Mock localStorage.
- **`buildFilterState` / `filterStatesEqual` unit tests** — extracted utils get their own test file.
- **Component test or Playwright e2e** — click preset, verify controls change. Modify toggle, verify dirty indicator. Save custom preset, verify it appears and persists on reload.

## Out of Scope

- Preset reordering or drag-and-drop.
- Preset export/import (the `#f=` URL already serves this purpose).
- Renaming presets after creation.
- Syncing presets across devices (no backend).
