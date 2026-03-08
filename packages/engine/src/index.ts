// @metra/engine — public API
// Pure functions for Royals balance simulation. Zero dependencies beyond zod.
// No filesystem I/O, no side effects, safe for browser and Node.

// Schemas (runtime validation)
export {
  statNameSchema,
  weaponTypeSchema,
  weaponDataSchema,
  attackSpeedEntrySchema,
  attackSpeedDataSchema,
  mwEntrySchema,
  mwDataSchema,
  skillEntrySchema,
  mixedRotationComponentSchema,
  mixedRotationSchema,
  classSkillDataSchema,
  characterBuildSchema,
} from './schemas.js';

// Types (derived from schemas)
export type {
  StatName,
  WeaponType,
  WeaponData,
  AttackSpeedEntry,
  AttackSpeedData,
  MWEntry,
  MWData,
  SkillEntry,
  MixedRotationComponent,
  MixedRotation,
  ClassSkillData,
  CharacterBuild,
} from './types.js';

// Tier ordering
export { TIER_ORDER, compareTiers } from './types.js';

// Damage calculation
export {
  calculateDamageRange,
  calculateThrowingStarRange,
  calculateMagicDamageRange,
  calculateAdjustedRange,
  calculateRangeCap,
  getWeaponMultiplier,
  TMA_CAP,
  type DamageRange,
} from './damage.js';

// Buff calculation
export {
  applyMW,
  getMWMultiplier,
  calculateEcho,
  calculateMageEcho,
  calculateTotalAttack,
  calculateTotalStats,
} from './buffs.js';

// Attack speed
export {
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
} from './attack-speed.js';

// DPS
export { calculateSkillDps, type DpsResult } from './dps.js';

// Knockback
export {
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  DEFAULT_KB_RECOVERY,
  CHANNEL_KB_RECOVERY,
} from './knockback.js';

// Marginal gains
export { calculateMarginalGains, type MarginalGain } from './marginal.js';

// Build-level DPS
export { calculateBuildDps, type SkillDpsRow, type BuildDpsResult } from './build-dps.js';
