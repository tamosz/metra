import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import {
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type ClassSkillData,
  type CharacterBuild,
  type StatName,
} from '@metra/engine';
import { computeBuild, type ClassBase } from './gear-compute.js';

const DATA_DIR = resolve(import.meta.dirname, '../../data');

function loadJson<T>(relativePath: string): T {
  const fullPath = resolve(DATA_DIR, relativePath);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8')) as T;
  } catch (err) {
    throw new Error(
      `Failed to load data from ${relativePath}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}

export function loadWeapons(): WeaponData {
  return loadJson<WeaponData>('weapons.json');
}

export function loadAttackSpeed(): AttackSpeedData {
  return loadJson<AttackSpeedData>('attack-speed.json');
}

export function loadMW(): MWData {
  const raw = loadJson<{ entries: MWData }>('mw.json');
  return raw.entries;
}

export function loadClassSkills(className: string): ClassSkillData {
  const filename = className.toLowerCase().replace(/\//g, '').replace(/\s+/g, '-') + '.json';
  const data = loadJson<ClassSkillData>(`skills/${filename}`);
  data.sharpEyesCritRate ??= 0.15;
  data.sharpEyesCritDamageBonus ??= 140;
  data.seCritFormula ??= 'addBeforeMultiply';
  data.damageFormula ??= 'standard';
  return data;
}

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

/**
 * Load a gear template JSON file and resolve it into a CharacterBuild.
 * Supports two modes:
 * - Inheritance: template has "extends" pointing to a .base.json (used by mage perfect templates)
 * - Flat: template contains all fields directly
 */
export function loadGearTemplate(templateName: string): CharacterBuild {
  const raw = loadJson<Record<string, unknown>>(
    `gear-templates/${templateName}.json`
  );

  if (typeof raw.extends === 'string') {
    const baseName = raw.extends as string;
    const base = loadJson<ClassBase>(`gear-templates/${baseName}.base.json`);

    const breakdown = raw.gearBreakdown as Record<string, Record<string, number>> | undefined;
    if (!breakdown) {
      throw new Error(`Template "${templateName}" extends "${baseName}" but has no gearBreakdown`);
    }
    if (!raw.baseStats) {
      throw new Error(`Template "${templateName}" is missing baseStats`);
    }
    if (raw.attackPotion == null) {
      throw new Error(`Template "${templateName}" is missing attackPotion`);
    }
    const computed = computeGearTotals(breakdown);

    return {
      className: base.className,
      baseStats: raw.baseStats as CharacterBuild['baseStats'],
      gearStats: computed.gearStats,
      totalWeaponAttack: computed.totalWeaponAttack,
      weaponType: (raw.weaponType as string | undefined) ?? base.weaponType,
      weaponSpeed: (raw.weaponSpeed as number | undefined) ?? base.weaponSpeed,
      attackPotion: raw.attackPotion as number,
      projectile: (raw.projectile as number | undefined) ?? base.projectile,
      echoActive: base.echoActive,
      mwLevel: base.mwLevel,
      speedInfusion: base.speedInfusion,
      sharpEyes: base.sharpEyes,
      shadowPartner: base.shadowPartner,
    };
  }

  // Flat mode
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

export interface ClassDiscoveryResult {
  classNames: string[];
  classDataMap: Map<string, ClassSkillData>;
  builds: Map<string, CharacterBuild>;
}

/**
 * Auto-discover classes by scanning data/skills/ and data/gear-templates/.
 * A class is included only if it has both a skill file and a .base.json file.
 * Physical classes use computeBuild(); mage classes load {className}-perfect.json.
 */
export function discoverClasses(): ClassDiscoveryResult {
  const skillFiles = readdirSync(resolve(DATA_DIR, 'skills'))
    .filter((f: string) => f.endsWith('.json'))
    .map((f: string) => f.replace('.json', ''));

  const baseFiles = readdirSync(resolve(DATA_DIR, 'gear-templates'))
    .filter((f: string) => f.endsWith('.base.json'))
    .map((f: string) => f.replace('.base.json', ''));

  if (skillFiles.length === 0) {
    throw new Error(`No skill files found in data/skills/. Expected .json files defining class skills.`);
  }
  if (baseFiles.length === 0) {
    throw new Error(`No base files found in data/gear-templates/. Expected .base.json files defining class weapon data.`);
  }

  const baseSet = new Set(baseFiles);
  const classNames = skillFiles.filter(name => baseSet.has(name));

  const classDataMap = new Map<string, ClassSkillData>();
  const builds = new Map<string, CharacterBuild>();

  for (const name of classNames) {
    classDataMap.set(name, loadClassSkills(name));

    const base = loadJson<ClassBase>(`gear-templates/${name}.base.json`);
    if (base.category !== 'physical' && base.category !== 'mage') {
      throw new Error(`Invalid category "${base.category}" in gear-templates/${name}.base.json (expected "physical" or "mage")`);
    }
    if (base.category === 'mage') {
      builds.set(name, loadGearTemplate(`${name}-perfect`));
    } else {
      builds.set(name, computeBuild(base));
    }
  }

  return { classNames, classDataMap, builds };
}
