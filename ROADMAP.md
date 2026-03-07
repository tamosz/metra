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
- Skill detail drilldown: click a ranking row to see DPS breakdown by tier, crit contribution, damage range, attack time, cap loss, Shadow Partner status
- Comparison chart overlay: before/after bars in proposal comparison view
- Error boundaries: catch engine errors gracefully with recovery button
- UX: mobile layout, tooltips, class icons, onboarding banner, support class disclaimers
- 4 funding tiers (low, mid, high, perfect)
- Composable simulation controls: individual buff toggles (SE, Echo, SI, MW, Attack Potion), element toggles, KB toggle, target count
- Knockback modeling: dodge, Stance, Shadow Shifter interactions. Per-skill `knockbackRecovery` override for i-frame skills (Demolition, Barrage).
- Weapon-variant gear templates: Hero Axe and Paladin BW have dedicated templates with accurate base WATK
- Archer projectile WATK: Bowmaster and Marksman templates include arrow/bolt WATK at each tier (+10 low/mid/high, +12 perfect)
- Multi-target simulation: per-skill `maxTargets` + per-scenario `targetCount` for training/AoE comparisons
- Balance audit: automated outlier detection across scenarios and tiers
- Custom funding tiers: delta-based tier editor with localStorage persistence
- Marginal gain calculator: DPS per WATK, per stat point — "what should I upgrade next?"
- Formula reference page: full documentation of all engine formulas with LaTeX rendering
- Damage cap toggle: uncapped DPS mode for theoretical comparisons
- Element variant competition: Paladin charges auto-pick best element for current scenario
- Mixed rotations: time-weighted skill blends (Corsair practical bossing 80/20 Cannon/RF)
- Training skills: Arrow Bomb (Bowmaster), Snatch + Dragon Strike (Buccaneer)
- Per-slot template editor with GitHub issue integration for proposing template changes
- Gear template audit: cross-class alignment verified against source spreadsheet, stats aligned across all 14 classes
- Gear template inheritance: base templates with tier deltas, reducing duplication
- Pre-commit hooks, comprehensive test coverage
- Deployed on Vercel: https://tomeblog.com/metra

## Phase 2: Interactive UX

Make the dashboard the primary exploration tool. Reduce the distance between "I wonder what if..." and seeing the answer.

**Inline "what if" editing**
- Click a skill's damage%, hit count, or multiplier in the dashboard detail view and change it directly
- Instant before/after without leaving the dashboard
- Proposal builder stays for formal proposals; this is for casual exploration
- (Currently only available in the Build Explorer, not on the dashboard)

**Filter state permalinks**
- Encode dashboard filter state (tier, buffs, elements, KB, targets) in the URL
- Shareable links like "here's what Corsair looks like with KB on and no SI"

**Saved filter presets**
- Name and save toggle combinations: "Bossing", "Training 6 mobs", "Unbuffed solo"
- One click to switch context

**Mobile filter UX**
- Collapsible "Simulation Settings" panel, closed by default
- Summary chip showing active state: "High tier · SE off · Holy weak"
- Desktop keeps the current inline layout

**Chart animations**
- Animate bar changes when filters toggle — a bar growing/shrinking when you flip SE off gives instant feedback about what matters

**CSV export**
- Export simulation results for people who want to do their own analysis in sheets

## Phase 3: Community Features

- Proposal gallery: browse, search, filter, share
- If there's demand: voting, comments, proposal versioning (needs a backend)

## Phase 4: Advanced Analysis

**Quick wins:**
- Accuracy/miss rate against high-level bosses
- Buff uptime/sustain (Berserk HP drain, Battleship HP, buff recasting)

**Hard problems:**
- Party DPS modeling (Bishop's value is party buffs, not solo DPS — biggest analytical blind spot, but genuinely hard to model well)
- Training efficiency (kills/hr, EXP/hr on reference mobs — AoE modeling done via `maxTargets`, still needs mob data)
- Boss encounter simulation — Patchwerk-style sustained DPS with real-world interruptions:
  - Knockback tuning: per-skill `knockbackRecovery` is implemented, but channeled skills (Hurricane, Rapid Fire) may still need more nuance.
  - Variable mob count phases: boss encounters like Zakum/Horntail have phases with multiple targetable parts. AoE skills get higher effective DPS during multi-body phases but not for the full fight. Configurable as a timeline of phase durations and target counts.

## Architecture

```
Now:
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
- Not a gear optimizer — the marginal gain calculator answers "what helps most?" without solving the full optimization problem.
- Not real-time multiplayer — proposals are async, no WebSockets.
- Not a mobile app — responsive web is enough.
