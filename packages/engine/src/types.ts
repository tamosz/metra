import type { z } from 'zod';
import type {
  statNameSchema,
  weaponTypeSchema,
  weaponDataSchema,
  attackSpeedEntrySchema,
  attackSpeedDataSchema,
  mwEntrySchema,
  skillEntrySchema,
  mixedRotationComponentSchema,
  mixedRotationSchema,
  classSkillDataSchema,
  characterBuildSchema,
} from './schemas.js';

// ---------------------------------------------------------------------------
// Types derived from Zod schemas — always in sync with runtime validation.
// ---------------------------------------------------------------------------

/** The four primary stats in Royals. */
export type StatName = z.infer<typeof statNameSchema>;

export type WeaponType = z.infer<typeof weaponTypeSchema>;
export type WeaponData = z.infer<typeof weaponDataSchema>;

export type AttackSpeedEntry = z.infer<typeof attackSpeedEntrySchema>;
export type AttackSpeedData = z.infer<typeof attackSpeedDataSchema>;

export type MWEntry = z.infer<typeof mwEntrySchema>;
export type MWData = z.infer<typeof mwEntrySchema>[];

export type SkillEntry = z.infer<typeof skillEntrySchema>;

export type MixedRotationComponent = z.infer<typeof mixedRotationComponentSchema>;
export type MixedRotation = z.infer<typeof mixedRotationSchema>;

export type ClassSkillData = z.infer<typeof classSkillDataSchema>;

export type CharacterBuild = z.infer<typeof characterBuildSchema>;

// ---------------------------------------------------------------------------
// Tier ordering utilities (used by both data loaders and simulation)
// ---------------------------------------------------------------------------

/** Canonical tier ordering for display and sorting. */
export const TIER_ORDER: readonly string[] = ['low', 'mid', 'high', 'perfect'];

/**
 * Sort comparator for tier names.
 * Known tiers (low/mid/high/perfect) keep their canonical position.
 * Unknown tiers sort after known tiers, alphabetically among themselves.
 */
export function compareTiers(a: string, b: string): number {
  const ai = TIER_ORDER.indexOf(a);
  const bi = TIER_ORDER.indexOf(b);
  const aIdx = ai === -1 ? TIER_ORDER.length : ai;
  const bIdx = bi === -1 ? TIER_ORDER.length : bi;
  if (aIdx !== bIdx) return aIdx - bIdx;
  // Both unknown — fall back to alphabetical
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  return 0;
}
