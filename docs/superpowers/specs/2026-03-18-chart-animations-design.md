# Chart Animations Design Spec

Animate bar, table, and line chart changes when simulation filters toggle, with strong emphasis on the most-affected entries.

## Motivation

When a user flips SE off or changes target count, the dashboard updates instantly — every bar snaps to its new position. This makes it hard to see *what changed* and *by how much*. Smooth transitions + emphasis on high-impact entries gives immediate visual feedback: "turning off SE hurts Night Lord way more than Paladin."

## Core Mechanism: `useAnimatedDps` Hook

A custom hook (`web/src/hooks/useAnimatedDps.ts`) that tracks previous DPS values across renders and computes per-entry animation metadata.

**Inputs:** Current array of `ScenarioResult[]` + `capEnabled` flag.

**Internal state:**
- A `useRef` stores the previous render's DPS map, keyed by `className|skillName|tier`
- A `transitionId` counter increments on each data change to trigger CSS animations

**Output per entry:**
- `previousDps: number` — what the bar was showing before this render
- `changeRatio: number` — `abs(new - old) / meanAbsoluteChange` across all entries (0 = unchanged, >1 = above-average impact)
- `isHighImpact: boolean` — true when `changeRatio > 1.5` (top movers)
- `transitionId: number` — increments on each data change

**First render:** No previous data, so all entries get `previousDps = currentDps`, `changeRatio = 0`, `isHighImpact = false`. No animations play on initial load.

**Edit mode:** The hook is consumed by both `DpsChart` and `RankingTable`, but edit mode changes should NOT trigger animations (edit mode has its own ghost bar visual language). The hook should accept an `enabled` flag and skip tracking when disabled.

Both `DpsChart` and `RankingTable` consume this hook.

## DPS Bar Chart (`DpsChart.tsx`)

Three animation layers:

### Bar Width Transitions

Replace instant-render bars with a custom shape component that wraps each `<rect>` with an inline `style` attribute: `transition: width 400ms ease-out`. Since Recharts re-renders SVG on data change, the transition property causes the bar to smoothly grow or shrink to its new width.

### Rank Reorder (FLIP)

When sort order changes, bars slide vertically to their new positions using the FLIP technique:

1. **First:** Before render, snapshot each bar's Y position (keyed by uid) in a ref
2. **Last:** After render (in `useLayoutEffect`), read new Y positions
3. **Invert:** Apply `transform: translateY(oldY - newY)` immediately — bar appears at old position
4. **Play:** Next frame, remove the transform with `transition: transform 400ms ease-out` — bar slides to new position

Requires a wrapper `<g>` around each bar row in the custom shape, with a ref map to track positions.

### High-Impact Emphasis

For entries where `isHighImpact` is true, apply a temporary animation:
- SVG `<animate>` on `fillOpacity`: pulse from 1.0 → 0.5 → 1.0
- Brief `filter: drop-shadow` glow using the bar's class color
- Duration: ~1s total (400ms pulse in, 600ms fade out)
- Controlled by `transitionId` — animation plays when id is current, static when stale

## Ranking Table (`RankingTable.tsx`)

Three animation layers:

### Row Reorder (FLIP)

Same FLIP technique as the bar chart, but on HTML `<tr>` elements:

1. Each row gets a `data-key` attribute
2. Snapshot `getBoundingClientRect().top` for each row in a ref before render
3. After render in `useLayoutEffect`: compare old vs new positions
4. Apply `transform: translateY(delta)` then transition to `translateY(0)` over 400ms

Rows need `position: relative` and `transition: transform 400ms ease-out`.

### High-Impact Row Emphasis

For rows where `isHighImpact` is true, apply a brief background highlight:
- `background: rgba(classColor, 0.15)` animating to transparent
- CSS keyframe animation, ~1s duration
- More visible than a subtle glow since table rows have more surface area

### DPS Value Counter

The DPS number in each row smoothly counts up/down to its new value using a small `useAnimatedNumber` hook:
- `requestAnimationFrame`-based linear interpolation over 400ms
- Gives a "counter spinning" feel when toggling buffs

## Tier Scaling Line Chart (`TierScalingChart.tsx`)

### Line Path Transitions

Enable Recharts' built-in animation on each `<Line>` component:
- `isAnimationActive={true}` (currently explicitly `false`)
- `animationDuration={400}`
- `animationEasing="ease-out"`

Recharts handles line path morphing natively — lines smoothly move to new positions.

### High-Impact Emphasis

For lines where the entry is high-impact:
- Briefly increase `strokeWidth` to 4 and `strokeOpacity` to 1 for ~1s
- Ease back to normal (strokeWidth 2, strokeOpacity 0.85)
- Controlled by the same `transitionId` mechanism
- Makes affected lines visually "pop" momentarily

No FLIP needed — Recharts handles spatial animation natively.

## Animation Triggers

**Triggers animations:**
- Buff toggles (SE, Echo, SI, MW, Attack Potion)
- Element modifier changes
- KB toggle
- Target count changes
- Tier selection changes
- Cap toggle

**Does NOT animate:**
- Initial page load (no previous data — hook detects first render and skips)
- Edit mode changes (have their own ghost bar visual language)
- Skill group filter changes (adding/removing entire entries, not resizing — FLIP handles appear/disappear but no emphasis pulse)

## Shared Configuration

All timing constants live in `web/src/utils/animation-config.ts`:
- `TRANSITION_DURATION_MS = 400`
- `EMPHASIS_DURATION_MS = 1000`
- `EMPHASIS_FADE_MS = 600`
- `HIGH_IMPACT_THRESHOLD = 1.5` (changeRatio cutoff)
- `EASING = 'ease-out'`

## Accessibility

Respect `prefers-reduced-motion` media query:
- When enabled, all transitions are skipped — instant updates (current behavior)
- The `useAnimatedDps` hook exposes a `prefersReducedMotion` boolean from `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Components check this flag and skip animation styles/classes

## Performance

- `useAnimatedDps` stores a flat `Map<string, number>` in a ref — negligible memory
- FLIP position snapshots are synchronous in `useLayoutEffect` before paint — no jank
- CSS transitions and SVG `<animate>` are GPU-composited
- The number counter uses a single shared `requestAnimationFrame` loop across all animating cells

## New Files

- `web/src/hooks/useAnimatedDps.ts` — core animation state hook
- `web/src/hooks/useAnimatedNumber.ts` — counter animation hook for table DPS values
- `web/src/utils/animation-config.ts` — shared timing/threshold constants

## Modified Files

- `web/src/components/DpsChart.tsx` — custom animated bar shape, FLIP wrapper, emphasis layer
- `web/src/components/dashboard/RankingTable.tsx` — FLIP rows, emphasis class, animated numbers
- `web/src/components/TierScalingChart.tsx` — enable line animation, emphasis on high-impact lines
- `web/src/index.css` — keyframe definitions for emphasis pulse/glow animations
