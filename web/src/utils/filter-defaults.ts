import type { CgsValues } from './cgs.js';
import { CGS_DEFAULTS } from './cgs.js';
import type { SkillGroupId } from './skill-groups.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';
import type { BuffOverrides } from '../components/BuffToggles.js';

export const FILTER_DEFAULTS: {
  tier: string;
  targetCount: number;
  capEnabled: boolean;
  kbEnabled: boolean;
  bossAttackInterval: number;
  bossAccuracy: number;
  breakdownEnabled: boolean;
} = {
  tier: 'perfect',
  targetCount: 1,
  capEnabled: true,
  kbEnabled: false,
  bossAttackInterval: 1.5,
  bossAccuracy: 250,
  breakdownEnabled: false,
};

export function defaultCgsForTier(tier: string): CgsValues {
  return { ...(CGS_DEFAULTS[tier] ?? CGS_DEFAULTS.perfect) };
}

export function defaultActiveGroups(): Set<SkillGroupId> {
  return new Set(DEFAULT_SKILL_GROUPS);
}

export function defaultBuffOverrides(): BuffOverrides {
  return {};
}

export function defaultElementModifiers(): Record<string, number> {
  return {};
}
