# Roadmap

## What This Is

A balance simulator for MapleRoyals staff and community. Every number traces back to a formula, every proposal is reproducible. Non-technical users can explore class balance and propose changes without touching a spreadsheet.

## Done

- 12 classes with verified DPS (10 physical + Archmage I/L, Bishop)
- Standard and magic damage formulas (spell/weapon amplification)
- Proposal pipeline (JSON → simulate → compare → report)
- CLI with baseline rankings + proposal comparison
- Web SPA: dashboard, proposal builder, class comparison view, URL sharing, BBCode export
- 4 scenarios (Buffed, Unbuffed, No-Echo, Bossing 50% PDR)
- ~314 tests (268 engine + 46 web), pre-commit hooks
- Balance audit: automated outlier detection across scenarios and tiers

## Phase 2a: Public Launch

Deploy and make it approachable for non-technical users.

- Deploy static site on Vercel
- Mid funding tier (most players live between low and high)
- UX polish: mobile layout, tooltips, class icons, onboarding
- Support class disclaimers on Bishop/mage rankings (solo DPS ≠ party value)

## Phase 2b: Build Explorer

Let users customize gear and stats beyond the fixed templates.

- Gear/stat overrides with sliders/inputs (start from templates, real-time DPS recalc)
- Custom funding tiers beyond low/mid/high
- Shareable builds via URL encoding

## Phase 3: Community Features

> Don't build social infra before there's an audience. Phase 2a first.

- Backend via Supabase (PostgreSQL + Discord OAuth + row-level security)
- Proposal gallery: browse, search, filter
- Proposal templates/presets for recurring themes ("nerf NL", "buff warriors")
- Diff visualization: bar chart overlays, bump charts for rank changes
- Voting, comments, proposal versioning

## Phase 4: Advanced Analysis

- Party DPS modeling (Bishop's value is party buffs, not solo DPS)
- Training efficiency (kills/hr, EXP/hr on reference mobs)
- Accuracy/miss rate against high-level bosses
- Buff uptime/sustain (Berserk HP drain, Battleship HP, buff recasting)
- Marginal gain calculator ("what should I upgrade next?")
- Mob/boss modeling (HP thresholds, PDR, phases)

## Architecture

```
Phase 1–2 (now):
  Static site (Vercel) ← Vite build ← React SPA
  Engine runs client-side (no server needed)

Phase 3 (community):
  Static site (Vercel) ← React SPA
       ↕ Supabase client SDK
  Supabase (hosted):
    - PostgreSQL: proposals, votes, comments, user profiles
    - Auth: Discord OAuth
    - Row-level security
    - Edge Functions if needed
```

Engine stays client-side — simulation is fast enough in the browser. Supabase handles social data only. Hosting costs stay near zero.

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend hosting | Vercel | Free, auto-deploy, good DX |
| Backend | Supabase | Hosted PG + auth, minimal maintenance |
| Auth | Discord OAuth | Community already uses Discord |
| Simulation | Client-side | Fast enough, no server costs |
| Build explorer state | URL-encoded | Shareable, no backend needed |

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
