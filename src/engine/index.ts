export {
  calculateDamageRange,
  calculateThrowingStarRange,
  calculateMagicDamageRange,
  calculateAdjustedRange,
  calculateRangeCap,
  getWeaponMultiplier,
  type DamageRange,
} from './damage.js';

export {
  applyMW,
  getMWMultiplier,
  calculateEcho,
  calculateMageEcho,
  calculateTotalAttack,
  calculateTotalStats,
} from './buffs.js';

export {
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
} from './attack-speed.js';

export { calculateSkillDps, type DpsResult } from './dps.js';
