// Browser-safe entry point — everything except fs-based data loaders.

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
  applyMW,
  calculateEcho,
} from './engine/buffs.js';
export {
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
} from './engine/attack-speed.js';

// Constants
export { TIER_ORDER, compareTiers } from './data/types.js';

// Types
export type {
  WeaponData,
  WeaponType,
  AttackSpeedData,
  AttackSpeedEntry,
  MWData,
  MWEntry,
  ClassSkillData,
  SkillEntry,
  CharacterBuild,
} from './data/types.js';

// Proposal system
export { applyProposal, skillSlug } from './proposals/apply.js';
export { compareProposal } from './proposals/compare.js';
export { runSimulation, type SimulationConfig, type GearTemplateMap } from './proposals/simulate.js';
export { validateProposal, ProposalValidationError } from './proposals/validate.js';
export type {
  Proposal,
  ProposalChange,
  ScenarioConfig,
  ScenarioResult,
  DeltaEntry,
  ComparisonResult,
} from './proposals/types.js';

// Scenarios
export { DEFAULT_SCENARIOS } from './scenarios.js';

// Report (renderers are pure functions, no fs)
export { renderComparisonReport, renderBaselineReport } from './report/markdown.js';
export { renderAsciiChart } from './report/ascii-chart.js';
export { renderComparisonBBCode, renderBaselineBBCode } from './report/bbcode.js';
