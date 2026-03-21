import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { CharacterBuild, StatName } from '@metra/engine';

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
  echoActive: boolean;
  mwLevel: number;
  speedInfusion: boolean;
  sharpEyes: boolean;
  shadowPartner?: boolean;
  dexRequirement?: number;
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

function loadGearBudget(): GearBudget {
  if (!budgetCache) {
    budgetCache = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'gear-budget.json'), 'utf-8')
    ) as GearBudget;
  }
  return budgetCache;
}

const ALL_STATS: StatName[] = ['STR', 'DEX', 'INT', 'LUK'];

export function computeBuild(base: ClassBase): CharacterBuild {
  const budget = loadGearBudget();

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

  // base stats: primary gets basePrimary, each secondary gets baseSecondary, others 4
  const baseStats = { STR: 4, DEX: 4, INT: 4, LUK: 4 };
  baseStats[primary] = budget.basePrimary;
  for (const sec of secondaryArr) {
    baseStats[sec] = budget.baseSecondary;
  }

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
