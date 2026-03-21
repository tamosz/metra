import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import {
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type ClassSkillData,
  type CharacterBuild,
} from '@metra/engine';
import { computeGearTotals } from './gear-utils.js';
import { mergeGearTemplate, type TierDefaults, type TierOverride } from './gear-merge.js';
import { computeBuild, type ClassBase } from './gear-compute.js';

/** Canonical tier ordering for display and sorting. Used by discoverClassesAndTiers (legacy). */
const TIER_ORDER: readonly string[] = ['low', 'mid', 'high', 'perfect'];

function compareTiers(a: string, b: string): number {
  const ai = TIER_ORDER.indexOf(a);
  const bi = TIER_ORDER.indexOf(b);
  const aIdx = ai === -1 ? TIER_ORDER.length : ai;
  const bIdx = bi === -1 ? TIER_ORDER.length : bi;
  if (aIdx !== bIdx) return aIdx - bIdx;
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  return 0;
}

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
  return loadJson<ClassSkillData>(`skills/${filename}`);
}

let tierDefaultsCache: Record<string, TierDefaults> | null = null;

function loadTierDefaults(): Record<string, TierDefaults> {
  if (!tierDefaultsCache) {
    tierDefaultsCache = loadJson<Record<string, TierDefaults>>('tier-defaults.json');
  }
  return tierDefaultsCache;
}

function loadClassBase(className: string): ClassBase | null {
  const fullPath = resolve(DATA_DIR, `gear-templates/${className}.base.json`);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8')) as ClassBase;
  } catch {
    return null;
  }
}

export function loadGearTemplate(templateName: string): CharacterBuild {
  const raw = loadJson<Record<string, unknown>>(
    `gear-templates/${templateName}.json`
  );

  // Inheritance mode: tier file has "extends" pointing to a class base
  if (typeof raw.extends === 'string') {
    const baseName = raw.extends as string;
    const base = loadClassBase(baseName);
    if (!base) {
      throw new Error(
        `Gear template "${templateName}" extends "${baseName}" but no ${baseName}.base.json found`
      );
    }

    const tier = templateName.slice(baseName.length + 1);
    const allDefaults = loadTierDefaults();
    const defaults = allDefaults[tier];
    if (!defaults) {
      throw new Error(
        `Gear template "${templateName}" uses tier "${tier}" but no tier defaults found for it`
      );
    }

    return mergeGearTemplate(base, raw as unknown as TierOverride, defaults);
  }

  // Flat mode (backward compatible)
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

export interface DiscoveryResult {
  classNames: string[];
  tiers: string[];
  classDataMap: Map<string, ClassSkillData>;
  gearTemplates: Map<string, CharacterBuild>;
}

/**
 * Auto-discover classes and tiers by scanning data/skills/ and data/gear-templates/.
 * A class is included only if it has both a skill file and at least one gear template.
 */
export function discoverClassesAndTiers(): DiscoveryResult {
  const skillFiles = readdirSync(resolve(DATA_DIR, 'skills'))
    .filter((f: string) => f.endsWith('.json'))
    .map((f: string) => f.replace('.json', ''));
  const templateFiles = readdirSync(resolve(DATA_DIR, 'gear-templates'))
    .filter((f: string) => f.endsWith('.json') && !f.includes('.base.'))
    .map((f: string) => f.replace('.json', ''));

  if (skillFiles.length === 0) {
    throw new Error(`No skill files found in data/skills/. Expected .json files defining class skills.`);
  }
  if (templateFiles.length === 0) {
    throw new Error(`No gear template files found in data/gear-templates/. Expected .json files defining character builds.`);
  }

  // Sort skill file names longest-first to handle prefix overlaps
  // (e.g., "hero-axe" must match before "hero" for template "hero-axe-high")
  const sortedSkillFiles = [...skillFiles].sort((a, b) => b.length - a.length);

  // Assign each template to the longest matching class name
  const templateToClass = new Map<string, string>();
  for (const t of templateFiles as string[]) {
    for (const name of sortedSkillFiles as string[]) {
      if (t.startsWith(name + '-')) {
        templateToClass.set(t, name);
        break;
      }
    }
  }

  const classNames: string[] = [];
  const tiers = new Set<string>();
  for (const name of skillFiles) {
    const classTiers = templateFiles
      .filter((t: string) => templateToClass.get(t) === name)
      .map((t: string) => t.slice(name.length + 1));
    if (classTiers.length > 0) {
      classNames.push(name);
      for (const tier of classTiers) tiers.add(tier);
    }
  }

  const classDataMap = new Map<string, ClassSkillData>();
  for (const name of classNames) {
    classDataMap.set(name, loadClassSkills(name));
  }

  const tierArray = [...tiers].sort(compareTiers);
  const gearTemplates = new Map<string, CharacterBuild>();
  for (const name of classNames) {
    for (const tier of tierArray) {
      const key = `${name}-${tier}`;
      if (templateFiles.includes(key)) {
        gearTemplates.set(key, loadGearTemplate(key));
      }
    }
  }

  return { classNames, tiers: tierArray, classDataMap, gearTemplates };
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

  const baseSet = new Set(baseFiles);
  const classNames = skillFiles.filter(name => baseSet.has(name));

  const classDataMap = new Map<string, ClassSkillData>();
  const builds = new Map<string, CharacterBuild>();

  for (const name of classNames) {
    classDataMap.set(name, loadClassSkills(name));

    const base = loadJson<ClassBase>(`gear-templates/${name}.base.json`);
    if (base.category === 'mage') {
      builds.set(name, loadGearTemplate(`${name}-perfect`));
    } else {
      builds.set(name, computeBuild(base));
    }
  }

  return { classNames, classDataMap, builds };
}
