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
- Paladin BW: Crushed Skull (perfect tier) uses 1H BW multiplier via per-tier `weaponType` override
- Pre-commit hooks, comprehensive test coverage
- Filter state permalinks: encode dashboard filter state in URL (`#f=`), shareable configuration links, logo reset to defaults
- Saved filter presets: name and save toggle combinations, one-click context switching
- Chart animations: animated bar changes on filter toggle for instant visual feedback
- Bullseye toggleable buff: moved from baked-in skill multiplier to post-calculation toggle
- Hero weapon split: separate Claymore and Stonetooth classes with own skill files and templates
- Combo sub-skill DPS breakdowns: expandable breakdown for composite skills (Bucc, Shadower, etc.)
- Party DPS modeling: party builder with shared buff contributions (SE, SI), total party DPS, class swap analysis
- Variant class cleanup: weapon variants hidden from party roster, only shown in rankings
- Deployed at: https://tomeblog.com/metra

## Phase 2: Interactive UX

Make the dashboard the primary exploration tool. Reduce the distance between "I wonder what if..." and seeing the answer.

**~~Inline "what if" editing~~** → shipped as Edit Mode (see Done)

**~~Saved filter presets~~** → shipped (see Done)

**~~Chart animations~~** → shipped (see Done)

**Mobile filter UX**
- Collapsible "Simulation Settings" panel, closed by default
- Summary chip showing active state: "High tier · SE off · Holy weak"
- Desktop keeps the current inline layout

**CSV export**
- Export simulation results for people who want to do their own analysis in sheets

## Phase 3: Community Features

- Proposal gallery: browse, search, filter, share
- If there's demand: voting, comments, proposal versioning (needs a backend)

## Community Feedback (from [launch thread](https://royals.ms/forum/threads/royals-balance-simulator.255386/))

Items sourced from forum feedback that aren't covered elsewhere in this roadmap.

**~~Bullseye as a toggleable buff (Corsair)~~** → shipped (see Done)

**Funding-based tier labels**
Multiple users (PinaColadaPirate, Kamuna, ssmage) want tiers expressed as approximate meso costs (e.g., 10b/30b/60b/100b) rather than abstract names (low/mid/high/perfect). The concern is that "perfect" means 35b for some classes and 140b for others, making cross-class comparisons misleading. Scope: add a `fundingEstimate` field to gear templates (or to `tier-defaults.json`) with a per-class meso value. Display this in the web UI alongside or instead of the tier name (e.g., "Perfect (~80b)" in dropdowns and chart labels). This is a data + UI task, no engine changes.

**Paladin weapon formula corrections**
~~Crushed Skull should use the 1H BW formula~~ → fixed in #128 via per-tier `weaponType` override on gear templates. Purple Surfboard is categorized as 2H BW but should use the spear damage formula — still needs investigation and a fix. May require adding a weapon-specific override if Purple Surfboard is the only weapon with this mismatch.

**Per-weapon-type display in rankings**
Hero is now split into Claymore and Stonetooth variants. Other weapon splits (e.g., Paladin BW with Purple Surfboard vs Crushed Skull) still show as one class. PinaColadaPirate wants every weapon type in its own row. May overlap with the Paladin weapon formula task above.

## Phase 4: Advanced Analysis

**Quick wins:**
- Accuracy/miss rate against high-level bosses
- Buff uptime/sustain (Berserk HP drain, Battleship HP, buff recasting)

**More training/AoE skills:**
- Piercing Arrow (Bowmaster), Boomerang Step + Band of Thieves (Shadower), Barrage + Dragon Strike (Buccaneer), Torpedo (Corsair, no transformation), Flamethrower + Ice Splitter (mages, with EB30 + capsules)

**Hard problems:**
- ~~Party DPS modeling~~ → shipped (see Done)
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

## Non-Goals

- Not a game wiki — only balance-relevant DPS stuff.
- Not a gear optimizer — the marginal gain calculator answers "what helps most?" without solving the full optimization problem.
- Not real-time multiplayer — proposals are async, no WebSockets.
- Not a mobile app — responsive web is enough.
