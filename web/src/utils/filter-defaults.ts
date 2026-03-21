import type { SkillGroupId } from './skill-groups.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';
import type { BuffOverrides } from '../components/BuffToggles.js';

export const FILTER_DEFAULTS: {
  targetCount: number;
  capEnabled: boolean;
  kbEnabled: boolean;
  bossAttackInterval: number;
  bossAccuracy: number;
  breakdownEnabled: boolean;
} = {
  targetCount: 1,
  capEnabled: true,
  kbEnabled: false,
  bossAttackInterval: 1.5,
  bossAccuracy: 250,
  breakdownEnabled: false,
};

export function defaultActiveGroups(): Set<SkillGroupId> {
  return new Set(DEFAULT_SKILL_GROUPS);
}

export function defaultBuffOverrides(): BuffOverrides {
  return {};
}

export function defaultElementModifiers(): Record<string, number> {
  return {};
}
