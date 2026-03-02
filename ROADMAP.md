# Roadmap

## What This Is

A balance simulator for Royals staff and community. Every number traces back to a formula, every proposal is reproducible. Non-technical users can explore class balance and propose changes without touching a spreadsheet.

## Done

- 13 classes with verified DPS (10 physical + Archmage I/L, Archmage F/P, Bishop)
- Standard and magic damage formulas (spell/weapon amplification)
- Proposal pipeline (JSON → simulate → compare → report)
- CLI with baseline rankings + proposal comparison
- Web SPA: dashboard, proposal builder, class comparison view, URL sharing, BBCode export
- Build explorer: gear/stat overrides with sliders/inputs, real-time DPS recalc
- Shareable builds via URL encoding (`#b=` for builds, `#c=` for comparisons)
- UX: mobile layout, tooltips, class icons, onboarding banner, support class disclaimers
- 3 funding tiers (low, mid, high)
- 4 scenarios (Buffed, Unbuffed, No-Echo, Bossing 50% PDR) + composable element toggles
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
- Weapon-specific gear templates: BW/Axe variants with accurate base WATK (BW weapons have higher base WATK than swords at the same tier, partially offsetting the lower effective multiplier from swing/stab ratio — currently both use the same template, which understates BW Paladin DPS)
- Marginal gain calculator ("what should I upgrade next?" — DPS per WATK, per stat point)
- Accuracy/miss rate against high-level bosses
- Buff uptime/sustain (Berserk HP drain, Battleship HP, buff recasting)

**Hard problems:**
- Party DPS modeling (Bishop's value is party buffs, not solo DPS — biggest analytical blind spot, but genuinely hard to model well)
- Training efficiency (kills/hr, EXP/hr on reference mobs — AoE modeling done via `maxTargets`, still needs mob data)
- Boss encounter simulation — Patchwerk-style sustained DPS with real-world interruptions:
  - Knockback modeling: characters get hit periodically and lose attack uptime to knockback. Factors in dodge rate (class-dependent) and Stance (warriors). A class with 90% Stance loses far less uptime than a thief with no knockback protection.
  - Variable mob count phases: boss encounters like Zakum/Horntail have phases with multiple targetable parts. AoE skills get higher effective DPS during multi-body phases but not for the full fight. Configurable as a timeline of phase durations and target counts.
  - These are separate toggleable config options — knockback settings independent of phase configuration.

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
