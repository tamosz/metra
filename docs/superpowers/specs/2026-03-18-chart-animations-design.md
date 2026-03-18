# Chart Animations Design Spec

Animate bar, table, and line chart changes when simulation filters toggle, with strong emphasis on the most-affected entries.

## Motivation

When a user flips SE off or changes target count, the dashboard updates instantly — every bar snaps to its new position. This makes it hard to see *what changed* and *by how much*. Smooth transitions + emphasis on high-impact entries gives immediate visual feedback: "turning off SE hurts Night Lord way more than Paladin."

## Core Mechanism: `useAnimatedDps` Hook

A custom hook (`web/src/hooks/useAnimatedDps.ts`) that tracks previous DPS values across renders and computes per-entry animation metadata.

**Inputs:** Current array of `ScenarioResult[]` + `capEnabled` flag + `enabled` flag.

**Internal state:**
- A `useRef` stores the previous render's DPS map, keyed by `className|skillName|tier`
- A `transitionId` counter (ref) increments on each data change to drive emphasis resets

**Output per entry:**
- `previousDps: number` — what the bar was showing before this render
- `changeRatio: number` — `abs(new - old) / meanAbsoluteChange` across all entries (0 = unchanged, >1 = above-average impact)
- `isHighImpact: boolean` — true when `changeRatio > 1.5` (top movers)
- `transitionId: number` — increments on each data change

**Also exposes:**
- `prefersReducedMotion: boolean` — from `window.matchMedia('(prefers-reduced-motion: reduce)')`

**First render:** No previous data, so all entries get `previousDps = currentDps`, `changeRatio = 0`, `isHighImpact = false`. No animations play on initial load.

**Uniform shifts suppressed:** When the standard deviation of per-entry change percentages is below a threshold (e.g., <5%), all entries shifted by roughly the same amount (typical of tier changes). In this case, suppress emphasis — set all `isHighImpact = false`. Transitions still play but no entries get the highlight pulse. This prevents tier changes from pointlessly highlighting everything.

**Disabled when:**
- `enabled` is false (edit mode active — edit mode has its own ghost bar visual language)
- `editComparison` is non-null (filter changes during active edits should not trigger animation to avoid conflict with ghost bars)

**Called once in Dashboard**, results passed down to `DpsChart`, `RankingTable`, and `TierScalingChart` as props. This ensures a single `transitionId`, a single previous-value snapshot, and consistent `isHighImpact` flags across all views.

**Division by zero:** When `meanAbsoluteChange` is 0 (no entries changed), all `changeRatio` values are 0 and no emphasis fires.

**Testing:** Co-located `useAnimatedDps.test.ts` covering: first-render suppression, high-impact detection, uniform-shift suppression, disabled flag behavior, zero-change edge case. Tests will need to mock `window.matchMedia` for the reduced-motion path.

## DPS Bar Chart (`DpsChart.tsx`)

Two animation layers. Recharts recreates SVG `<rect>` elements on data changes (no stable DOM identity), so FLIP-based reorder and CSS `transition: width` are not feasible within Recharts. Instead:

### Bar Width Animation via rAF Interpolation

Recharts may unmount/remount shape components on data changes, so the shape component itself must be stateless (no `useState`/`useEffect`). Instead, the rAF interpolation state lives in the parent `DpsChart` component:

- `DpsChart` maintains a `useRef<Map<string, number>>` of interpolated DPS values, keyed by entry uid
- A `useEffect` in `DpsChart` starts rAF loops when data changes: for each entry, interpolate from `previousDps` to current `dps` over 400ms, updating the ref map and forcing re-render via a counter state
- The custom bar shape (`AnimatedBarShape`) is stateless — it reads `interpolatedDps` from its chart data props and renders a `<rect>` at the interpolated width
- When `prefersReducedMotion` is true, skip interpolation and render at final width immediately

When edit mode is active, fall back to the existing `GhostBarShape` — these two modes are mutually exclusive.

### Stacked Bar Mode (Buff Breakdown)

When `breakdownEnabled` is true (4 stacked `<Bar>` segments), skip width animation — stacked segments are independent Recharts `<Bar>` components with no single element controlling total width. Stacked bars update instantly and rely on emphasis pulses + ranking table animations for visual feedback. This avoids complexity for a mode that's less commonly used.

### Bar Chart Reorder

Bar chart does NOT animate vertical reorder. Recharts does not provide stable DOM identity across data array reorders, making FLIP infeasible without replacing Recharts entirely. The ranking table handles reorder animation (see below), and the bar chart provides the visual "which bars grew/shrank" feedback. These are complementary.

### High-Impact Emphasis

For entries where `isHighImpact` is true:
- The animated bar shape includes SVG `<animate>` elements:
  - `<animate attributeName="fill-opacity" values="0.8;1;0.5;0.8" keyTimes="0;0.3;0.7;1" dur="1s" fill="remove" />`
  - A drop-shadow filter with animated opacity for the glow effect
- Emphasis is keyed to `transitionId` — the shape component checks if its `transitionId` prop matches the current one to decide whether to include the `<animate>` elements. On subsequent renders with the same id, animation has already completed and the static state shows.

## Ranking Table (`RankingTable.tsx`)

Three animation layers. Unlike Recharts SVG, React preserves `<tr>` DOM elements when their `key` is stable — the existing code uses `rowKey = ${className}-${skillName}-${tier}`, so FLIP works here.

### Row Reorder (FLIP)

The existing code wraps each row in `<Fragment key={rowKey}>` containing the main `<tr>` and optional expanded `<tr>`. FLIP targets the main `<tr>` elements via ref callbacks (not the Fragment key), since we need direct DOM references for position measurement.

1. Each main `<tr>` registers itself in a ref map via a callback ref: `ref={(el) => rowRefs.current.set(rowKey, el)}`
2. Before render: snapshot each row's `getBoundingClientRect().top` from the ref map, keyed by `rowKey`
3. After render in `useLayoutEffect`: read new Y positions from the same ref map
4. For rows that moved: apply `transform: translateY(oldY - newY)` immediately (row appears at old position)
5. Next frame (`requestAnimationFrame`): remove the transform with `transition: transform 400ms ease-out` (row slides to new position)

Rows need `position: relative` in their styles. The position snapshot is cleared after each animation cycle.

**Expanded rows:** If a row is expanded (detail panel visible), skip its FLIP animation — the variable height makes position tracking unreliable. Collapse expanded rows on filter change, or simply let them jump to their new position.

### High-Impact Row Emphasis

For rows where `isHighImpact` is true:
- Apply a CSS class that triggers a `@keyframes` animation: `background-color` from `rgba(classColor, 0.15)` to `transparent` over ~1s
- The class is applied via a `data-emphasis` attribute toggled by `transitionId`
- CSS keyframe defined in `index.css`

### DPS Value Counter

The DPS number in each row smoothly counts up/down using `useAnimatedNumber`:
- Takes `targetValue` and `duration` as inputs
- Uses `requestAnimationFrame` with linear interpolation
- Each instance manages its own rAF lifecycle with `useEffect` cleanup (cancels on unmount or when target changes mid-animation)
- Returns the current interpolated value as a number
- When `prefersReducedMotion` is true, returns `targetValue` immediately

No shared rAF loop — each cell runs independently. 30-50 independent rAF callbacks is negligible overhead and simpler to implement correctly than a shared scheduler.

**Testing:** Co-located `useAnimatedNumber.test.ts` covering: interpolation, cleanup on unmount, reduced motion bypass. Tests need to mock `requestAnimationFrame` (e.g., `vi.useFakeTimers()`) since jsdom does not polyfill it by default.

## Tier Scaling Line Chart (`TierScalingChart.tsx`)

### Line Path Transitions

Do NOT use Recharts' `isAnimationActive` — it re-triggers on any prop change including hover state (`strokeWidth`, `strokeOpacity`), causing lines to re-animate their paths on every hover enter/leave.

Use Recharts' `isAnimationActive` but gate it behind a `dataVersion` ref that only increments on actual data changes (not hover state). This prevents re-triggering animation on hover enter/leave:
- Maintain a `dataVersionRef` counter in the component that increments when `chartData` changes (via `useEffect` on `chartData`)
- Pass `isAnimationActive={true}`, `animationDuration={400}`, `animationEasing="ease-out"`, and `animationId={dataVersion}` to each `<Line>`
- Recharts only re-triggers animation when `animationId` changes, so hover-driven re-renders (which don't change `dataVersion`) won't cause path re-animation

Note: the exact Recharts CSS class names for line `<path>` elements should be verified via DOM inspection during implementation, in case a CSS-`d`-transition approach is needed as a fallback. CSS `d` property transition is supported in Chrome 89+, Firefox 97+, Safari 16.4+.

### High-Impact Emphasis

For high-impact lines, use CSS transitions (not Recharts animation) on the stroke properties:
- Apply `transition: stroke-width 200ms, stroke-opacity 200ms` to all line paths
- When `isHighImpact` is true for a line, temporarily set `strokeWidth={4}` and `strokeOpacity={1}` via the existing props
- After 1s (via `setTimeout` in an effect), reset to normal values
- This coexists with hover dimming because both use the same CSS transition — hover changes will smoothly transition too, which is a nice side effect

## Animation Triggers

**Triggers animations:**
- Buff toggles (SE, Echo, SI, MW, Attack Potion)
- Element modifier changes
- KB toggle
- Target count changes
- Cap toggle

**Does NOT animate:**
- Initial page load (no previous data — hook detects first render and skips)
- Edit mode changes (ghost bar visual language takes over)
- Filter changes while edit mode is active (editComparison non-null suppresses animation entirely)
- Skill group filter changes (entries appear/disappear instantly, no animation — these are add/remove operations, not transitions)
- Tier selection changes where all entries shift uniformly (emphasis suppressed via stddev check, though width/position transitions still play)

**Rapid successive toggles:** CSS transitions naturally interrupt and pick up from the current interpolated value. The emphasis pulse is debounced — only the final `transitionId` after a 100ms settle triggers emphasis classes, preventing flicker from rapid toggles.

## Shared Configuration

All timing constants live in `web/src/utils/animation-config.ts`:
- `TRANSITION_DURATION_MS = 400`
- `EMPHASIS_DURATION_MS = 1000`
- `HIGH_IMPACT_THRESHOLD = 1.5` (changeRatio cutoff)
- `UNIFORM_SHIFT_STDDEV_THRESHOLD = 0.05` (suppress emphasis when all entries shift similarly)
- `EMPHASIS_DEBOUNCE_MS = 100`
- `EASING = 'ease-out'`

## Accessibility

Respect `prefers-reduced-motion` media query:
- When enabled, all transitions are skipped — instant updates (current behavior)
- The `useAnimatedDps` hook exposes `prefersReducedMotion` from `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Components check this flag and skip animation styles/classes
- `useAnimatedNumber` returns target value immediately

## Performance

- `useAnimatedDps` stores a flat `Map<string, number>` in a ref — negligible memory
- FLIP position snapshots (ranking table only) are synchronous in `useLayoutEffect` before paint — no jank
- `transform` transitions are GPU-composited; `width` and `background-color` transitions trigger paint but are fine for 30-50 elements
- Each `useAnimatedNumber` instance manages its own rAF — simpler than a shared loop, negligible overhead at this scale
- SVG `<animate>` elements for bar emphasis are declarative and handled by the browser's SVG engine

## New Files

- `web/src/hooks/useAnimatedDps.ts` — core animation state hook
- `web/src/hooks/useAnimatedDps.test.ts` — unit tests
- `web/src/hooks/useAnimatedNumber.ts` — counter animation hook for table DPS values
- `web/src/hooks/useAnimatedNumber.test.ts` — unit tests
- `web/src/utils/animation-config.ts` — shared timing/threshold constants

## Modified Files

- `web/src/components/dashboard/Dashboard.tsx` — call `useAnimatedDps` once, pass animation metadata to child components
- `web/src/components/DpsChart.tsx` — stateless `AnimatedBarShape` with parent-driven rAF width interpolation + emphasis
- `web/src/components/dashboard/RankingTable.tsx` — FLIP rows via ref callbacks, emphasis class, animated DPS numbers
- `web/src/components/TierScalingChart.tsx` — `dataVersion`-gated line animation, emphasis on high-impact lines
- `web/src/index.css` — `@keyframes` for row emphasis pulse, `prefers-reduced-motion` overrides
