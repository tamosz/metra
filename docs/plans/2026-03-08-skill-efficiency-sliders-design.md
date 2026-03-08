# Skill Efficiency Sliders

Player-configurable efficiency sliders for skills where uptime assumptions affect DPS rankings.

## Problem

Corsair's "Practical Bossing" hardcodes an 80/20 Cannon/RF split, and DrK's Crusher bakes in 100% Berserk uptime. In practice these vary by player, boss, and situation. The current model presents one fixed assumption as the ranking truth.

## Design

### Data model

**DrK changes** (`data/skills/drk.json`):
- Split Crusher into two skill entries:
  - `Spear Crusher (Zerked)` — basePower 170, multiplier 2.1, `headline: false`
  - `Spear Crusher` — basePower 170, multiplier 1.0, `headline: false`
- Add a `mixedRotation`:
  ```json
  {
    "name": "Berserk Crusher",
    "description": "Weighted average of zerked and unzerked Crusher. Adjust Berserk uptime in the Skill Efficiency panel.",
    "components": [
      { "skill": "Spear Crusher (Zerked)", "weight": 0.9 },
      { "skill": "Spear Crusher", "weight": 0.1 }
    ]
  }
  ```

**Corsair stays the same** — already has the `mixedRotation` structure with 80/20 Cannon/RF. Just needs to be overridable.

**New type: `EfficiencyConfig`** on `ScenarioConfig`:
```typescript
// Key: "className.rotationName" (e.g., "DrK.Berserk Crusher")
// Value: weight array matching rotation.components order
efficiencyOverrides?: Record<string, number[]>;
```

### Engine changes

**`processMixedRotations`** in `simulate.ts`:
- Accept optional `efficiencyOverrides` from `ScenarioConfig`
- Before computing weighted DPS, check if an override exists for `className.rotation.name`
- If yes, use override weights instead of the defaults from JSON
- Validate override array length matches components length; ignore malformed overrides

### Web UI

**New collapsible section** in the Dashboard filter bar, after the existing toggles:
- Label: "Skill Efficiency" with expand/collapse chevron
- Collapsed by default
- Contains one slider per configurable mixed rotation:

| Slider label | Range | Default | Display |
|---|---|---|---|
| DrK: Berserk uptime | 0–100% | 90% | "90% zerked" |
| Corsair: Cannon / RF | 0–100% Cannon | 80% | "80% Cannon / 20% RF" |

Each slider:
- Updates `efficiencyOverrides` in `SimulationControlsContext`
- Triggers re-simulation via `useSimulation` dependency
- Shows current percentage value next to the slider

**SimulationControlsContext** additions:
```typescript
efficiencyOverrides: Record<string, number[]>;
setEfficiencyOverrides: (overrides: Record<string, number[]>) => void;
```

**useSimulation** hook:
- Reads `efficiencyOverrides` from context
- Passes into `ScenarioConfig` when building scenarios
- Added to memo dependencies

**URL sharing:**
- Efficiency overrides encode into the existing URL hash scheme (new `#e=` prefix or folded into scenario state)
- Round-trips through lz-string compression like other params

### What this does NOT include

- CLI support (web-only for now)
- Generic "any skill can have efficiency" — only mixed rotations are configurable
- New mixed rotations for other classes (can be added later by editing skill JSON)

### Discoverability

The slider section auto-populates from whatever `mixedRotations` exist across all class data. Adding a mixed rotation to any class automatically creates a slider — no UI code changes needed.

### Tests

- Engine: verify `efficiencyOverrides` correctly override default weights in `processMixedRotations`
- Engine: verify malformed overrides (wrong length, out of range) are ignored gracefully
- Engine: DrK zerked vs unzerked DPS values are correct independently
- Web: slider state flows through context to simulation results
- Web: URL round-trip preserves efficiency overrides
