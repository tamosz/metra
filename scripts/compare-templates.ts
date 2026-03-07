import { readFileSync } from 'fs';
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
  { label: 'NL', headerRow: 2, jsonClass: 'nl', primaryStat: 'LUK', secondaryStat: [], hasShield: false, hasBottom: true },
  { label: 'Shadower', headerRow: 27, jsonClass: 'shadower', primaryStat: 'LUK', secondaryStat: ['STR', 'DEX'], hasShield: true, hasBottom: true },
  { label: 'Hero/Pally', headerRow: 52, jsonClass: 'hero', primaryStat: 'STR', secondaryStat: ['DEX'], hasShield: false, hasBottom: false },
  { label: 'DrK', headerRow: 77, jsonClass: 'drk', primaryStat: 'STR', secondaryStat: ['DEX'], hasShield: false, hasBottom: false },
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

// Smoke test old extraction
const nlHigh = extractOldTemplate(sheet, CLASS_BLOCKS[0], 'high');
console.log('NL high weapon WATK:', nlHigh.weaponWatk, '(expected 95)');
console.log('NL high total WATK:', nlHigh.totalWatk);
console.log('NL high gear LUK:', nlHigh.gearPrimary);
console.log('NL high base LUK:', nlHigh.baseStats.LUK, '(expected 943)');

// Smoke test current loading
const heroHigh = loadCurrentTemplate('hero', 'high', CLASS_BLOCKS[2]);
console.log('\nHero high total WATK:', heroHigh?.totalWatk, '(expected 198)');
console.log('Hero high gear STR:', heroHigh?.gearPrimary);
