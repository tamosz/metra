import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { CharacterBuild, MWData, StatName } from '@metra/engine';
import { computeAvoidability } from '@metra/engine';

export interface ClassBase {
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
  echoActive?: boolean;
  mwLevel?: number;
  speedInfusion?: boolean;
  sharpEyes?: boolean;
  shadowPartner?: boolean;
  baseSecondaryOverride?: number;
  equipmentAvoid?: number;
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

const DATA_DIR = resolve(import.meta.dirname, '../../data');

let budgetCache: GearBudget | null = null;
let mwCache: MWData | null = null;

function loadGearBudget(): GearBudget {
  if (!budgetCache) {
    budgetCache = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'gear-budget.json'), 'utf-8')
    ) as GearBudget;
  }
  return budgetCache;
}

function loadMWData(): MWData {
  if (!mwCache) {
    const raw = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'mw.json'), 'utf-8')
    ) as { entries: MWData };
    mwCache = raw.entries;
  }
  return mwCache;
}

const ALL_STATS: StatName[] = ['STR', 'DEX', 'INT', 'LUK'];

export function computeBuild(base: ClassBase): CharacterBuild {
  const budget = loadGearBudget();
  const mwData = loadMWData();

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

  // gear stats: primary gets gearPrimary + weaponStat, each secondary gets gearSecondary
  const gearStats = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  gearStats[primary] = budget.gearPrimary + base.weaponStat;
  for (const sec of secondaryArr) {
    gearStats[sec] += budget.gearSecondary;
  }

  // add shield stats
  if (base.shieldStats) {
    for (const stat of ALL_STATS) {
      gearStats[stat] += base.shieldStats[stat] ?? 0;
    }
  }

  // base stats: each secondary gets baseSecondary (or per-class override), primary gets basePrimary (assigned last so it wins if overlap)
  const baseStats = { STR: 4, DEX: 4, INT: 4, LUK: 4 };
  for (const sec of secondaryArr) {
    baseStats[sec] = base.baseSecondaryOverride ?? budget.baseSecondary;
  }
  baseStats[primary] = budget.basePrimary;

  const mwLevel = base.mwLevel ?? 20;

  const build: CharacterBuild = {
    className: base.className,
    baseStats,
    gearStats,
    totalWeaponAttack,
    weaponType: base.weaponType,
    weaponSpeed: base.weaponSpeed,
    attackPotion: budget.attackPotion,
    projectile: base.projectile,
    echoActive: base.echoActive ?? true,
    mwLevel,
    speedInfusion: base.speedInfusion ?? true,
    sharpEyes: base.sharpEyes ?? true,
    shadowPartner: base.shadowPartner,
    equipmentAvoid: base.equipmentAvoid ?? 0,
    avoidability: 0,
  };

  build.avoidability = computeAvoidability(build, mwData, build.equipmentAvoid);

  return build;
}
