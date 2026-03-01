import {
  TIER_ORDER,
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type ClassSkillData,
  type CharacterBuild,
} from '@engine/data/types.js';

// Static imports — bundled at build time, no fetch latency
import weaponsJson from '@data/weapons.json';
import attackSpeedJson from '@data/attack-speed.json';
import mwJson from '@data/mw.json';

// Skill data
const skillModules = import.meta.glob('@data/skills/*.json', { eager: true, import: 'default' }) as Record<string, ClassSkillData>;

// Gear templates
const templateModules = import.meta.glob('@data/gear-templates/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>;

export const weaponData: WeaponData = weaponsJson as WeaponData;
export const attackSpeedData: AttackSpeedData = attackSpeedJson as AttackSpeedData;
export const mwData: MWData = (mwJson as { entries: MWData }).entries;

function parseGearTemplate(raw: Record<string, unknown>): CharacterBuild {
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
 * Discover classes and tiers from bundled JSON data.
 * Browser equivalent of loader.ts discoverClassesAndTiers().
 */
export function discoverClassesAndTiers(): DiscoveryResult {
  // Extract class names from skill file paths
  const skillNames: string[] = [];
  const classDataMap = new Map<string, ClassSkillData>();
  for (const [path, data] of Object.entries(skillModules)) {
    const match = path.match(/\/([^/]+)\.json$/);
    if (match) {
      const name = match[1];
      skillNames.push(name);
      classDataMap.set(name, data);
    }
  }

  // Extract template names and tiers
  const templateNames: string[] = [];
  const gearTemplates = new Map<string, CharacterBuild>();
  for (const [path, raw] of Object.entries(templateModules)) {
    const match = path.match(/\/([^/]+)\.json$/);
    if (match) {
      templateNames.push(match[1]);
    }
  }

  // Sort skill names longest-first to handle prefix overlaps
  // (e.g., "hero-axe" must match before "hero" for template "hero-axe-high")
  const sortedSkillNames = [...skillNames].sort((a, b) => b.length - a.length);

  // Assign each template to the longest matching class name
  const templateToClass = new Map<string, string>();
  for (const t of templateNames) {
    for (const name of sortedSkillNames) {
      if (t.startsWith(name + '-')) {
        templateToClass.set(t, name);
        break;
      }
    }
  }

  const classNames: string[] = [];
  const tiers = new Set<string>();
  for (const name of skillNames) {
    const classTiers = templateNames
      .filter((t) => templateToClass.get(t) === name)
      .map((t) => t.slice(name.length + 1));
    if (classTiers.length > 0) {
      classNames.push(name);
      for (const tier of classTiers) tiers.add(tier);
    }
  }

  const tierArray = [...tiers].sort((a, b) => {
    const ai = TIER_ORDER.indexOf(a as typeof TIER_ORDER[number]);
    const bi = TIER_ORDER.indexOf(b as typeof TIER_ORDER[number]);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });
  for (const name of classNames) {
    for (const tier of tierArray) {
      const key = `${name}-${tier}`;
      if (templateNames.includes(key)) {
        // Find the raw data by matching path
        const matchingEntry = Object.entries(templateModules).find(
          ([path]) => path.endsWith(`/${key}.json`)
        );
        if (matchingEntry) {
          gearTemplates.set(key, parseGearTemplate(matchingEntry[1]));
        }
      }
    }
  }

  return { classNames, tiers: tierArray, classDataMap, gearTemplates };
}
