// Browser-safe entry point.
// Now that the engine is its own package (@metra/engine), this file
// simply re-exports everything from there plus local browser-safe modules.
// Kept for backward compatibility — new code should import @metra/engine directly.

export * from '@metra/engine';

// Data utilities (pure functions, no fs)
export { computeGearTotals, type GearTotals } from './data/gear-utils.js';
export { mergeGearTemplate, type TierDefaults, type TierOverride } from './data/gear-merge.js';
export { computeBuild, type ClassBase } from './data/gear-compute.js';

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

// Report (renderers are pure functions, no fs)
export { renderComparisonReport, renderBaselineReport, type BaselineReportOptions } from './report/markdown.js';
export { renderAsciiChart } from './report/ascii-chart.js';
export { renderComparisonBBCode, renderBaselineBBCode } from './report/bbcode.js';
