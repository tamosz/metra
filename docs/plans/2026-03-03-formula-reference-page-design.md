# Formula Reference Page — Design

## Goal

Add a static reference page to the web app documenting the full DPS calculation pipeline. Audience: Royals staff and community members who want to understand the exact math behind the simulator's numbers.

## Page Structure

New `'formulas'` route in App.tsx, "Formulas" nav item. Single `FormulasPage.tsx` component. Sticky TOC sidebar on desktop (anchor links with scroll-based active highlighting), horizontal pill strip on mobile.

## Content Sections

1. **Intro** — Brief paragraph: what this page covers, formulas match the simulator exactly.

2. **Stat Calculation** — MW formula (floored per-stat), primary + secondary stat aggregation. Note on array secondary stats (Shadower STR+DEX).

3. **Attack Calculation** — Total attack = weapon ATK + potion + projectile + echo. Two echo variants: physical (`floor((WATK + potion + projectile) × 0.04)`) vs mage (`floor((INT + MATK + potion) × 0.04)`). Collapsible weapon multiplier table from `weapons.json`.

4. **Damage Range** — Three formula variants in KaTeX block math:
   - Standard (warriors, archers, Shadower)
   - Throwing Star (Night Lord)
   - Magic (Archmages, Bishop) with spell/weapon amplification

5. **Critical Damage** — Two variants (addBeforeMultiply / addAfterMultiply). Built-in crit stacking with SE. Rate capped at 1.0.

6. **Attack Speed** — Speed resolution (base - booster - SI, min 2). Fixed-speed skills (Hurricane, mage skills, Demolition).

7. **Damage Cap** — 199,999 cap. Adjusted range formula for partially-capped distributions.

8. **DPS** — Final formula: weighted average (normal + crit) × hitCount × Shadow Partner ÷ attackTime. Multi-target scaling. Combo group aggregation. Link to Build Explorer for hands-on experimentation.

9. **Class Reference Table** — One row per class from data bundle. Columns: formula type, mastery, primary/secondary stat, crit variant, built-in crit rate/bonus, notable mechanics.

## Tech

- **KaTeX** via `react-katex` — `BlockMath` for main formulas, `InlineMath` for variables in prose. CSS overrides for white-on-dark text.
- **Dynamic data**: weapon multiplier table from `weapons.json`, class reference table from skill data bundle. Keeps page in sync with simulator.
- **Static tables**: no sorting/filtering, just reference.
- **No interactivity** beyond TOC navigation.

## What It Won't Do

- No live calculations or stat inputs (that's the Build Explorer)
- No per-class deep-dive sub-pages
- No formula editing
