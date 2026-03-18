# Party DPS Modeling Design

## Problem

The simulator calculates solo DPS per class, but real Royals gameplay is party-based. Solo DPS rankings don't capture the value of party buffs (SE, SI, Rage). An archer's contribution isn't just their Hurricane DPS — it's the SE crit boost they give to 5 other party members. Without modeling this, balance discussions undervalue support classes.

## Goals

- Model a 6-person party where buffs are derived from composition (not manually toggled)
- Quantify each member's total slot value (own DPS + buff contribution to others)
- Find optimal party compositions via brute-force optimization
- Let users build custom parties and compare slot swaps
- Ship with preset parties (Meta, creative/fun compositions)

## Non-Goals

- Multi-tier parties (scoped to perfect tier for now)
- Holy Symbol / Hyper Body modeling (not DPS-relevant enough)
- Boss encounter phases or fight timelines (separate future feature)
- Persistence / backend (parties are URL-shareable, not saved server-side)

## Engine

### New Types

```typescript
// src/engine/party.ts

interface PartyMember {
  className: string;  // e.g., 'night-lord', 'bowmaster'
}

interface Party {
  name: string;
  members: PartyMember[];  // exactly 6
}

interface PartyBuffState {
  sharpEyes: boolean;      // true if any Bowmaster or Marksman present
  speedInfusion: boolean;  // true if any Buccaneer present
  rage: boolean;           // true if any Hero (sword or axe) present
}

interface PartyMemberResult {
  className: string;
  skillName: string;          // best headline skill
  dps: number;                // this member's DPS in party context
  soloBaseline: number;       // DPS without party-derived buffs
  buffContribution: number;   // DPS this member enables for others
}

interface PartySimulationResult {
  party: Party;
  totalDps: number;
  members: PartyMemberResult[];
  activeBuffs: PartyBuffState;
}
```

### Buff Resolution

Pure function that derives party buffs from composition:

```typescript
function resolvePartyBuffs(members: PartyMember[]): PartyBuffState
```

Static mapping:
- `sharpEyes` ← `['bowmaster', 'marksman']`
- `speedInfusion` ← `['bucc']`
- `rage` ← `['hero', 'hero-axe']`

MW and Echo are always on (all classes have them, gear templates assume them).

### Rage — New Engine Addition

Rage is a Hero party buff: +12 WATK at max level (confirmed via [MapleRoyals Skill Library](https://royals.ms/forum/threads/mapleroyals-skill-library.209540/)).

Changes:
- Add `rage?: boolean` to `CharacterBuild` in `packages/engine/src/types.ts` (defaults to `false`)
- In `buffs.ts`, add a flat +12 to the total attack sum in `calculateTotalAttack` when `build.rage === true`. Note: this is different from Echo, which is percentage-based (`floor(base * 0.04)`). Rage is a simple flat addition.
- Existing simulations are unaffected (rage defaults to false, gear templates don't include it)

**Dashboard inconsistency note:** The dashboard currently assumes SE/SI/Echo as party buffs but does not include Rage. This is intentional for now — Rage was never part of the baseline assumed buffs, and adding it as a dashboard toggle is a follow-up task (not in scope for this feature). The party page is self-contained and handles Rage through composition.

### Party Simulation

```typescript
function simulateParty(
  party: Party,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData
): PartySimulationResult
```

Steps:
1. Call `resolvePartyBuffs(party.members)` to get `PartyBuffState`
2. For each member, get their perfect-tier gear template and class data
3. Override buff flags on each build: set `sharpEyes`, `speedInfusion`, `rage` from `PartyBuffState`
4. Run `calculateBuildDps` for each member, take the highest-DPS headline skill
5. Sum total party DPS

### Buff Attribution

For each member, compute their total slot value:
- `dps` = their personal DPS output in party context
- `buffContribution` = total party DPS with this member minus total party DPS with the slot empty (5-person party). Then subtract their own `dps` to isolate the buff value they provide to others.
- Total slot value = `dps + buffContribution`

Crucially, buff resolution is **re-run for the 5-person party**. Removing the only archer means SE drops for everyone in the re-simulation, not just subtracting the archer's DPS. This requires N full re-simulations per party (one per member), not simple arithmetic — but at 6 members × 6 DPS calls each = 36 calculations, this is trivial.

### Party Optimization

```typescript
function findOptimalParty(
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData,
  constraints?: OptimizationConstraints
): OptimizationResult

interface OptimizationConstraints {
  required?: string[];    // must include these classes
  excluded?: string[];    // can't use these classes
  maxDuplicates?: number; // max copies of any single class
}

interface OptimizationResult {
  optimal: PartySimulationResult;
  topParties: PartySimulationResult[];  // top 10
}
```

14 classes, 6 slots, duplicates allowed → C(19,6) = 27,132 unique compositions. For each: resolve buffs, simulate 6 members, sum DPS. ~163K DPS calculations total. All pure arithmetic — completes in well under a second in the browser.

The "Meta" preset is auto-computed from an unconstrained optimization run.

## Data

### Preset Parties

Stored in `src/engine/party-presets.ts` as a static array (not JSON files — they don't need auto-discovery).

Presets to ship:
- **Meta** — auto-computed by optimizer (unconstrained best party)
- **No Support** — auto-computed (exclude archers + bucc, pure DPS)
- **Warriors + SI** — Hero, Hero (Axe), DK, DK, Paladin, Bucc
- **Rainbow** — one of each archetype: Hero, DK, NL, BM, Bucc, Archmage I/L
- **Thief Gang** — NL, NL, NL, Shadower, Shadower, BM (SE for crits)
- **Pirate Crew** — Bucc, Bucc, Sair, Sair, BM, Hero
- **Mage Council** — Archmage I/L, Archmage F/P, Bishop, Bishop, BM, Hero
- **Archer Stack** — BM, BM, MM, MM, Hero, Bucc
- **Glass Cannon** — max DPS classes, no stance/tank (NL-heavy)
- **HT Meta** — common Horntail composition

More can be added easily. Trim during implementation if any feel redundant.

### CLAUDE.md Update

The Skill Library forum thread is already listed in Sources of Truth. Add a reference to the local extracted file `data/references/skill-library.md` alongside it, so developers know to check the local copy first before web-searching. Update the existing source #1 entry to mention the local file.

## Web

### Page Structure

New top-level route at `/party`, added to the router alongside Dashboard, Build Explorer, Proposal Builder, and Formulas.

Page layout (top to bottom):
1. **Preset selector** — horizontal scrollable row of preset party chips. Clicking one populates all 6 slots.
2. **Party builder** — sidebar roster + 3×2 party grid (Approach A from brainstorming). Drag from roster to grid, drag between slots to reorder, click to remove. Active buff bar shows SE/SI/Rage/MW lighting up based on composition.
3. **Attribution table** — stacked horizontal bar chart (each member is a colored segment) + table with columns: Class, Own DPS, Buff Value, Total Slot Value. Sorted by total slot value by default.
4. **Slot swap panel** — click a member row in the attribution table to expand. Shows every possible replacement class ranked by party DPS delta (positive = upgrade, negative = downgrade). Includes explanation text (e.g., "SE stays active — Marksman has SE too").

### State Management

New `usePartySimulation` hook:
- Input: array of 6 class slugs (or fewer if party isn't full)
- Calls `resolvePartyBuffs`, runs `calculateBuildDps` for each member with derived overrides
- Computes attribution by re-simulating without each member
- All synchronous — no loading states needed
- Returns `PartySimulationResult` with attribution data

### URL Sharing

Encode party composition as `#party=nl,nl,bm,hero,dk,bishop` (comma-separated class slugs). Human-readable, lightweight. Same lz-string compression as other URL params if needed, but party strings are short enough to skip compression.

### Self-Contained State

The party page does not interact with the dashboard's simulation controls (buff toggles, element toggles, KB, etc.). Buffs are derived from composition — that's the whole point. The page has no filter bar.

## Testing

### Engine Unit Tests (`src/engine/party.test.ts`)

- `resolvePartyBuffs`: archer → SE true, bucc → SI true, hero → rage true, no support → all false, duplicates don't double-apply
- `simulateParty`: total DPS = sum of member DPS, Rage adds +12 WATK, SE/SI flags correctly propagated
- `computeBuffAttribution`: removing non-buff class loses only their DPS, removing archer loses their DPS + SE value across all members, removing the only hero removes Rage from everyone

### Optimization Tests (`src/engine/party-optimization.test.ts`)

- Unconstrained optimal has highest total DPS of all compositions
- `required` constraint forces classes into result
- `excluded` constraint prevents classes
- `maxDuplicates` limits repetition
- Result count matches requested top N

### Web Tests (component + Playwright e2e)

- Preset selection populates slots correctly
- Drag-and-drop adds/removes/reorders members
- Buff bar updates on composition change
- Attribution table recalculates on member change
- URL encoding roundtrips
- Slot swap panel shows correct DPS deltas
- Take screenshots during development to visually verify UI

All engine tests use inline fixtures (not gear template files) — consistent with existing test patterns.
