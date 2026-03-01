import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import {
  TIER_ORDER,
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type ClassSkillData,
  type CharacterBuild,
} from './types.js';

const DATA_DIR = resolve(import.meta.dirname, '../../data');

function loadJson<T>(relativePath: string): T {
  const fullPath = resolve(DATA_DIR, relativePath);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8')) as T;
  } catch (err) {
    throw new Error(
      `Failed to load data from ${relativePath}: ${err instanceof Error ? err.message : String(err)}`
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

export function loadGearTemplate(templateName: string): CharacterBuild {
  const raw = loadJson<Record<string, unknown>>(
    `gear-templates/${templateName}.json`
  );
  return {
    className: raw.className as string,
    baseStats: raw.baseStats as CharacterBuild['baseStats'],
    gearStats: raw.gearStats as CharacterBuild['gearStats'],
    totalWeaponAttack: raw.totalWeaponAttack as number,
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
    .filter((f: string) => f.endsWith('.json'))
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

  const tierArray = [...tiers].sort((a, b) => {
    const ai = TIER_ORDER.indexOf(a as typeof TIER_ORDER[number]);
    const bi = TIER_ORDER.indexOf(b as typeof TIER_ORDER[number]);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });
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
