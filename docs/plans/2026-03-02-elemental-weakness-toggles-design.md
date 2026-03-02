# Elemental Weakness Toggles

Replace the hardcoded "Bossing (Undead, 50% PDR)" scenario with composable element toggles in the Dashboard filter bar.

## Elements

Holy, Fire, Ice, Lightning, Poison — the full set of MapleStory elements.

Each element has three states: neutral (default), weak (1.5x damage), strong (0.5x damage). Multipliers match Royals community convention (forum damage calculator thread, elemental composition experiments on royals.ms).

## UI

Element toggles sit in the Dashboard filter bar after the Targets spinner. Each is a compact button that cycles neutral → weak → strong → neutral on click.

- **Neutral**: dim/inactive, no indicator
- **Weak (1.5x)**: green-ish highlight
- **Strong (0.5x)**: red-ish highlight

Group label "Elements" matches existing label style (Scenario / Tier / Targets).

```
Scenario          Tier        Targets   Elements
[Buffed       v]  [All Tiers] [- 1 +]   [Ho] [Fi] [Ic] [Li] [Po]
```

## Engine changes

None. The engine already supports `elementModifiers: Record<string, number>` on `ScenarioConfig`.

## Data changes

- Remove "Bossing (Undead, 50% PDR)" from `DEFAULT_SCENARIOS` — now composable via "Bossing (50% PDR)" + Holy weak toggle
- Add missing `element` tags to Archmage F/P skills: Paralyze → "Fire", Meteor → "Fire"

## Hook changes

`useSimulation` accepts an `elementModifiers` parameter. When any element is toggled, the modifiers are merged into every scenario's config before simulation runs. The overlay applies to all scenarios in the dropdown.

## State management

Element toggle state lives in `Dashboard` as `Record<string, number>` (element name → multiplier, where 1.0 or absent = neutral). Passed down to `useSimulation`.
