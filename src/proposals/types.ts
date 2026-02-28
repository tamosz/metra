import type { DpsResult } from '../engine/dps.js';

/** A single change within a proposal. */
export interface ProposalChange {
  /** Target skill in "className.skill-slug" format, e.g. "hero.brandish-sword". */
  target: string;
  /** Field to change on the SkillEntry, e.g. "basePower". */
  field: string;
  /** Optional: expected current value (throws on mismatch to catch stale proposals). */
  from?: number;
  /** New value to set. */
  to: number;
}

/** A balance change proposal. */
export interface Proposal {
  name: string;
  author: string;
  description?: string;
  changes: ProposalChange[];
}

/** DPS result for a single class/skill/tier combination. */
export interface ScenarioResult {
  className: string;
  skillName: string;
  tier: string;
  dps: DpsResult;
}

/** Delta between before and after for a single scenario. */
export interface DeltaEntry {
  className: string;
  skillName: string;
  tier: string;
  before: number;
  after: number;
  change: number;
  changePercent: number;
}

/** Full comparison result for a proposal. */
export interface ComparisonResult {
  proposal: Proposal;
  before: ScenarioResult[];
  after: ScenarioResult[];
  deltas: DeltaEntry[];
}
