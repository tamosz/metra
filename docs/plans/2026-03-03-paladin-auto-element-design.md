# Paladin Auto-Element Selection

## Problem

Paladin has 2 Blast skills per weapon type: Holy Blast (multiplier 1.4, fixed element "Holy") and Charge Blast (multiplier 1.3, elementOptions ["Fire", "Ice", "Lightning"]). They show as separate rows in the dashboard. The user wants a single Blast row that auto-selects the highest-DPS element variant based on active element toggles.

## Design

### Data Model

Add `elementVariantGroup: string` to `SkillEntry`. Skills sharing a group compete — only the highest-DPS variant survives in simulation output.

Add `nameTemplate: string` to `SkillEntry` for elementOptions skills. Template uses `{element}` placeholder resolved at simulation time (e.g., `"Blast ({element} Charge, Sword)"` → `"Blast (Fire Charge, Sword)"`).

### Data Changes

```json
// paladin.json
{ "name": "Blast (Holy, Sword)", "elementVariantGroup": "Blast (Sword)", ... }
{ "name": "Blast (F/I/L Charge, Sword)", "nameTemplate": "Blast ({element} Charge, Sword)", "elementVariantGroup": "Blast (Sword)", ... }

// paladin-bw.json
{ "name": "Blast (Holy, BW)", "elementVariantGroup": "Blast (BW)", ... }
{ "name": "Blast (F/I/L Charge, BW)", "nameTemplate": "Blast ({element} Charge, BW)", "elementVariantGroup": "Blast (BW)", ... }
```

### Simulation Layer (simulate.ts)

1. During per-skill DPS calculation, when an `elementOptions` skill is processed, track which element was selected (the one with the highest modifier).
2. If the skill has a `nameTemplate`, resolve `{element}` with the selected element name to produce a `resolvedSkillName`.
3. After computing DPS for all skills (before combo aggregation), group by `elementVariantGroup`.
4. Within each group, keep only the highest-DPS variant.
5. The merged result is always headline (never hidden).
6. Non-grouped skills pass through unchanged.

### What Doesn't Change

- ElementToggles component
- calculateSkillDps engine function
- Dashboard display logic
- CLI code
