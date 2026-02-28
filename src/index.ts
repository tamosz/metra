// Public API for the MapleRoyals Balance Simulator

// Engine
export { calculateSkillDps, type DpsResult } from './engine/dps.js';
export {
  calculateDamageRange,
  calculateAdjustedRange,
  calculateRangeCap,
  getWeaponMultiplier,
  type DamageRange,
} from './engine/damage.js';
export {
  calculateTotalAttack,
  calculateTotalStats,
  applyMapleWarrior,
  calculateEcho,
} from './engine/buffs.js';
export {
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
} from './engine/attack-speed.js';

// Data loading
export {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  loadClassSkills,
  loadGearTemplate,
} from './data/loader.js';

// Types
export type {
  WeaponData,
  WeaponType,
  AttackSpeedData,
  AttackSpeedEntry,
  MapleWarriorData,
  MapleWarriorEntry,
  ClassSkillData,
  SkillEntry,
  CharacterBuild,
} from './data/types.js';

// Proposal system
export { applyProposal, skillSlug } from './proposals/apply.js';
export { compareProposal } from './proposals/compare.js';
export { runSimulation, type SimulationConfig, type GearTemplateMap } from './proposals/simulate.js';
export type {
  Proposal,
  ProposalChange,
  ScenarioResult,
  DeltaEntry,
  ComparisonResult,
} from './proposals/types.js';

// Report
export { renderComparisonReport } from './report/markdown.js';
