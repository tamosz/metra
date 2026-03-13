# Filter State Permalinks

Encode dashboard filter state in the URL so users can share links like "here's what rankings look like with KB on, no SI, high tier."

## Hash prefix

`#f=` with lz-string compression, consistent with existing `#p=`, `#b=`, `#c=` prefixes. Only present when state differs from defaults — clean URL means all defaults.

Mutually exclusive with other prefixes. Only one hash prefix active at a time.

## Filter state shape

Partial object — only non-default values serialized:

```typescript
interface FilterState {
  tier?: string;                        // default: 'perfect'
  buffs?: BuffOverrides;                // default: {} (all buffs on)
  elements?: Record<string, number>;    // default: {}
  kb?: {                                // omitted entirely when KB is off
    interval?: number;                  // omitted when === DEFAULT_BOSS_ATTACK_INTERVAL (1.5)
    accuracy?: number;                  // omitted when === DEFAULT_BOSS_ACCURACY (250)
  };
  targets?: number;                     // default: 1
  cap?: boolean;                        // default: true
  cgs?: CgsValues;                      // default: per-tier from CGS_DEFAULTS
  groups?: string[];                    // serialized from Set<SkillGroupId>
  breakdown?: boolean;                  // default: false
}
```

Serialization: `JSON.stringify` -> `LZString.compressToEncodedURIComponent` -> `#f=...`. Decode is the reverse, returns null on failure.

### Serialization details

**KB state:** `kb` is omitted when `kbEnabled` is false. When `kbEnabled` is true, `kb` is present (possibly empty `{}`). `interval` and `accuracy` are only included when they differ from their defaults.

**Skill groups:** Serialized as `string[]`, deserialized back into `Set<SkillGroupId>`. On decode, filter to known group IDs only — unknown IDs are silently dropped.

**Validation:** Decoded numeric values are type-checked. If any value fails a basic type check, the entire decode returns null (same as existing build/proposal decode behavior).

### Default constants

Extract hardcoded defaults into named constants to avoid drift between context initialization and diff logic:

```typescript
export const FILTER_DEFAULTS = {
  tier: 'perfect',
  targetCount: 1,
  capEnabled: true,
  kbEnabled: false,
  bossAttackInterval: 1.5,
  bossAccuracy: 250,
  breakdownEnabled: false,
} as const;
```

Context initialization and the diff logic both reference these constants.

## URL sync

Two-way sync via a `useFilterPermalink` hook:

**State -> URL:** On every filter change, diff against defaults. Non-empty diff sets `#f=<compressed>` via `history.replaceState` (no back-button pollution). Empty diff clears the hash.

**URL -> State:** On mount, decode `#f=` and apply to context. Fits into the existing priority chain: `#c=` > `#b=` > `#p=` > `#f=`.

After initial load, state is the source of truth. No hashchange listeners. Use a `useRef` flag to prevent the mount-time load effect from re-running (the existing effect has a dependency array issue where object references change every render — the ref guard avoids inheriting that problem).

## Context changes

### resetControls()

New method on `SimulationControlsContext`. Resets all state to defaults atomically:
- tier: 'perfect', buffs: {}, elements: {}, kb: off, targets: 1, cap: true
- CGS: CGS_DEFAULTS.perfect, breakdown: false
- Edit mode: off, editChanges: [], editMeta: { name: '', author: '' }
- Efficiency overrides: {}
- Skill groups: default set

### Lift activeGroups into context

Skill group visibility (currently local to Dashboard) moves into `SimulationControlsContext` so the permalink hook can read/write it. Included in `resetControls()`.

### efficiencyOverrides

Not included in `FilterState` — these are per-class overrides used in the build explorer's marginal gains table, not a dashboard filter. But `resetControls()` does reset them.

## "metra" logo reset

The logo button in App.tsx gets updated:
1. Call `resetControls()` on the context
2. Clear URL hash via `history.replaceState`
3. Navigate to dashboard

## New files

- `web/src/utils/filter-url.ts` — `encodeFilterState`, `decodeFilterState`, `getFilterFromUrl`, `setFilterInUrl`, `clearFilterFromUrl`, `FILTER_DEFAULTS`
- `web/src/hooks/useFilterPermalink.ts` — hook wiring context state to URL

## Modified files

- `web/src/context/SimulationControlsContext.tsx` — add `resetControls()`, `activeGroups`/`setActiveGroups`, use `FILTER_DEFAULTS` for initialization
- `web/src/components/Dashboard.tsx` — use `activeGroups` from context instead of local state
- `web/src/App.tsx` — add `#f=` to mount-time URL loading, update logo onClick to reset, add `useRef` guard on mount effect
- `ROADMAP.md` — move "Filter state permalinks" from Phase 2 to Done

## Future hook point

The `#f=` hash values could be collected server-side to build a "most viewed configurations" leaderboard — which filter combos people actually share and explore. No backend needed now, but the URL structure supports it.
