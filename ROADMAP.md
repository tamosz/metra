# Roadmap

## What This Is

A balance simulator for Royals staff and community. Every number traces back to a formula, every proposal is reproducible. Non-technical users can explore class balance and propose changes without touching a spreadsheet.

## Done

- 14 classes with verified DPS (11 physical + Archmage I/L, Archmage F/P, Bishop). Weapon variants (Hero Axe, Paladin BW) are separate classes with their own skill files and gear templates.
- Standard and magic damage formulas (spell/weapon amplification)
- Proposal pipeline (JSON → simulate → compare → report)
- CLI with baseline rankings + proposal comparison
- Web SPA: dashboard, proposal builder, class comparison view, URL sharing, BBCode export
- Build explorer: gear/stat overrides with sliders/inputs, real-time DPS recalc
- Shareable builds via URL encoding (`#b=` for builds, `#c=` for comparisons)
- UX: mobile layout, tooltips, class icons, onboarding banner, support class disclaimers
- 4 funding tiers (low, mid, high, perfect)
- Composable simulation controls: individual buff toggles (SE, Echo, SI, MW, Attack Potion), element toggles, KB toggle, target count
- Knockback modeling (initial): dodge, Stance, Shadow Shifter interactions. Needs tuning — too aggressive for channeled skills.
- Weapon-variant gear templates: Hero Axe and Paladin BW have dedicated templates with accurate base WATK
- Multi-target simulation: per-skill `maxTargets` + per-scenario `targetCount` for training/AoE comparisons
- Balance audit: automated outlier detection across scenarios and tiers
- Custom funding tiers: delta-based tier editor with localStorage persistence
- Pre-commit hooks, comprehensive test coverage
- Deployed on Vercel: https://metra-ten.vercel.app

## Phase 2: Community Features

- Proposal gallery: browse, search, filter, share
- Diff visualization: bar chart overlays, bump charts for rank changes
- If there's demand: voting, comments, proposal versioning (needs a backend)

## Phase 3: Advanced Analysis

**Quick wins:**
- Archer projectile WATK: Bowmaster and Marksman gear templates have `projectile: 0` — need to add arrow/bolt WATK values at each tier (the engine already supports this via the `projectile` field)
- Marginal gain calculator ("what should I upgrade next?" — DPS per WATK, per stat point)
- Accuracy/miss rate against high-level bosses
- Buff uptime/sustain (Berserk HP drain, Battleship HP, buff recasting)

**Hard problems:**
- Party DPS modeling (Bishop's value is party buffs, not solo DPS — biggest analytical blind spot, but genuinely hard to model well)
- Training efficiency (kills/hr, EXP/hr on reference mobs — AoE modeling done via `maxTargets`, still needs mob data)
- Boss encounter simulation — Patchwerk-style sustained DPS with real-world interruptions:
  - Knockback tuning: current model is too aggressive for channeled skills (Hurricane, Rapid Fire). Needs per-skill or per-category recovery times rather than a flat penalty.
  - Variable mob count phases: boss encounters like Zakum/Horntail have phases with multiple targetable parts. AoE skills get higher effective DPS during multi-body phases but not for the full fight. Configurable as a timeline of phase durations and target counts.

## Architecture

```
Now:
  Static site (Vercel) ← Vite build ← React SPA
  Engine runs client-side (no server needed)

Phase 2 (if community features need persistence):
  Static site (Vercel) ← React SPA
       ↕ lightweight backend (TBD)
  Social data: proposals, votes, comments
```

Engine stays client-side — simulation is fast enough in the browser. Backend (if needed) handles social data only. Hosting costs stay near zero.

## Principles

- **Show the work**: every DPS number should be explainable. Show the formula, cite the source.
- **Templates as defaults**: presets with overrides, not blank forms.
- **Offline-capable core**: engine and basic UI work without a backend. Community features are additive.
- **Forum-native output**: BBCode and Markdown — results flow into royals.ms discussions.
- **Small increments**: each phase delivers standalone value.

## Non-Goals

- Not a game wiki — only balance-relevant DPS stuff.
- Not a gear optimizer — the marginal gain calculator (Phase 4) answers "what helps most?" without solving the full optimization problem.
- Not real-time multiplayer — proposals are async, no WebSockets.
- Not a mobile app — responsive web is enough.
