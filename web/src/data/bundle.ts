import {
  compareTiers,
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type ClassSkillData,
  type CharacterBuild,
} from '@metra/engine';
import { computeGearTotals } from '@engine/data/gear-utils.js';
import { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from '@engine/data/gear-merge.js';

// Static imports — bundled at build time, no fetch latency
import weaponsJson from '@data/weapons.json';
import attackSpeedJson from '@data/attack-speed.json';
import mwJson from '@data/mw.json';
import tierDefaultsJson from '@data/tier-defaults.json';

const tierDefaults = tierDefaultsJson as Record<string, TierDefaults>;

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

function findClassBase(templateName: string): ClassBase | null {
  const entries = Object.entries(baseModules)
    .map(([path, base]) => {
      const match = path.match(/\/([^/]+)\.base\.json$/);
      return match ? { name: match[1], base } : null;
    })
    .filter((e): e is { name: string; base: ClassBase } => e !== null)
    .sort((a, b) => b.name.length - a.name.length);

  for (const { name, base } of entries) {
    if (templateName.startsWith(name + '-')) {
      return base;
    }
  }
  return null;
}

function findTemplateModule(templateKey: string): Record<string, unknown> | null {
  const entry = Object.entries(templateModules).find(
    ([path]) => path.endsWith(`/${templateKey}.json`)
  );
  return entry ? entry[1] : null;
}

function parseGearTemplate(templateName: string, raw: Record<string, unknown>): CharacterBuild {
  if (typeof raw.extends === 'string') {
    const base = findClassBase(templateName);
    if (!base) {
      throw new Error(`Template "${templateName}" extends "${raw.extends}" but no base file found`);
    }
    const tier = templateName.slice((raw.extends as string).length + 1);
    const defaults = tierDefaults[tier];
    if (!defaults) {
      throw new Error(`Template "${templateName}" uses tier "${tier}" with no tier defaults`);
    }
    return mergeGearTemplate(base, raw as unknown as TierOverride, defaults);
  }

  // Flat mode (existing logic)
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
  for (const [path] of Object.entries(templateModules)) {
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

  const tierArray = [...tiers].sort(compareTiers);
  for (const name of classNames) {
    for (const tier of tierArray) {
      const key = `${name}-${tier}`;
      if (templateNames.includes(key)) {
        const raw = findTemplateModule(key);
        if (raw) {
          gearTemplates.set(key, parseGearTemplate(key, raw));
        }
      }
    }
  }

  return { classNames, tiers: tierArray, classDataMap, gearTemplates };
}

export const discoveredData = discoverClassesAndTiers();

/**
 * Get the raw per-slot gear breakdown for a template.
 * Returns the gearBreakdown object from the JSON file as-is.
 * CGS slots that come from tier-defaults are NOT included — only class-specific gear.
 */
export function getGearBreakdown(
  templateKey: string
): Record<string, Record<string, number>> | null {
  const raw = findTemplateModule(templateKey);
  if (!raw) return null;
  const breakdown = raw.gearBreakdown as
    | Record<string, Record<string, number>>
    | undefined;
  if (!breakdown) return null;

  // Deep clone so callers can't mutate the bundled data
  const result: Record<string, Record<string, number>> = {};
  for (const [slot, stats] of Object.entries(breakdown)) {
    result[slot] = { ...stats };
  }
  return result;
}
