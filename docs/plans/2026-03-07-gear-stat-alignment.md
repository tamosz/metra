# Gear Stat Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align gear template WATK/MATK, gear primary stats, and gear secondary stats to the spreadsheet's "templates (old)" sheet values for low/mid/high tiers.

**Architecture:** For each class × tier, read the spreadsheet target values from the comparison report, then update the per-slot `gearBreakdown` in the JSON template files. CGS slots (cape/glove/shoe) are injected at runtime from `data/tier-defaults.json` — don't add them to gearBreakdown unless the class already has them baked in (only Corsair and mages). After each class, run `npx tsx scripts/compare-templates.ts` to verify deltas shrink.

**Tech Stack:** JSON data files, TypeScript comparison script, Vitest

**Key context:**
- Comparison report: `docs/audit/gear-template-comparison.md`
- Comparison script: `scripts/compare-templates.ts`
- Gear templates: `data/gear-templates/{class}-{tier}.json` with `{class}.base.json`
- CGS defaults: `data/tier-defaults.json` — low(12/10/10), mid(16/15/13), high(18/20/16)
- Merge logic: `src/data/gear-merge.ts` — injects CGS for slots NOT in gearBreakdown
- Gear totals: `src/data/gear-utils.ts` — `computeGearTotals(gearBreakdown)` sums stats
- Base stats were already aligned in a prior commit — this plan covers gear stats only
- Pendants, helmets, and mage perfect tier are fine — don't touch them
- Weapon WATK was already capped to theoretical max for 6 classes — spreadsheet values above those caps are intentionally not matched
- The `other` column in the report = sum of WATK/MATK from all non-weapon, non-shield, non-CGS slots (medal, rings, earrings, etc.)

**Tier mapping:** Sheet "Mid" → our "low", Sheet "Mid-high" → our "mid", Sheet "High" → our "high". Perfect tier is curated separately and not part of this plan.

**What NOT to change:**
- Base stats (already done)
- Pendants and helmets (user says they're fine)
- Mage perfect tier templates
- Weapon WATK below our theoretical max caps (caps are intentional corrections)
- CGS values in `tier-defaults.json` (standardized across classes)

**Working approach:** The comparison report shows total-level deltas. To fix them, you need to figure out which per-slot values to adjust. The spreadsheet only has totals per gear row — it doesn't tell you which stat goes where. Use the current JSON templates as the starting point and adjust individual slots to hit the spreadsheet totals. Prioritize matching totals over matching individual slots.

---

### Task 1: Align NL gear stats (low/mid/high)

**Files:**
- Modify: `data/gear-templates/nl-low.json`
- Modify: `data/gear-templates/nl-mid.json`
- Modify: `data/gear-templates/nl-high.json`

**Target values from comparison report:**

| Tier | WATK target | gear LUK target | Current WATK | Current gear LUK |
|------|-------------|-----------------|--------------|------------------|
| low  | 111         | 94              | 111          | 55               |
| mid  | 131         | 104             | 130          | 79               |
| high | 154         | 126             | 149          | 101              |

NL has no secondary stat. CGS is injected from tier-defaults (not in gearBreakdown).

The WATK delta at high is -5 — but weapon is 91 vs spreadsheet 95. Our 91 is the theoretical max for Raven's Claw (intentional cap). The remaining WATK gap comes from CGS being standardized lower. Accept this delta.

Main issue: gear LUK is 25-39 below spreadsheet at all tiers. Add LUK to gear slots (top, bottom, earring, eye, face, rings) to close the gap.

**Step 1:** Read current nl-low.json, nl-mid.json, nl-high.json. Note which slots have LUK and how much.

**Step 2:** For each tier, increase LUK on appropriate gear slots to bring total gear LUK closer to the spreadsheet target. Distribute across slots realistically (scrolled LUK gear). Don't touch pendants or helmets.

**Step 3:** For mid and high, check if small WATK adjustments are needed on non-weapon, non-CGS slots (medal, rings).

**Step 4:** Run `npx tsx scripts/compare-templates.ts 2>&1 | head -20` and verify NL deltas improved.

**Step 5:** Run `npx vitest run` to ensure all tests pass.

**Step 6:** Commit: `align nl gear stats to spreadsheet`

---

### Task 2: Align Shadower gear stats (low/mid/high)

**Files:**
- Modify: `data/gear-templates/shadower-low.json`
- Modify: `data/gear-templates/shadower-mid.json`
- Modify: `data/gear-templates/shadower-high.json`

**Target values from comparison report:**

| Tier | WATK target | gear LUK target | gear STR+DEX target | Current WATK | Current gear LUK | Current gear STR+DEX |
|------|-------------|-----------------|---------------------|--------------|------------------|----------------------|
| low  | 192         | 87              | 159                 | 189          | 77               | 135                  |
| mid  | 208         | 99              | 180                 | 217          | 109              | 175                  |
| high | 247         | 135             | 213                 | 238          | 139              | 209                  |

Shadower has a shield (contributes WATK). CGS is injected from tier-defaults.

Key issues:
- Low: WATK -3 (close), gear LUK -10, gear STR+DEX -24
- Mid: WATK +9 (over), gear LUK +10 (over), gear STR+DEX -5
- High: WATK -9 (weapon 140 vs sheet 145, intentional cap), rest close

**Step 1-6:** Same pattern as Task 1. Read files, adjust per-slot values, verify with script, run tests, commit.

---

### Task 3: Align warrior gear stats — Hero, Paladin, Hero-Axe, Paladin-BW, DrK (low/mid/high)

**Files:**
- Modify: `data/gear-templates/hero-{low,mid,high}.json`
- Modify: `data/gear-templates/hero-axe-{low,mid,high}.json`
- Modify: `data/gear-templates/paladin-{low,mid,high}.json`
- Modify: `data/gear-templates/paladin-bw-{low,mid,high}.json`
- Modify: `data/gear-templates/drk-{low,mid,high}.json`

Hero and Paladin share the "Hero/Pally" spreadsheet block. Hero-Axe and Paladin-BW share gear with their sword/sword counterparts (same stats, different weapon). DrK has its own block.

**Hero/Pally target values:**

| Tier | WATK target | gear STR target | gear DEX target | Current WATK | Current gear STR | Current gear DEX |
|------|-------------|-----------------|-----------------|--------------|------------------|------------------|
| low  | 166         | 95              | 84              | 163          | 97               | 79               |
| mid  | 194         | 91              | 46              | 187          | 141              | 96               |
| high | 223         | 129             | 50              | 198          | 180              | 106              |

**CRITICAL:** At mid and high, our gear STR is +50 and gear DEX is +50 above spreadsheet. This is the biggest drift. The spreadsheet has much lower gear stats at mid/high — likely because it uses overall gear (no scrolling assumptions for stats, just WATK scrolling). Our templates may have over-estimated stat scrolling. This needs significant reduction in per-slot STR/DEX.

Also: WATK gap at high is -25 (weapon 140 vs sheet 150, intentional cap = -10; remaining -15 from CGS standardization + other slots). Accept weapon cap. Try to close remaining WATK gap via non-CGS, non-weapon slots where reasonable.

**DrK target values:**

| Tier | WATK target | gear STR target | gear DEX target | Current WATK | Current gear STR | Current gear DEX |
|------|-------------|-----------------|-----------------|--------------|------------------|------------------|
| low  | 159         | 80              | 69              | 160          | 97               | 79               |
| mid  | 185         | 91              | 46              | 180          | 141              | 96               |
| high | 212         | 129             | 50              | 192          | 180              | 106              |

Same pattern as Hero/Pally — massive gear stat inflation at mid/high.

**Step 1:** Read all warrior templates. Note that hero/paladin/hero-axe/paladin-bw share gear patterns.

**Step 2:** For Hero/Pally mid and high: significantly reduce per-slot STR and DEX. The spreadsheet has ~91 gear STR at mid (we have 141) and ~46 gear DEX at mid (we have 96). Cut stats on top, earring, eye, face, rings. Don't touch pendants or helmets.

**Step 3:** Apply same stat reductions to Hero-Axe, Paladin, Paladin-BW templates (they should match Hero gear-wise, just different weapon/base).

**Step 4:** For DrK: apply similar reductions. DrK low is closer but mid/high have the same +50 gear stat drift.

**Step 5:** Adjust WATK on non-CGS, non-weapon slots where reasonable to close WATK gaps.

**Step 6:** Run comparison script, verify deltas improved for all warriors.

**Step 7:** Run `npx vitest run`, ensure tests pass (integration snapshots will need `--update`).

**Step 8:** Commit: `align warrior gear stats to spreadsheet`

---

### Task 4: Align archer gear stats — Bowmaster, Marksman (low/mid/high)

**Files:**
- Modify: `data/gear-templates/bowmaster-{low,mid,high}.json`
- Modify: `data/gear-templates/marksman-{low,mid,high}.json`

**Bowmaster target values:**

| Tier | WATK target | gear DEX target | gear STR target | Current WATK | Current gear DEX | Current gear STR |
|------|-------------|-----------------|-----------------|--------------|------------------|------------------|
| low  | 161         | 90              | 85              | 148          | 97               | 61               |
| mid  | 181         | 122             | 87              | 177          | 141              | 74               |
| high | 204         | 156             | 101             | 198          | 182              | 83               |

Archer WATK gap is large at low (-13). WATK breakdown shows weapon(old)=125 vs weapon(cur)=105 — our weapon is lower (intentional cap or different weapon choice). The "other" column shows old=1 vs cur=11+, meaning we put WATK on accessories that the spreadsheet doesn't. Need to reconcile.

Gear DEX is +7 to +26 over spreadsheet (over-stated). Gear STR is -18 to -24 below spreadsheet (under-stated). Archers need MORE secondary STR and LESS primary DEX in gear.

**Marksman:** Same gear as Bowmaster (shared templates). Apply matching changes. MM has +5 WATK from Marksman Boost (baked into weapon WATK in templates).

**Step 1-6:** Same pattern. Read, adjust, verify, test, commit: `align archer gear stats to spreadsheet`

---

### Task 5: Align Buccaneer and Corsair gear stats (low/mid/high)

**Files:**
- Modify: `data/gear-templates/bucc-{low,mid,high}.json`
- Modify: `data/gear-templates/sair-{low,mid,high}.json`

**Buccaneer target values:**

| Tier | WATK target | gear STR target | gear DEX target | Current WATK | Current gear STR | Current gear DEX |
|------|-------------|-----------------|-----------------|--------------|------------------|------------------|
| low  | 139         | 96              | 83              | 137          | 98               | 79               |
| mid  | 159         | 119             | 98              | 163          | 129              | 102              |
| high | 182         | 159             | 108             | 176          | 157              | 120              |

Bucc is relatively close. Small adjustments needed.

**Corsair target values:**

| Tier | WATK target | gear DEX target | gear STR target | Current WATK | Current gear DEX | Current gear STR |
|------|-------------|-----------------|-----------------|--------------|------------------|------------------|
| low  | 139         | 91              | 82              | 140          | 101              | 70               |
| mid  | 159         | 123             | 84              | 160          | 146              | 75               |
| high | 182         | 157             | 98              | 172          | 189              | 76               |

Corsair: gear DEX over-stated (+10 to +32), gear STR under-stated (-6 to -22). Similar pattern to archers — need to shift stats from primary to secondary. Note: Corsair has CGS baked into gearBreakdown (check before adjusting).

**Step 1-6:** Same pattern. Commit: `align bucc and corsair gear stats to spreadsheet`

---

### Task 6: Align mage gear stats — Archmage F/P, Archmage I/L, Bishop (low/mid/high)

**Files:**
- Modify: `data/gear-templates/archmage-fp-{low,mid,high}.json`
- Modify: `data/gear-templates/archmage-il-{low,mid,high}.json`
- Modify: `data/gear-templates/bishop-{low,mid,high}.json`

**Archmage F/P and I/L target values (nearly identical):**

| Tier | MATK target | gear INT target | gear LUK target | Current MATK | Current gear INT | Current gear LUK |
|------|-------------|-----------------|-----------------|--------------|------------------|------------------|
| low  | 214         | ~165            | 49              | 100          | 137              | 0                |
| mid  | 238         | ~226            | 49              | 122          | 197              | 0                |
| high | 249         | ~319            | 49              | 145          | 255              | 0                |

**Massive MATK gap** (-100 to -116). MATK breakdown shows spreadsheet has MATK on shield, cape, glove, and "other" slots — our templates have 0 MATK on these slots. Mages need MATK added to gear slots (shield, earring, rings, etc.). Also need gear LUK added (49 at all tiers, we have 0).

Gear INT is also under-stated (-28 to -64). Need more INT on gear slots.

Note: mage CGS uses INT (not WATK) via `cgsStatName: "INT"` on base file. The CGS INT values from tier-defaults are different from MATK.

Wait — re-check: the comparison report column says "MATK" for mages. The `WATK` column in the spreadsheet for mages is actually MATK. And the comparison script sums `computeGearTotals().totalWeaponAttack` which for mages sums MATK across gearBreakdown slots. The mage gearBreakdown slots need `MATK` entries (weapon MATK, shield MATK, etc.).

Bishop shares gear with archmages but has no spreadsheet block in comparison script. Apply same gear patterns as archmages.

**Step 1:** Read current mage templates. Understand which slots have MATK/INT/LUK.

**Step 2:** Add MATK to shield, earring, and ring slots. Add LUK to gear slots. Increase INT on gear slots.

**Step 3:** Run comparison script, verify mage deltas improved.

**Step 4:** Run tests. Update snapshots if needed: `npx vitest run --update`.

**Step 5:** Commit: `align mage gear stats to spreadsheet`

---

### Task 7: Update integration test snapshots and verify

**Files:**
- Modify: `src/integration.test.ts` (snapshot update only)

**Step 1:** Run `npx vitest run --update` to update all DPS snapshots.

**Step 2:** Review the snapshot changes — DPS values should shift but rankings should remain reasonable.

**Step 3:** Run `npx vitest run` (without --update) to confirm all tests pass.

**Step 4:** Regenerate comparison report one final time: `npx tsx scripts/compare-templates.ts`

**Step 5:** Commit: `update integration snapshots after gear stat alignment`

---

### Task 8: Update MEMORY.md with new DPS reference values

After all gear stats are aligned, the DPS reference values in memory will be stale. Run `npm run simulate` and update the verified DPS reference values section in `/Users/tome/.claude/projects/-Users-tome-dev-metra/memory/MEMORY.md`.
