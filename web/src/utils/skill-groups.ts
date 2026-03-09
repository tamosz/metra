import type { ScenarioResult } from '@engine/proposals/types.js';
import { VARIANT_CLASSES } from './class-colors.js';

export type SkillGroupId = 'main' | 'warriors' | 'mages' | 'archers' | 'thieves' | 'pirates' | 'multi-target';

export interface SkillGroup {
  id: SkillGroupId;
  label: string;
}

export const SKILL_GROUPS: SkillGroup[] = [
  { id: 'main', label: 'Main' },
  { id: 'warriors', label: 'Warriors' },
  { id: 'mages', label: 'Mages' },
  { id: 'archers', label: 'Archers' },
  { id: 'thieves', label: 'Thieves' },
  { id: 'pirates', label: 'Pirates' },
  { id: 'multi-target', label: 'Multi-target' },
];

export const DEFAULT_SKILL_GROUPS: readonly SkillGroupId[] = ['main'] as const;

const CLASS_TO_GROUP: Record<string, SkillGroupId> = {
  'Hero': 'warriors',
  'Hero (Axe)': 'warriors',
  'Dark Knight': 'warriors',
  'Paladin': 'warriors',
  'Paladin (BW)': 'warriors',
  'Bishop': 'mages',
  'Archmage I/L': 'mages',
  'Archmage F/P': 'mages',
  'Bowmaster': 'archers',
  'Marksman': 'archers',
  'Night Lord': 'thieves',
  'Shadower': 'thieves',
  'Corsair': 'pirates',
  'Buccaneer': 'pirates',
};

/**
 * Check if a simulation result should be visible given active skill groups.
 * Groups are additive: a result is visible if ANY active group includes it.
 */
export function isResultVisible(
  result: ScenarioResult,
  activeGroups: Set<SkillGroupId>
): boolean {
  // "Main" group: headline skills for non-variant classes
  if (activeGroups.has('main') && result.headline !== false && !VARIANT_CLASSES.has(result.className)) {
    return true;
  }

  // Class archetype groups: all skills (headline + non-headline) for those classes
  const classGroup = CLASS_TO_GROUP[result.className];
  if (classGroup && activeGroups.has(classGroup)) {
    return true;
  }

  // Multi-target: skills with maxTargets > 1
  if (activeGroups.has('multi-target') && (result.maxTargets ?? 1) > 1) {
    return true;
  }

  return false;
}
