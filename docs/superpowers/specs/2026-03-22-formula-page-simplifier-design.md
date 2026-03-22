---
title: Formula Page Simplifier
date: 2026-03-22
status: approved
---

# Formula Page Simplifier

The formulas page is a wall of text. This redesign makes it explorable and interactive through four changes: accordion sections, class-aware filtering, smart tables, and tabbed sub-sections. Also fixes a data bug (Shadower doesn't have Shadow Partner).

## Changes

### 1. Accordion Sections

Replace the current 9 sequential sections with collapsible accordions. All start collapsed. Each accordion header shows:
- Section title (left)
- Brief subtitle summarizing content (right, muted)
- Chevron indicator (right)

Click to expand/collapse. Multiple sections can be open simultaneously. The existing sticky TOC sidebar and mobile pill nav are removed — the collapsed accordions themselves serve as navigation.

URL hash linking still works: if the page loads with `#damage-range` in the URL, that section auto-opens and scrolls into view.

Subtitles per section:
- Stat Calculation: "MW boost, total stats"
- Attack Calculation: "Echo, total attack, weapon multipliers"
- Damage Range: "Standard, throwing star, magic"
- Critical Damage: "SE crit, built-in crit"
- Attack Speed: "Booster, SI, fixed-speed skills"
- Damage Cap: "199,999 cap, adjusted ranges"
- DPS Formula: "Skill %, crit weighting, combos"
- Knockback Modeling: "Stance, dodge, uptime loss"
- Class Reference: "Per-class config table"

### 2. Class Filter

A row of class pill buttons at the top of the page (before the accordions). Selecting a class:

- **Damage Range**: auto-selects the relevant formula tab (standard for most physical, throwing star for Night Lord, magic for mages)
- **Attack Calculation**: weapon multipliers table highlights the weapon(s) used by that class. Echo/total attack shows the relevant variant (physical vs mage).
- **Knockback**: highlights the class's row in the KB defenses table
- **DPS Formula**: Shadow Partner note only shows if class has it (Night Lord only)
- **Critical Damage**: highlights built-in crit if class has it
- **Class Reference**: highlights the class row
- **Section subtitles** update to show class-specific context (e.g., "Standard formula (Hero)" instead of "Standard, throwing star, magic")

Class-to-weapon mapping comes from `ClassBase.weaponType` in gear templates. Class-to-formula mapping comes from `ClassSkillData.damageFormula`.

Selecting a class does NOT hide other content — it highlights relevant content. Users exploring the full reference shouldn't lose context. A second click deselects (returns to no-filter state).

### 3. Smart Weapon Multipliers Table

Split the single 13-row slash/stab table into two groups:

**Uniform multiplier** (slash = stab): 7 weapons. Single "W" column. Weapons with the same value are grouped on one row:
- Knuckle: 4.8
- 2H Sword: 4.6
- 1H Sword: 4.0
- Crossbow, Gun, Dagger: 3.6
- Bow: 3.4

**Slash/Stab differ**: 4 logical rows (Axe/BW pairs merged). Two columns:
- Polearm: 5.0 / 3.0
- 2H Axe / BW: 4.8 / 3.4
- 1H Axe / BW: 4.4 / 3.2
- Spear: 3.0 / 5.0

Sorted by highest value descending within each group.

### 4. Tabbed Sub-Sections

Where a section has formula variants shown top-to-bottom, replace with tabs:

**Damage Range** section: three tabs — "Standard", "Throwing Star", "Magic". Only the active tab's formulas are visible. Class filter auto-selects the relevant tab.

**Attack Calculation** section: the Echo formula and Total Attack formula have physical vs mage variants. Use two tabs — "Physical" and "Mage". The weapon multipliers table sits below the tabs (it's always relevant context, not variant-specific).

### 5. Bug Fix: Shadower Shadow Partner

In `ClassReferenceSection.tsx`, the `getNotables` function hardcodes Shadow Partner for both Night Lord and Shadower. Shadower doesn't have Shadow Partner — remove it. In `DpsFormulaSection.tsx`, the Shadow Partner description says "Night Lord and Shadower" — change to "Night Lord".

## Architecture

### New Components

- `AccordionSection` — wraps each formula section. Props: `id`, `title`, `subtitle`, `isOpen`, `onToggle`, `highlightClass?`. Renders a clickable header with chevron animation and a content div with height transition.

### Modified Components

- `FormulasPage` — manages accordion open/close state and selected class. Removes TOC sidebar and mobile nav. Adds class filter row and accordion wrappers.
- `AttackCalculationSection` — accepts `selectedClass` prop. Adds Physical/Mage tabs for echo/total attack. Restructures weapon table into two groups.
- `DamageRangeSection` — accepts `selectedClass` prop. Adds Standard/Throwing Star/Magic tabs.
- `DpsFormulaSection` — accepts `selectedClass` prop. Conditionally shows Shadow Partner. Fix "Shadower" mention.
- `CriticalDamageSection` — accepts `selectedClass` prop. Highlights built-in crit for selected class.
- `KnockbackModelingSection` — accepts `selectedClass` prop. Highlights class row in KB defenses table.
- `ClassReferenceSection` — accepts `selectedClass` prop. Highlights class row. Fix Shadow Partner bug.

### State Management

All state lives in `FormulasPage`:
- `openSections: Set<string>` — which accordions are expanded
- `selectedClass: string | null` — currently filtered class, or null

No context needed — props are passed directly to section components.

### Class Metadata Lookup

A utility function `getClassMetadata(className, discoveredData, allClassBases)` returns:
- `weaponType` — from ClassBase
- `damageFormula` — from ClassSkillData ('standard' | 'throwingStar' | 'magic')
- `hasStance` / `hasShifter` / `hasShadowPartner` — from ClassSkillData fields
- `hasBerserk` — className === 'Dark Knight'
- `builtInCritRate` — from skills array

This keeps the per-section components simple — they receive a metadata object rather than doing lookups themselves.

## Implementation Plan

### Step 1: Bug fix — Shadower Shadow Partner
- Remove Shadower from Shadow Partner in `ClassReferenceSection.tsx` `getNotables()`
- Fix "Night Lord and Shadower" text in `DpsFormulaSection.tsx`
- Commit

### Step 2: AccordionSection component + FormulasPage restructure
- Create `AccordionSection` component with expand/collapse, chevron animation, height transition
- Restructure `FormulasPage` to wrap each section in an accordion
- Remove TOC sidebar and mobile pill nav
- Add URL hash handling (auto-open section on load)
- Commit and verify

### Step 3: Smart weapon multipliers table
- Restructure `AttackCalculationSection` to split weapons into uniform vs slash/stab groups
- Group weapons with identical values
- Sort by highest value descending
- Commit and verify

### Step 4: Tabbed sub-sections
- Add tabs to `DamageRangeSection` (Standard / Throwing Star / Magic)
- Add tabs to `AttackCalculationSection` (Physical / Mage) for echo/total attack formulas
- Commit and verify

### Step 5: Class filter
- Add class metadata utility function
- Add class filter pill row to `FormulasPage`
- Wire `selectedClass` prop through to all section components
- Implement highlighting: auto-select tabs, highlight table rows, update subtitles
- Commit and verify

### Step 6: Polish and test
- Run full test suite (root + web)
- Run type check
- Manual browser verification
- E2e test updates if needed
