// @metra/engine — public API
// Pure functions for Royals balance simulation. No dependencies.
// No filesystem I/O, no side effects, safe for browser and Node.

// Types and constants
export {
  TIER_ORDER,
  compareTiers,
  type StatName,
  type WeaponType,
  type WeaponData,
  type AttackSpeedEntry,
  type AttackSpeedData,
  type MWEntry,
  type MWData,
  type SkillEntry,
  type MixedRotationComponent,
  type MixedRotation,
  type ClassSkillData,
  type CharacterBuild,
} from './types.js';

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
