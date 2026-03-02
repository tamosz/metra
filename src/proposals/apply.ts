import type { ClassSkillData } from '../data/types.js';
import type { Proposal } from './types.js';

/** Valid numeric/string fields that a proposal can modify on a SkillEntry. */
const VALID_SKILL_FIELDS: ReadonlySet<string> = new Set([
  'basePower', 'multiplier', 'hitCount', 'speedCategory', 'weaponType', 'name',
  'attackType', 'builtInCritRate', 'builtInCritDamageBonus', 'element', 'maxTargets',
  'fixedDamage', 'comboGroup', 'attackRatio',
]);

/**
 * Derive a URL-safe slug from a skill name.
 * Steps: lowercase → strip parens/commas/slashes → spaces to hyphens → collapse runs of hyphens → trim edge hyphens.
 * "Brandish (Sword)" → "brandish-sword"
 */
export function skillSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[(),/]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse a proposal target string "className.skill-slug" into parts.
 */
function parseTarget(target: string): { className: string; slug: string } {
  const dotIndex = target.indexOf('.');
  if (dotIndex === -1) {
    throw new Error(`Invalid target "${target}": must be "className.skill-slug"`);
  }
  return {
    className: target.slice(0, dotIndex),
    slug: target.slice(dotIndex + 1),
  };
}

/**
 * Deep-clone a class data map and apply proposal changes.
 * Returns a new map — the original is not mutated.
 */
export function applyProposal(
  classDataMap: Map<string, ClassSkillData>,
  proposal: Proposal
): Map<string, ClassSkillData> {
  // Deep clone
  const cloned = new Map<string, ClassSkillData>();
  for (const [key, value] of classDataMap) {
    cloned.set(key, JSON.parse(JSON.stringify(value)));
  }

  const total = proposal.changes.length;
  for (let i = 0; i < total; i++) {
    const change = proposal.changes[i];
    const prefix = total > 1 ? `Change ${i + 1}/${total} (${change.target}.${change.field}): ` : '';

    const { className, slug } = parseTarget(change.target);
    const classData = cloned.get(className.toLowerCase());
    if (!classData) {
      throw new Error(
        `${prefix}Class "${className}" not found. Available: ${[...cloned.keys()].join(', ')}`
      );
    }

    const skill = classData.skills.find((s) => skillSlug(s.name) === slug);
    if (!skill) {
      const available = classData.skills.map((s) => skillSlug(s.name)).join(', ');
      throw new Error(
        `${prefix}Skill "${slug}" not found in ${className}. Available: ${available}`
      );
    }

    if (!VALID_SKILL_FIELDS.has(change.field)) {
      throw new Error(
        `${prefix}Unknown field "${change.field}" on skill "${slug}". Valid fields: ${[...VALID_SKILL_FIELDS].join(', ')}`
      );
    }

    // Validate "from" if provided
    const currentValue = (skill as unknown as Record<string, unknown>)[change.field];
    if (change.from !== undefined && currentValue !== change.from) {
      throw new Error(
        `${prefix}Stale proposal: ${change.target}.${change.field} is ${currentValue}, expected ${change.from}`
      );
    }

    // Apply the change
    (skill as unknown as Record<string, unknown>)[change.field] = change.to;
  }

  return cloned;
}
