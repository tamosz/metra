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
- Chain lightning bounce decay (70% per chain)
- Skill efficiency sliders for mixed rotations (Corsair Cannon/RF, DRK zerked/unzerked)
- Tier scaling line chart alongside bar chart
- Edit mode: inline skill editing on the dashboard with ghost bars, rank deltas, changes popover, combo sub-skill editing, URL sharing, export
- Per-slot template editor with GitHub issue integration for proposing template changes
- Gear template audit: cross-class alignment verified against source spreadsheet, stats aligned across all 14 classes
- Gear template inheritance: base templates with tier deltas, reducing duplication
- Pre-commit hooks, comprehensive test coverage
- Deployed at: https://tomeblog.com/metra

## Phase 2: Interactive UX

Make the dashboard the primary exploration tool. Reduce the distance between "I wonder what if..." and seeing the answer.

**~~Inline "what if" editing~~** → shipped as Edit Mode (see Done)

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

**More training/AoE skills:**
- Piercing Arrow (Bowmaster), Boomerang Step + Band of Thieves (Shadower), Barrage + Dragon Strike (Buccaneer), Torpedo (Corsair, no transformation), Flamethrower + Ice Splitter (mages, with EB30 + capsules)

**Hard problems:**
- Party DPS modeling — biggest analytical blind spot. Solo DPS doesn't capture buff contribution (SE, SI). A party builder would let you pick classes + tiers for a 6-man party and show per-member DPS with/without shared buffs, total party DPS gain from SE/SI, and the real cost of swapping an archer for another attacker. Would help archers make the case for balance adjustments.
- Training efficiency (kills/hr, EXP/hr on reference mobs — AoE modeling done via `maxTargets`, still needs mob data)
- Boss encounter simulation — Patchwerk-style sustained DPS with real-world interruptions:
  - Knockback tuning: per-skill `knockbackRecovery` is implemented, but channeled skills (Hurricane, Rapid Fire) may still need more nuance.
  - Variable mob count phases: boss encounters like Zakum/Horntail have phases with multiple targetable parts. AoE skills get higher effective DPS during multi-body phases but not for the full fight. Configurable as a timeline of phase durations and target counts.

## Architecture

```
Now:
  Static site ← Vite build ← React SPA
  Engine runs client-side (no server needed)

Phase 3 (if community features need persistence):
  Static site ← React SPA
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

## Stretch Goal: Meta Snapshot & Tier List Generator

Auto-generate visual tier lists from simulation data — the kind of content that drives forum debates and makes balance conversations concrete.

**Tier list generation**
- Compute a composite "balance score" per class by weighting DPS across scenarios: bossing (single target, KB on), training (6 targets), and buffed/unbuffed conditions. Weights are user-adjustable.
- Bucket classes into S/A/B/C/D tiers using standard deviation bands from the weighted mean.
- Render as a visual tier list with class icons arranged in rows by tier, styled like the tier list images people already share on the forums.
- Each class card shows its composite score, best scenario, worst scenario, and a spark line of its DPS across tiers (low → perfect) so you can see at a glance whether a class is "funding-dependent" or "always mid."

**Radar charts**
- Per-class radar chart with axes like: single-target DPS, multi-target DPS, cap efficiency, tier scaling, KB resilience, buff independence.
- Overlay two classes for head-to-head comparison ("Class Showdown" mode) — pick two classes and get a split-screen with overlapping radar charts and a scenario-by-scenario win/loss record, presented like a fighting game matchup screen.

**Snapshot history**
- Save a tier list as a named snapshot (stored in localStorage).
- Compare two snapshots side-by-side to see how a proposal or data correction shifted the meta. Arrows show classes that moved up or down between snapshots.
- Export a snapshot diff as BBCode for forum posts: "Here's how Proposal X reshuffles the tier list."

**Image export**
- Render the tier list as a downloadable PNG (via html2canvas or similar) so people can drop it straight into a forum post or Discord message without needing a link to the app.

**Why this is fun:** Tier lists are inherently engaging — people love arguing about them. Generating them from actual simulation data (instead of vibes) is exactly the kind of "make balance legible" move this project is about. And the snapshot diff feature turns every proposal into a visual story: "this change moves Corsair from B to A and drops Hero from S to A."

## Non-Goals

- Not a game wiki — only balance-relevant DPS stuff.
- Not a gear optimizer — the marginal gain calculator answers "what helps most?" without solving the full optimization problem.
- Not real-time multiplayer — proposals are async, no WebSockets.
- Not a mobile app — responsive web is enough.
