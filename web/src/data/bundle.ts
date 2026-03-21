import {
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type ClassSkillData,
  type CharacterBuild,
  type StatName,
} from '@metra/engine';

const STAT_NAMES: readonly StatName[] = ['STR', 'DEX', 'INT', 'LUK'];
const ATTACK_KEYS = ['WATK', 'MATK'] as const;

function computeGearTotals(
  gearBreakdown: Record<string, Record<string, number>>
): { gearStats: Record<StatName, number>; totalWeaponAttack: number } {
  const gearStats: Record<StatName, number> = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  let totalWeaponAttack = 0;

  for (const [slot, values] of Object.entries(gearBreakdown)) {
    if (slot === 'comment') continue;
    for (const stat of STAT_NAMES) {
      gearStats[stat] += values[stat] ?? 0;
    }
    for (const key of ATTACK_KEYS) {
      totalWeaponAttack += values[key] ?? 0;
    }
  }

  return { gearStats, totalWeaponAttack };
}

// Static imports — bundled at build time, no fetch latency
import weaponsJson from '@data/weapons.json';
import attackSpeedJson from '@data/attack-speed.json';
import mwJson from '@data/mw.json';
import gearBudgetJson from '@data/gear-budget.json';

// Skill data
const skillModules = import.meta.glob('@data/skills/*.json', { eager: true, import: 'default' }) as Record<string, ClassSkillData>;

// Gear template class bases
const baseModules = import.meta.glob('@data/gear-templates/*.base.json', { eager: true, import: 'default' }) as Record<string, ClassBase>;

// Gear templates (exclude base files)
const templateModules = import.meta.glob([
  '@data/gear-templates/*.json',
  '!@data/gear-templates/*.base.json',
], { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>;

export const weaponData: WeaponData = weaponsJson as WeaponData;
export const attackSpeedData: AttackSpeedData = attackSpeedJson as AttackSpeedData;
export const mwData: MWData = (mwJson as { entries: MWData }).entries;

interface ClassBase {
  className: string;
  category: 'physical' | 'mage';
  primaryStat: StatName;
  secondaryStat: StatName | StatName[];
  weaponType: string;
  weaponSpeed: number;
  godlyCleanWATK: number;
  weaponStat: number;
  shieldWATK?: number;
  shieldStats?: Partial<Record<StatName, number>>;
  passiveWATK?: number;
  projectile: number;
  echoActive: boolean;
  mwLevel: number;
  speedInfusion: boolean;
  sharpEyes: boolean;
  shadowPartner?: boolean;
}

interface GearBudget {
  gearPrimary: number;
  gearSecondary: number;
  nonWeaponWATK: number;
  scrollBonus: number;
  basePrimary: number;
  baseSecondary: number;
  attackPotion: number;
}

const budget = gearBudgetJson as GearBudget;

const ALL_STATS: StatName[] = ['STR', 'DEX', 'INT', 'LUK'];

/**
 * Browser-safe version of computeBuild from src/data/gear-compute.ts.
 * Uses statically imported gear-budget.json instead of fs.readFileSync.
 */
function computeBuildBrowser(base: ClassBase): CharacterBuild {
  const totalWeaponAttack =
    base.godlyCleanWATK +
    budget.scrollBonus +
    budget.nonWeaponWATK +
    (base.passiveWATK ?? 0) +
    (base.shieldWATK ?? 0);

  const primary = base.primaryStat;
  const secondaryArr = Array.isArray(base.secondaryStat)
    ? base.secondaryStat
    : [base.secondaryStat];

  const gearStats = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  gearStats[primary] = budget.gearPrimary + base.weaponStat;
  for (const sec of secondaryArr) {
    gearStats[sec] += budget.gearSecondary;
  }

  if (base.shieldStats) {
    for (const stat of ALL_STATS) {
      gearStats[stat] += base.shieldStats[stat] ?? 0;
    }
  }

  const baseStats = { STR: 4, DEX: 4, INT: 4, LUK: 4 };
  for (const sec of secondaryArr) {
    baseStats[sec] = budget.baseSecondary;
  }
  baseStats[primary] = budget.basePrimary;

  return {
    className: base.className,
    baseStats,
    gearStats,
    totalWeaponAttack,
    weaponType: base.weaponType,
    weaponSpeed: base.weaponSpeed,
    attackPotion: budget.attackPotion,
    projectile: base.projectile,
    echoActive: base.echoActive,
    mwLevel: base.mwLevel,
    speedInfusion: base.speedInfusion,
    sharpEyes: base.sharpEyes,
    shadowPartner: base.shadowPartner,
  };
}

/**
 * Parse a mage flat-mode gear template into a CharacterBuild.
 */
function parseMageTemplate(raw: Record<string, unknown>): CharacterBuild {
  const breakdown = raw.gearBreakdown as Record<string, Record<string, number>> | undefined;
  const computed = breakdown ? computeGearTotals(breakdown) : undefined;

  return {
    className: raw.className as string,
    baseStats: raw.baseStats as CharacterBuild['baseStats'],
    gearStats: computed?.gearStats ?? (raw.gearStats as CharacterBuild['gearStats']),
    totalWeaponAttack: computed?.totalWeaponAttack ?? (raw.totalWeaponAttack as number),
    weaponType: raw.weaponType as string,
    weaponSpeed: raw.weaponSpeed as number,
    attackPotion: raw.attackPotion as number,
    projectile: raw.projectile as number,
    echoActive: raw.echoActive as boolean,
    mwLevel: raw.mwLevel as number,
    speedInfusion: raw.speedInfusion as boolean,
    sharpEyes: raw.sharpEyes as boolean,
    shadowPartner: raw.shadowPartner as boolean | undefined,
  };
}

function findBaseForClass(className: string): ClassBase | null {
  for (const [path, base] of Object.entries(baseModules)) {
    const match = path.match(/\/([^/]+)\.base\.json$/);
    if (match && match[1] === className) return base;
  }
  return null;
}

function findTemplateModule(templateKey: string): Record<string, unknown> | null {
  const entry = Object.entries(templateModules).find(
    ([path]) => path.endsWith(`/${templateKey}.json`)
  );
  return entry ? entry[1] : null;
}

export interface DiscoveryResult {
  classNames: string[];
  classDataMap: Map<string, ClassSkillData>;
  builds: Map<string, CharacterBuild>;
}

/**
 * Discover classes from bundled JSON data.
 * Physical classes: compute build from base + gear budget.
 * Mage classes: parse the perfect-tier flat template.
 */
export function discoverClasses(): DiscoveryResult {
  const classDataMap = new Map<string, ClassSkillData>();
  const builds = new Map<string, CharacterBuild>();
  const classNames: string[] = [];

  // Extract class names and data from skill files
  for (const [path, data] of Object.entries(skillModules)) {
    const match = path.match(/\/([^/]+)\.json$/);
    if (!match) continue;
    const name = match[1];
    classDataMap.set(name, data);

    const base = findBaseForClass(name);
    if (!base) continue;

    if (base.category === 'physical') {
      builds.set(name, computeBuildBrowser(base));
      classNames.push(name);
    } else {
      // Mage: parse the perfect-tier template in flat mode
      const raw = findTemplateModule(`${name}-perfect`);
      if (raw) {
        // Merge base defaults under raw, but always use base for identity/buff fields
        const merged = {
          weaponType: base.weaponType,
          weaponSpeed: base.weaponSpeed,
          projectile: base.projectile,
          echoActive: base.echoActive,
          mwLevel: base.mwLevel,
          speedInfusion: base.speedInfusion,
          sharpEyes: base.sharpEyes,
          ...raw,
          className: base.className,
        };
        builds.set(name, parseMageTemplate(merged));
        classNames.push(name);
      }
    }
  }

  return { classNames, classDataMap, builds };
}

export const discoveredData = discoverClasses();
