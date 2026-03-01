# Roadmap

## What This Is

A balance simulator for Royals staff and community. Every number traces back to a formula, every proposal is reproducible. Non-technical users can explore class balance and propose changes without touching a spreadsheet.

## Done

- 12 classes with verified DPS (10 physical + Archmage I/L, Bishop)
- Standard and magic damage formulas (spell/weapon amplification)
- Proposal pipeline (JSON → simulate → compare → report)
- CLI with baseline rankings + proposal comparison
- Web SPA: dashboard, proposal builder, class comparison view, URL sharing, BBCode export
- 3 funding tiers (low, mid, high)
- 4 scenarios (Buffed, Unbuffed, No-Echo, Bossing 50% PDR)
- Balance audit: automated outlier detection across scenarios and tiers
- Pre-commit hooks, comprehensive test coverage
- Deployed on Vercel: https://metra-ten.vercel.app

## Phase 2: Public Launch + Build Explorer

Deploy and make it useful for real players.

- Gear/stat overrides with sliders/inputs (start from templates, real-time DPS recalc)
- Shareable builds via URL encoding
- UX polish: mobile layout, tooltips, class icons, onboarding
- Support class disclaimers on Bishop/mage rankings (solo DPS ≠ party value)
- Custom funding tiers beyond low/mid/high

## Phase 3: Community Features

> Don't build social infra before there's an audience. Phase 2 first.

- Proposal gallery: browse, search, filter, share
- Diff visualization: bar chart overlays, bump charts for rank changes
- If there's demand: voting, comments, proposal versioning (needs a backend)

## Phase 4: Advanced Analysis

**Quick wins:**
- Marginal gain calculator ("what should I upgrade next?" — DPS per WATK, per stat point)
- Accuracy/miss rate against high-level bosses
- Buff uptime/sustain (Berserk HP drain, Battleship HP, buff recasting)

**Hard problems:**
- Party DPS modeling (Bishop's value is party buffs, not solo DPS — biggest analytical blind spot, but genuinely hard to model well)
- Training efficiency (kills/hr, EXP/hr on reference mobs — needs mob data and AoE modeling)
- Boss modeling (HP thresholds, PDR, phases)

## Architecture

```
Phase 1–2 (now):
  Static site (Vercel) ← Vite build ← React SPA
  Engine runs client-side (no server needed)

Phase 3 (if community features need persistence):
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
