# Gear Template Audit — Spreadsheet Comparison

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract old gear templates from the source spreadsheet, compare against current templates, and produce a report showing total WATK, primary stat, and secondary stat deltas per class per tier.

**Architecture:** A one-off script (`scripts/compare-templates.ts`) that reads the "templates (old)" sheet, sums stats per class block and tier, loads the corresponding current JSON templates (including CGS injection from tier-defaults.json), and prints a side-by-side comparison to console + writes a markdown report to `docs/`.

**Tech Stack:** TypeScript, tsx, existing xlsx extraction (`src/sheets/extract.ts`)

---

### Task 1: Define class block metadata

**Files:**
- Create: `scripts/compare-templates.ts`

The "templates (old)" sheet has class blocks at known start rows. Each block uses 25 rows with a consistent layout. Tier columns:
- Mid (→ our Low): B(STR), C(DEX), D(INT), E(LUK), F(WATK)
- Mid-high (→ our Mid): H(STR), I(DEX), J(INT), K(LUK), L(WATK)
- High (→ our High): N(STR), O(DEX), P(INT), Q(LUK), R(WATK)

Row offsets from class header row:
- +0: weapon (primary stat + WATK)
- +1: shield (Shad only — primary stat + WATK)
- +3 to +5/+4: helmet, top/overall, bottom (stat rows — count varies by class)
- +6: cape WATK
- +7: shoe WATK
- +8: glove WATK
- +11 to +15: earring, eye, face, pendant, belt (accessory stat rows)
- +16 to +20: medal, rings (rings can have stats + WATK)
- +22: base stats (pre-MW)

**Step 1: Create the script with class block definitions and tier column mapping**

```ts
import { loadWorkbook, readSheet } from '../src/sheets/extract.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { computeGearTotals } from '../src/data/gear-utils.js';

const DATA_DIR = resolve(import.meta.dirname, '../data');

// --- Column mapping per tier ---
// Each tier has 5 columns: STR, DEX, INT, LUK, WATK
const TIER_COLUMNS = {
  low:  { STR: 'B', DEX: 'C', INT: 'D', LUK: 'E', WATK: 'F' },
  mid:  { STR: 'H', DEX: 'I', INT: 'J', LUK: 'K', WATK: 'L' },
  high: { STR: 'N', DEX: 'O', INT: 'P', LUK: 'Q', WATK: 'R' },
} as const;

type Tier = keyof typeof TIER_COLUMNS;
const TIERS: Tier[] = ['low', 'mid', 'high'];

// --- Class blocks ---
interface ClassBlock {
  name: string;            // display name
  jsonClass: string;       // filename stem in data/skills/ and data/gear-templates/
  headerRow: number;       // row of the class header (weapon row)
  primaryStat: 'STR' | 'DEX' | 'INT' | 'LUK';
  secondaryStat: ('STR' | 'DEX' | 'LUK')[];  // can be multiple (Shad uses STR+DEX)
  hasShield: boolean;
  hasBottom: boolean;      // thieves/archers/pirates use top+bottom; warriors use overall
}

const CLASS_BLOCKS: ClassBlock[] = [
  { name: 'NL',            jsonClass: 'nl',          headerRow: 2,   primaryStat: 'LUK', secondaryStat: [],              hasShield: false, hasBottom: true },
  { name: 'Shadower',      jsonClass: 'shadower',    headerRow: 27,  primaryStat: 'LUK', secondaryStat: ['STR', 'DEX'], hasShield: true,  hasBottom: true },
  { name: 'Hero/Pally',    jsonClass: 'hero',        headerRow: 52,  primaryStat: 'STR', secondaryStat: ['DEX'],         hasShield: false, hasBottom: false },
  { name: 'DrK',           jsonClass: 'drk',         headerRow: 77,  primaryStat: 'STR', secondaryStat: ['DEX'],         hasShield: false, hasBottom: false },
  { name: 'Bowmaster',     jsonClass: 'bowmaster',   headerRow: 102, primaryStat: 'DEX', secondaryStat: ['STR'],         hasShield: false, hasBottom: true },
  { name: 'Marksman',      jsonClass: 'marksman',    headerRow: 127, primaryStat: 'DEX', secondaryStat: ['STR'],         hasShield: false, hasBottom: true },
  { name: 'Buccaneer',     jsonClass: 'bucc',        headerRow: 152, primaryStat: 'STR', secondaryStat: ['DEX'],         hasShield: false, hasBottom: true },
  { name: 'Corsair',       jsonClass: 'sair',        headerRow: 177, primaryStat: 'DEX', secondaryStat: ['STR'],         hasShield: false, hasBottom: true },
  { name: 'Archmage F/P',  jsonClass: 'archmage-fp', headerRow: 202, primaryStat: 'INT', secondaryStat: ['LUK'],         hasShield: false, hasBottom: false },
  { name: 'Archmage I/L',  jsonClass: 'archmage-il', headerRow: 226, primaryStat: 'INT', secondaryStat: ['LUK'],         hasShield: false, hasBottom: false },
  { name: 'Hero/Pally ST', jsonClass: 'hero',        headerRow: 251, primaryStat: 'STR', secondaryStat: ['DEX'],         hasShield: true,  hasBottom: true },
  { name: 'MM (Crow)',     jsonClass: 'marksman',    headerRow: 275, primaryStat: 'DEX', secondaryStat: ['STR'],         hasShield: false, hasBottom: true },
];
```

Note: Hero/Pally ST (row 251) is a second Hero/Pally template with shield + top/bottom (Sword+Shield variant). MM (Crow) (row 275) is an alternate Marksman template. Both use the same jsonClass as their primary — the comparison will show both spreadsheet variants against the same current template.

Also note: NL has no secondary stat in the damage formula (throwingStar formula uses only LUK), so `secondaryStat` is empty.

**Step 2: Commit**

```bash
git add scripts/compare-templates.ts
git commit -m "add compare-templates script skeleton with class block definitions"
```

---

### Task 2: Extract old template totals from spreadsheet

**Files:**
- Modify: `scripts/compare-templates.ts`

**Step 1: Add the extraction function**

For each class block and tier, sum all stat and WATK values across every gear row in the block (excluding the base stats row at offset +22). Extract base stats separately.

The approach: iterate rows from `headerRow` to `headerRow + 21` (all gear rows), sum values per stat column. Then read `headerRow + 22` for base stats.

```ts
interface TemplateTotals {
  totalWatk: number;
  gearPrimary: number;    // total primary stat from gear
  gearSecondary: number;  // total secondary stat(s) from gear
  baseStats: { STR: number; DEX: number; INT: number; LUK: number };
  // Individual WATK sources for drill-down
  weaponWatk: number;
  capeWatk: number;
  shoeWatk: number;
  gloveWatk: number;
  otherWatk: number;      // medal + rings + shield
}

type SheetData = Record<string, { value: unknown; formula?: string }>;

function cellValue(sheet: SheetData, col: string, row: number): number {
  const key = `${col}${row}`;
  const cell = sheet[key];
  if (!cell) return 0;
  return typeof cell.value === 'number' ? cell.value : 0;
}

function extractOldTemplate(
  sheet: SheetData,
  block: ClassBlock,
  tier: Tier,
): TemplateTotals {
  const cols = TIER_COLUMNS[tier];
  const h = block.headerRow;

  // Sum all gear rows (header to header+21, skipping blank/header rows)
  let totalWatk = 0;
  let gearPrimary = 0;
  let gearSecondary = 0;

  const primaryCol = cols[block.primaryStat];
  const secondaryCols = block.secondaryStat.map((s) => cols[s]);

  for (let row = h; row <= h + 21; row++) {
    totalWatk += cellValue(sheet, cols.WATK, row);
    gearPrimary += cellValue(sheet, primaryCol, row);
    for (const col of secondaryCols) {
      gearSecondary += cellValue(sheet, col, row);
    }
  }

  // Individual WATK breakdown
  const weaponWatk = cellValue(sheet, cols.WATK, h);
  const shieldWatk = block.hasShield ? cellValue(sheet, cols.WATK, h + 1) : 0;
  const capeWatk = cellValue(sheet, cols.WATK, h + 6);
  const shoeWatk = cellValue(sheet, cols.WATK, h + 7);
  const gloveWatk = cellValue(sheet, cols.WATK, h + 8);
  const otherWatk = totalWatk - weaponWatk - shieldWatk - capeWatk - shoeWatk - gloveWatk;

  // Base stats at offset +22
  const baseStats = {
    STR: cellValue(sheet, cols.STR, h + 22),
    DEX: cellValue(sheet, cols.DEX, h + 22),
    INT: cellValue(sheet, cols.INT, h + 22),
    LUK: cellValue(sheet, cols.LUK, h + 22),
  };

  return {
    totalWatk, gearPrimary, gearSecondary,
    baseStats,
    weaponWatk, capeWatk, shoeWatk, gloveWatk, otherWatk,
  };
}
```

**Step 2: Run the script to verify extraction works**

Add a quick test at the bottom:

```ts
const workbook = loadWorkbook();
const sheet = readSheet(workbook, 'templates (old)');

// Quick smoke test: NL high weapon should be 95
const nlHigh = extractOldTemplate(sheet, CLASS_BLOCKS[0], 'high');
console.log('NL high weapon WATK:', nlHigh.weaponWatk, '(expected 95)');
console.log('NL high total WATK:', nlHigh.totalWatk);
console.log('NL high base LUK:', nlHigh.baseStats.LUK);
```

Run: `npx tsx scripts/compare-templates.ts`
Expected: NL high weapon WATK = 95, base LUK = 943

**Step 3: Commit**

```bash
git add scripts/compare-templates.ts
git commit -m "add old template extraction from spreadsheet"
```

---

### Task 3: Load current template totals

**Files:**
- Modify: `scripts/compare-templates.ts`

**Step 1: Add function to load current template and compute equivalent totals**

```ts
interface TierDefaults {
  attackPotion: number;
  potionName: string;
  cgs: { cape: number; glove: number; shoe: number };
}

function loadCurrentTemplate(
  jsonClass: string,
  tier: Tier,
  block: ClassBlock,
): TemplateTotals | null {
  const tierDefaults: Record<string, TierDefaults> = JSON.parse(
    readFileSync(resolve(DATA_DIR, 'tier-defaults.json'), 'utf-8')
  );
  const defaults = tierDefaults[tier];

  // Load tier override JSON
  const templatePath = resolve(DATA_DIR, `gear-templates/${jsonClass}-${tier}.json`);
  let template: {
    baseStats: Record<string, number>;
    gearBreakdown: Record<string, Record<string, number>>;
  };
  try {
    template = JSON.parse(readFileSync(templatePath, 'utf-8'));
  } catch {
    return null; // template doesn't exist for this tier
  }

  // Inject CGS if not already in breakdown
  const breakdown = { ...template.gearBreakdown };

  // Load base file to check cgsStatName
  const basePath = resolve(DATA_DIR, `gear-templates/${jsonClass}.base.json`);
  let cgsStatName = 'WATK';
  try {
    const base = JSON.parse(readFileSync(basePath, 'utf-8'));
    cgsStatName = base.cgsStatName ?? 'WATK';
  } catch { /* use default */ }

  for (const slot of ['cape', 'glove', 'shoe'] as const) {
    if (!breakdown[slot]) {
      breakdown[slot] = { [cgsStatName]: defaults.cgs[slot] };
    }
  }

  const computed = computeGearTotals(breakdown);

  // Map to TemplateTotals
  const primaryKey = block.primaryStat;
  const gearPrimary = computed.gearStats[primaryKey];
  const gearSecondary = block.secondaryStat.reduce(
    (sum, s) => sum + computed.gearStats[s], 0
  );

  // WATK breakdown
  const weaponWatk = (breakdown.weapon?.WATK ?? 0) + (breakdown.weapon?.MATK ?? 0);
  const shieldWatk = breakdown.shield?.WATK ?? 0;
  const capeWatk = breakdown.cape?.WATK ?? 0;
  const shoeWatk = breakdown.shoe?.WATK ?? 0;
  const gloveWatk = breakdown.glove?.WATK ?? 0;
  const otherWatk = computed.totalWeaponAttack - weaponWatk - shieldWatk - capeWatk - shoeWatk - gloveWatk;

  return {
    totalWatk: computed.totalWeaponAttack,
    gearPrimary,
    gearSecondary,
    baseStats: {
      STR: template.baseStats.STR ?? 0,
      DEX: template.baseStats.DEX ?? 0,
      INT: template.baseStats.INT ?? 0,
      LUK: template.baseStats.LUK ?? 0,
    },
    weaponWatk, capeWatk, shoeWatk, gloveWatk, otherWatk,
  };
}
```

**Step 2: Smoke test**

```ts
const heroHigh = loadCurrentTemplate('hero', 'high', CLASS_BLOCKS[2]);
console.log('Hero high total WATK:', heroHigh?.totalWatk, '(expected 198)');
```

Run: `npx tsx scripts/compare-templates.ts`
Expected: Hero high total WATK = 198

**Step 3: Commit**

```bash
git add scripts/compare-templates.ts
git commit -m "add current template loading for comparison"
```

---

### Task 4: Generate comparison output

**Files:**
- Modify: `scripts/compare-templates.ts`

**Step 1: Replace smoke tests with full comparison logic**

Remove the smoke test code. Add comparison rendering:

```ts
interface ComparisonRow {
  className: string;
  tier: Tier;
  old: TemplateTotals;
  current: TemplateTotals | null;
}

function delta(a: number, b: number): string {
  const d = b - a;
  if (d === 0) return '  —';
  return d > 0 ? ` +${d}` : ` ${d}`;
}

function pad(s: string | number, width: number, align: 'left' | 'right' = 'right'): string {
  const str = String(s);
  return align === 'right' ? str.padStart(width) : str.padEnd(width);
}

function renderConsole(rows: ComparisonRow[]): void {
  // Group by class
  let currentClass = '';
  for (const row of rows) {
    if (row.className !== currentClass) {
      currentClass = row.className;
      console.log(`\n${'='.repeat(80)}`);
      console.log(` ${currentClass}`);
      console.log(`${'='.repeat(80)}`);
      console.log(
        `${pad('Tier', 6, 'left')}  ` +
        `${pad('WATK(old)', 9)}  ${pad('WATK(cur)', 9)}  ${pad('Δ', 5)}  ` +
        `${pad('1°stat(old)', 11)}  ${pad('1°stat(cur)', 11)}  ${pad('Δ', 5)}  ` +
        `${pad('2°stat(old)', 11)}  ${pad('2°stat(cur)', 11)}  ${pad('Δ', 5)}  ` +
        `${pad('BasePri(old)', 12)}  ${pad('BasePri(cur)', 12)}  ${pad('Δ', 5)}`
      );
      console.log('-'.repeat(120));
    }
    const c = row.current;
    if (!c) {
      console.log(`${pad(row.tier, 6, 'left')}  (no current template)`);
      continue;
    }
    const basePriOld = row.old.baseStats[row.old.baseStats.STR ? 'STR' : 'LUK']; // simplified
    // Use the block's primaryStat to pick the right base stat
    const block = CLASS_BLOCKS.find((b) => b.name === row.className)!;
    const basePriOldVal = row.old.baseStats[block.primaryStat];
    const basePriCurVal = c.baseStats[block.primaryStat];

    console.log(
      `${pad(row.tier, 6, 'left')}  ` +
      `${pad(row.old.totalWatk, 9)}  ${pad(c.totalWatk, 9)}  ${pad(delta(row.old.totalWatk, c.totalWatk), 5)}  ` +
      `${pad(row.old.gearPrimary, 11)}  ${pad(c.gearPrimary, 11)}  ${pad(delta(row.old.gearPrimary, c.gearPrimary), 5)}  ` +
      `${pad(row.old.gearSecondary, 11)}  ${pad(c.gearSecondary, 11)}  ${pad(delta(row.old.gearSecondary, c.gearSecondary), 5)}  ` +
      `${pad(basePriOldVal, 12)}  ${pad(basePriCurVal, 12)}  ${pad(delta(basePriOldVal, basePriCurVal), 5)}`
    );
  }
}

function renderMarkdown(rows: ComparisonRow[]): string {
  const lines: string[] = ['# Gear Template Audit: Old Spreadsheet vs Current', ''];
  lines.push('Tier mapping: Sheet Mid → Low, Sheet Mid-high → Mid, Sheet High → High.', '');

  let currentClass = '';
  for (const row of rows) {
    if (row.className !== currentClass) {
      currentClass = row.className;
      const block = CLASS_BLOCKS.find((b) => b.name === row.className)!;
      lines.push(`## ${currentClass}`, '');
      lines.push(`Primary: ${block.primaryStat}, Secondary: ${block.secondaryStat.join('+') || 'none'}`, '');
      lines.push(
        '| Tier | WATK (old) | WATK (cur) | Δ | Gear 1° (old) | Gear 1° (cur) | Δ | Gear 2° (old) | Gear 2° (cur) | Δ | Base 1° (old) | Base 1° (cur) | Δ |'
      );
      lines.push(
        '|------|-----------|-----------|---|--------------|--------------|---|--------------|--------------|---|--------------|--------------|---|'
      );
    }
    const c = row.current;
    if (!c) {
      lines.push(`| ${row.tier} | — | no template | | | | | | | | | | |`);
      continue;
    }
    const block = CLASS_BLOCKS.find((b) => b.name === row.className)!;
    const bpo = row.old.baseStats[block.primaryStat];
    const bpc = c.baseStats[block.primaryStat];
    lines.push(
      `| ${row.tier} ` +
      `| ${row.old.totalWatk} | ${c.totalWatk} | ${delta(row.old.totalWatk, c.totalWatk).trim()} ` +
      `| ${row.old.gearPrimary} | ${c.gearPrimary} | ${delta(row.old.gearPrimary, c.gearPrimary).trim()} ` +
      `| ${row.old.gearSecondary} | ${c.gearSecondary} | ${delta(row.old.gearSecondary, c.gearSecondary).trim()} ` +
      `| ${bpo} | ${bpc} | ${delta(bpo, bpc).trim()} |`
    );
  }

  // Add WATK breakdown section for rows with large deltas
  lines.push('', '## WATK Breakdown (where total Δ > 3)', '');
  for (const row of rows) {
    if (!row.current) continue;
    const d = Math.abs(row.current.totalWatk - row.old.totalWatk);
    if (d <= 3) continue;
    lines.push(`### ${row.className} — ${row.tier} (Δ ${delta(row.old.totalWatk, row.current.totalWatk).trim()})`, '');
    lines.push('| Slot | Old | Current | Δ |');
    lines.push('|------|-----|---------|---|');
    const pairs: [string, number, number][] = [
      ['Weapon', row.old.weaponWatk, row.current.weaponWatk],
      ['Cape', row.old.capeWatk, row.current.capeWatk],
      ['Shoe', row.old.shoeWatk, row.current.shoeWatk],
      ['Glove', row.old.gloveWatk, row.current.gloveWatk],
      ['Other', row.old.otherWatk, row.current.otherWatk],
    ];
    for (const [slot, o, c] of pairs) {
      lines.push(`| ${slot} | ${o} | ${c} | ${delta(o, c).trim()} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// --- Main ---
const workbook = loadWorkbook();
const sheet = readSheet(workbook, 'templates (old)');

const rows: ComparisonRow[] = [];
for (const block of CLASS_BLOCKS) {
  for (const tier of TIERS) {
    const old = extractOldTemplate(sheet, block, tier);
    const current = loadCurrentTemplate(block.jsonClass, tier, block);
    rows.push({ className: block.name, tier, old, current });
  }
}

renderConsole(rows);

const markdown = renderMarkdown(rows);
const outPath = resolve(import.meta.dirname, '../docs/audit/gear-template-comparison.md');
writeFileSync(outPath, markdown);
console.log(`\nMarkdown report written to: docs/audit/gear-template-comparison.md`);
```

**Step 2: Create the output directory**

Run: `mkdir -p docs/audit`

**Step 3: Run the full comparison**

Run: `npx tsx scripts/compare-templates.ts`

Expected: Console output showing per-class, per-tier comparison tables. Markdown file written to `docs/audit/gear-template-comparison.md`.

**Step 4: Commit**

```bash
git add scripts/compare-templates.ts docs/audit/gear-template-comparison.md
git commit -m "generate gear template comparison: old spreadsheet vs current"
```

---

### Task 5: Review and annotate the report

**Files:**
- Modify: `docs/audit/gear-template-comparison.md` (manual annotations)

**Step 1: Read the generated report**

Scan for:
- Classes where total WATK delta > ±5 — these need investigation
- Classes where gear primary stat delta > ±20 — likely a slot was added/removed/changed
- Classes where base stat differs — intentional tier definition change vs transcription error
- Mage templates (Archmage F/P, Archmage I/L) — these were estimated, expect large deltas

**Step 2: Add annotation section at the top of the report**

Summarize findings: which classes are well-aligned, which have significant drift, and which differences are intentional (documented in gear-assumptions.md) vs unexplained.

**Step 3: Commit**

```bash
git add docs/audit/gear-template-comparison.md
git commit -m "annotate gear template comparison with findings"
```
