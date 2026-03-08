// Public API for the Royals Balance Simulator

// Engine (re-exported from @metra/engine)
export {
  // Schemas
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
  // Functions
  calculateSkillDps,
  calculateDamageRange,
  calculateThrowingStarRange,
  calculateMagicDamageRange,
  calculateAdjustedRange,
  calculateRangeCap,
  getWeaponMultiplier,
  TMA_CAP,
  applyMW,
  getMWMultiplier,
  calculateEcho,
  calculateMageEcho,
  calculateTotalAttack,
  calculateTotalStats,
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  DEFAULT_KB_RECOVERY,
  CHANNEL_KB_RECOVERY,
  calculateMarginalGains,
  calculateBuildDps,
  TIER_ORDER,
  compareTiers,
  // Types
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
  type DpsResult,
  type DamageRange,
  type MarginalGain,
  type SkillDpsRow,
  type BuildDpsResult,
} from '@metra/engine';

// Data loading
export {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
  loadGearTemplate,
  discoverClassesAndTiers,
  type DiscoveryResult,
} from './data/loader.js';

// Data utilities
export { computeGearTotals, type GearTotals } from './data/gear-utils.js';
export { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from './data/gear-merge.js';

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

// Report
export { renderComparisonReport, renderBaselineReport, type BaselineReportOptions } from './report/markdown.js';
export { renderAsciiChart } from './report/ascii-chart.js';
export { renderComparisonBBCode, renderBaselineBBCode } from './report/bbcode.js';

// Audit
export { analyzeBalance } from './audit/analyze.js';
export { formatAuditReport } from './audit/format.js';
export type { BalanceAudit, OutlierEntry, TierSensitivity, GroupSummary } from './audit/types.js';
