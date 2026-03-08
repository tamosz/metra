import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import XLSX from 'xlsx';
import { loadWorkbook, readSheet, type CellInfo } from '../src/sheets/extract.js';
import { computeGearTotals } from '../src/data/gear-utils.js';
import type { TierDefaults, ClassBase, TierOverride } from '../src/data/gear-merge.js';

const DATA_DIR = resolve(import.meta.dirname, '../data');

// --- Types ---

interface ClassBlock {
  label: string;
  headerRow: number;
  jsonClass: string;
  primaryStat: string;
  secondaryStat: string[];
  hasShield: boolean;
  hasBottom: boolean;
}

interface WatkBreakdown {
  weapon: number;
  shield: number;
  cape: number;
  shoe: number;
  glove: number;
  other: number;
}

interface ExtractedTemplate {
  totalWatk: number;
  gearPrimary: number;
  gearSecondary: number;
  baseStats: Record<string, number>;
  weaponWatk: number;
  watkBreakdown: WatkBreakdown;
}

interface CurrentTemplate {
  totalWatk: number;
  gearPrimary: number;
  gearSecondary: number;
  baseStats: Record<string, number>;
  weaponWatk: number;
  watkBreakdown: WatkBreakdown;
}

// --- Class block definitions ---

const CLASS_BLOCKS: ClassBlock[] = [
  { label: 'Night Lord', headerRow: 2, jsonClass: 'night-lord', primaryStat: 'LUK', secondaryStat: [], hasShield: false, hasBottom: true },
  { label: 'Shadower', headerRow: 27, jsonClass: 'shadower', primaryStat: 'LUK', secondaryStat: ['STR', 'DEX'], hasShield: true, hasBottom: true },
  { label: 'Hero/Pally', headerRow: 52, jsonClass: 'hero', primaryStat: 'STR', secondaryStat: ['DEX'], hasShield: false, hasBottom: false },
  { label: 'Dark Knight', headerRow: 77, jsonClass: 'dark-knight', primaryStat: 'STR', secondaryStat: ['DEX'], hasShield: false, hasBottom: false },
  { label: 'Bowmaster', headerRow: 102, jsonClass: 'bowmaster', primaryStat: 'DEX', secondaryStat: ['STR'], hasShield: false, hasBottom: true },
  { label: 'Marksman', headerRow: 127, jsonClass: 'marksman', primaryStat: 'DEX', secondaryStat: ['STR'], hasShield: false, hasBottom: true },
  { label: 'Buccaneer', headerRow: 152, jsonClass: 'bucc', primaryStat: 'STR', secondaryStat: ['DEX'], hasShield: false, hasBottom: true },
  { label: 'Corsair', headerRow: 177, jsonClass: 'sair', primaryStat: 'DEX', secondaryStat: ['STR'], hasShield: false, hasBottom: true },
  { label: 'Archmage F/P', headerRow: 202, jsonClass: 'archmage-fp', primaryStat: 'INT', secondaryStat: ['LUK'], hasShield: false, hasBottom: false },
  { label: 'Archmage I/L', headerRow: 226, jsonClass: 'archmage-il', primaryStat: 'INT', secondaryStat: ['LUK'], hasShield: false, hasBottom: false },
  { label: 'Hero/Pally ST', headerRow: 251, jsonClass: 'hero', primaryStat: 'STR', secondaryStat: ['DEX'], hasShield: true, hasBottom: true },
  { label: 'MM (Crow)', headerRow: 275, jsonClass: 'marksman', primaryStat: 'DEX', secondaryStat: ['STR'], hasShield: false, hasBottom: true },
];

// Tier column mappings: spreadsheet tier name → { statColumns, watkColumn } (0-indexed)
// Mid → our "low", Mid-high → our "mid", High → our "high"
const TIER_COLUMNS = {
  low:  { STR: 1, DEX: 2, INT: 3, LUK: 4, WATK: 5 },   // B=1, C=2, D=3, E=4, F=5
  mid:  { STR: 7, DEX: 8, INT: 9, LUK: 10, WATK: 11 },  // H=7, I=8, J=9, K=10, L=11
  high: { STR: 13, DEX: 14, INT: 15, LUK: 16, WATK: 17 }, // N=13, O=14, P=15, Q=16, R=17
} as const;

type OldTier = keyof typeof TIER_COLUMNS;
const OLD_TIERS: OldTier[] = ['low', 'mid', 'high'];

// Row offsets from headerRow for notable slots
const OFFSET_WEAPON = 0;
const OFFSET_SHIELD = 1;
const OFFSET_CAPE = 6;
const OFFSET_SHOE = 7;
const OFFSET_GLOVE = 8;
const GEAR_ROW_COUNT = 22; // rows 0..21
const OFFSET_BASE_STATS = 22;

// --- Spreadsheet extraction ---

function getCellNumericValue(sheet: XLSX.WorkSheet, row: number, col: number): number {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[address];
  if (!cell || cell.v == null) return 0;
  return typeof cell.v === 'number' ? cell.v : 0;
}

export function extractOldTemplate(
  sheet: XLSX.WorkSheet,
  block: ClassBlock,
  tier: OldTier
): ExtractedTemplate {
  const cols = TIER_COLUMNS[tier];
  const startRow = block.headerRow; // 1-indexed in spec, but xlsx uses 0-indexed rows

  // The headerRow values in CLASS_BLOCKS are 1-indexed (spreadsheet rows).
  // XLSX.utils.encode_cell uses 0-indexed rows, so subtract 1.
  const r0 = startRow - 1;

  // Sum gear stats and WATK across gear rows
  let totalWatk = 0;
  let gearPrimary = 0;
  let gearSecondary = 0;

  const watkByOffset: Record<number, number> = {};

  for (let offset = 0; offset < GEAR_ROW_COUNT; offset++) {
    const row = r0 + offset;
    const watk = getCellNumericValue(sheet, row, cols.WATK);
    totalWatk += watk;
    watkByOffset[offset] = watk;

    // Primary stat
    const primaryCol = cols[block.primaryStat as keyof typeof cols];
    if (primaryCol !== undefined) {
      gearPrimary += getCellNumericValue(sheet, row, primaryCol);
    }

    // Secondary stats
    for (const sec of block.secondaryStat) {
      const secCol = cols[sec as keyof typeof cols];
      if (secCol !== undefined) {
        gearSecondary += getCellNumericValue(sheet, row, secCol);
      }
    }
  }

  // Base stats from headerRow + 22
  const baseRow = r0 + OFFSET_BASE_STATS;
  const baseStats: Record<string, number> = {};
  for (const stat of ['STR', 'DEX', 'INT', 'LUK'] as const) {
    baseStats[stat] = getCellNumericValue(sheet, baseRow, cols[stat]);
  }

  const weaponWatk = watkByOffset[OFFSET_WEAPON] ?? 0;

  const watkBreakdown: WatkBreakdown = {
    weapon: watkByOffset[OFFSET_WEAPON] ?? 0,
    shield: watkByOffset[OFFSET_SHIELD] ?? 0,
    cape: watkByOffset[OFFSET_CAPE] ?? 0,
    shoe: watkByOffset[OFFSET_SHOE] ?? 0,
    glove: watkByOffset[OFFSET_GLOVE] ?? 0,
    other: totalWatk
      - (watkByOffset[OFFSET_WEAPON] ?? 0)
      - (watkByOffset[OFFSET_SHIELD] ?? 0)
      - (watkByOffset[OFFSET_CAPE] ?? 0)
      - (watkByOffset[OFFSET_SHOE] ?? 0)
      - (watkByOffset[OFFSET_GLOVE] ?? 0),
  };

  return {
    totalWatk,
    gearPrimary,
    gearSecondary,
    baseStats,
    weaponWatk,
    watkBreakdown,
  };
}

// --- Current template loading ---

function loadJson<T>(relativePath: string): T {
  const fullPath = resolve(DATA_DIR, relativePath);
  return JSON.parse(readFileSync(fullPath, 'utf-8')) as T;
}

export function loadCurrentTemplate(
  jsonClass: string,
  tier: string,
  block: ClassBlock
): CurrentTemplate | null {
  const templateName = `${jsonClass}-${tier}`;

  let tierData: TierOverride;
  try {
    tierData = loadJson<TierOverride>(`gear-templates/${templateName}.json`);
  } catch {
    return null;
  }

  let base: ClassBase | null = null;
  if (tierData.extends) {
    try {
      base = loadJson<ClassBase>(`gear-templates/${tierData.extends}.base.json`);
    } catch {
      // no base file
    }
  }

  const allDefaults = loadJson<Record<string, TierDefaults>>('tier-defaults.json');
  const defaults = allDefaults[tier];
  if (!defaults) return null;

  // Merge CGS into breakdown (same logic as mergeGearTemplate)
  const breakdown = { ...tierData.gearBreakdown };
  const cgsStatName = base?.cgsStatName ?? 'WATK';
  const cgsSlots = ['cape', 'glove', 'shoe'] as const;
  for (const slot of cgsSlots) {
    if (breakdown[slot]) continue;
    breakdown[slot] = { [cgsStatName]: defaults.cgs[slot] };
  }

  const computed = computeGearTotals(breakdown);

  // Sum primary and secondary from gear
  let gearPrimary = 0;
  let gearSecondary = 0;

  const primaryStat = block.primaryStat;
  if (primaryStat in computed.gearStats) {
    gearPrimary = computed.gearStats[primaryStat as keyof typeof computed.gearStats];
  }

  for (const sec of block.secondaryStat) {
    if (sec in computed.gearStats) {
      gearSecondary += computed.gearStats[sec as keyof typeof computed.gearStats];
    }
  }

  // WATK breakdown from individual slots
  const getSlotWatk = (slot: string): number => {
    const slotData = breakdown[slot];
    if (!slotData) return 0;
    return (slotData['WATK'] ?? 0) + (slotData['MATK'] ?? 0);
  };

  const weaponWatk = getSlotWatk('weapon');
  const shieldWatk = getSlotWatk('shield');
  const capeWatk = getSlotWatk('cape');
  const shoeWatk = getSlotWatk('shoe');
  const gloveWatk = getSlotWatk('glove');
  const knownWatk = weaponWatk + shieldWatk + capeWatk + shoeWatk + gloveWatk;

  const watkBreakdown: WatkBreakdown = {
    weapon: weaponWatk,
    shield: shieldWatk,
    cape: capeWatk,
    shoe: shoeWatk,
    glove: gloveWatk,
    other: computed.totalWeaponAttack - knownWatk,
  };

  return {
    totalWatk: computed.totalWeaponAttack,
    gearPrimary,
    gearSecondary,
    baseStats: tierData.baseStats as Record<string, number>,
    weaponWatk,
    watkBreakdown,
  };
}

// --- Smoke tests ---

const workbook = loadWorkbook();
const sheetNames = workbook.SheetNames;
const sheetName = sheetNames.find(n => n.includes('templates (old)'));
if (!sheetName) {
  console.error('Sheet "templates (old)" not found. Available sheets:', sheetNames);
  process.exit(1);
}

const sheet = workbook.Sheets[sheetName]!;

// --- Helpers ---

function delta(a: number, b: number): string {
  const d = b - a;
  if (d === 0) return '\u2014'; // em dash
  return d > 0 ? `+${d}` : `${d}`;
}

function pad(s: string | number, width: number, align: 'left' | 'right' = 'right'): string {
  const str = String(s);
  if (align === 'left') return str.padEnd(width);
  return str.padStart(width);
}

// Alternate spreadsheet templates that map to the same jsonClass
const ALT_TEMPLATES = new Set(['Hero/Pally ST', 'MM (Crow)']);

// Mage classes where WATK is actually MATK
const MAGE_CLASSES = new Set(['archmage-fp', 'archmage-il', 'bishop']);

// --- Main comparison loop ---

interface ComparisonRow {
  tier: string;
  old: ExtractedTemplate | null;
  cur: CurrentTemplate | null;
}

interface ClassComparison {
  block: ClassBlock;
  isAlt: boolean;
  isMage: boolean;
  rows: ComparisonRow[];
}

const comparisons: ClassComparison[] = [];

for (const block of CLASS_BLOCKS) {
  const isAlt = ALT_TEMPLATES.has(block.label);
  const isMage = MAGE_CLASSES.has(block.jsonClass);
  const rows: ComparisonRow[] = [];

  for (const tier of OLD_TIERS) {
    const old = extractOldTemplate(sheet, block, tier);
    const cur = loadCurrentTemplate(block.jsonClass, tier, block);
    rows.push({ tier, old, cur });
  }

  comparisons.push({ block, isAlt, isMage, rows });
}

// --- Console output ---

const W = 11; // column width for values
const DW = 6; // column width for deltas

function printClassTable(comp: ClassComparison) {
  const { block, isAlt, isMage } = comp;
  const secLabel = block.secondaryStat.length > 0 ? block.secondaryStat.join('+') : 'none';
  const altNote = isAlt ? ' (alt spreadsheet template)' : '';
  const atkLabel = isMage ? 'MATK' : 'WATK';

  console.log('='.repeat(120));
  console.log(` ${block.label}${altNote} (Primary: ${block.primaryStat}, Secondary: ${secLabel})`);
  console.log('='.repeat(120));

  // Header
  const hdr = [
    pad('Tier', 8, 'left'),
    pad(`${atkLabel}(old)`, W), pad(`${atkLabel}(cur)`, W), pad('\u0394', DW),
    pad(`1\u00B0gear(old)`, W), pad(`1\u00B0gear(cur)`, W), pad('\u0394', DW),
    pad(`2\u00B0gear(old)`, W), pad(`2\u00B0gear(cur)`, W), pad('\u0394', DW),
    pad(`Base1\u00B0(old)`, W), pad(`Base1\u00B0(cur)`, W), pad('\u0394', DW),
  ].join('  ');
  console.log(hdr);
  console.log('-'.repeat(hdr.length));

  for (const row of comp.rows) {
    if (!row.cur) {
      console.log(`${pad(row.tier, 8, 'left')}  (no template)`);
      continue;
    }
    const o = row.old!;
    const c = row.cur;
    const basePrimOld = o.baseStats[block.primaryStat] ?? 0;
    const basePrimCur = c.baseStats[block.primaryStat] ?? 0;

    const line = [
      pad(row.tier, 8, 'left'),
      pad(o.totalWatk, W), pad(c.totalWatk, W), pad(delta(o.totalWatk, c.totalWatk), DW),
      pad(o.gearPrimary, W), pad(c.gearPrimary, W), pad(delta(o.gearPrimary, c.gearPrimary), DW),
      pad(o.gearSecondary, W), pad(c.gearSecondary, W), pad(delta(o.gearSecondary, c.gearSecondary), DW),
      pad(basePrimOld, W), pad(basePrimCur, W), pad(delta(basePrimOld, basePrimCur), DW),
    ].join('  ');
    console.log(line);
  }
  console.log('');
}

// Print WATK breakdown for rows with large deltas
function printWatkBreakdown(comp: ClassComparison) {
  const atkLabel = comp.isMage ? 'MATK' : 'WATK';
  const largeDeltas = comp.rows.filter(r => r.old && r.cur && Math.abs(r.cur.totalWatk - r.old.totalWatk) > 3);
  if (largeDeltas.length === 0) return;

  console.log(`  ${atkLabel} Breakdown (|delta| > 3):`);
  const slots = ['weapon', 'shield', 'cape', 'shoe', 'glove', 'other'] as const;
  const slotW = 8;

  const hdr = [
    pad('Tier', 8, 'left'),
    ...slots.flatMap(s => [pad(`${s}(o)`, slotW), pad(`${s}(c)`, slotW), pad('\u0394', 5)]),
  ].join('  ');
  console.log(`  ${hdr}`);

  for (const row of largeDeltas) {
    const o = row.old!.watkBreakdown;
    const c = row.cur!.watkBreakdown;
    const line = [
      pad(row.tier, 8, 'left'),
      ...slots.flatMap(s => [pad(o[s], slotW), pad(c[s], slotW), pad(delta(o[s], c[s]), 5)]),
    ].join('  ');
    console.log(`  ${line}`);
  }
  console.log('');
}

for (const comp of comparisons) {
  printClassTable(comp);
  printWatkBreakdown(comp);
}

// --- Markdown output ---

function generateMarkdown(): string {
  const lines: string[] = [];
  lines.push('# Gear Template Comparison: Spreadsheet vs Current JSON');
  lines.push('');
  lines.push('Auto-generated by `scripts/compare-templates.ts`.');
  lines.push('');
  lines.push('Spreadsheet tiers: low (Mid), mid (Mid-high), high (High).');
  lines.push('');

  for (const comp of comparisons) {
    const { block, isAlt, isMage } = comp;
    const secLabel = block.secondaryStat.length > 0 ? block.secondaryStat.join('+') : 'none';
    const altNote = isAlt ? ' (alt spreadsheet template)' : '';
    const atkLabel = isMage ? 'MATK' : 'WATK';

    lines.push(`## ${block.label}${altNote}`);
    lines.push('');
    lines.push(`Primary: ${block.primaryStat}, Secondary: ${secLabel}`);
    lines.push('');

    // Main comparison table
    lines.push(`| Tier | ${atkLabel}(old) | ${atkLabel}(cur) | \u0394 | 1\u00B0gear(old) | 1\u00B0gear(cur) | \u0394 | 2\u00B0gear(old) | 2\u00B0gear(cur) | \u0394 | Base1\u00B0(old) | Base1\u00B0(cur) | \u0394 |`);
    lines.push(`|------|${'----|'.repeat(12)}`);

    for (const row of comp.rows) {
      if (!row.cur) {
        lines.push(`| ${row.tier} | | (no template) | | | | | | | | | | |`);
        continue;
      }
      const o = row.old!;
      const c = row.cur;
      const basePrimOld = o.baseStats[block.primaryStat] ?? 0;
      const basePrimCur = c.baseStats[block.primaryStat] ?? 0;

      lines.push(`| ${row.tier} | ${o.totalWatk} | ${c.totalWatk} | ${delta(o.totalWatk, c.totalWatk)} | ${o.gearPrimary} | ${c.gearPrimary} | ${delta(o.gearPrimary, c.gearPrimary)} | ${o.gearSecondary} | ${c.gearSecondary} | ${delta(o.gearSecondary, c.gearSecondary)} | ${basePrimOld} | ${basePrimCur} | ${delta(basePrimOld, basePrimCur)} |`);
    }
    lines.push('');

    // WATK breakdown for large deltas
    const largeDeltas = comp.rows.filter(r => r.old && r.cur && Math.abs(r.cur.totalWatk - r.old.totalWatk) > 3);
    if (largeDeltas.length > 0) {
      lines.push(`### ${atkLabel} Breakdown (|\u0394| > 3)`);
      lines.push('');
      lines.push(`| Tier | weapon(o) | weapon(c) | \u0394 | shield(o) | shield(c) | \u0394 | cape(o) | cape(c) | \u0394 | shoe(o) | shoe(c) | \u0394 | glove(o) | glove(c) | \u0394 | other(o) | other(c) | \u0394 |`);
      lines.push(`|------|${'----|'.repeat(18)}`);

      for (const row of largeDeltas) {
        const o = row.old!.watkBreakdown;
        const c = row.cur!.watkBreakdown;
        const slots = ['weapon', 'shield', 'cape', 'shoe', 'glove', 'other'] as const;
        const cells = slots.map(s => `${o[s]} | ${c[s]} | ${delta(o[s], c[s])}`).join(' | ');
        lines.push(`| ${row.tier} | ${cells} |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

const DOCS_DIR = resolve(import.meta.dirname, '../docs/audit');
mkdirSync(DOCS_DIR, { recursive: true });

const markdown = generateMarkdown();
const outputPath = resolve(DOCS_DIR, 'gear-template-comparison.md');
writeFileSync(outputPath, markdown);
console.log(`\nMarkdown report written to ${outputPath}`);
