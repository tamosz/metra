import type { CharacterBuild } from '../data/types.js';
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
  // TODO: widen to `number | string` if string fields (e.g. name, weaponType) need changing
  to: number;
}

/** A balance change proposal. */
export interface Proposal {
  name: string;
  author: string;
  description?: string;
  changes: ProposalChange[];
}

/**
 * A scenario defines conditions under which to evaluate DPS.
 * Overrides are applied to each CharacterBuild before simulation.
 */
export interface ScenarioConfig {
  name: string;
  overrides?: Partial<Pick<CharacterBuild,
    'sharpEyes' | 'echoActive' | 'speedInfusion' |
    'mapleWarriorLevel' | 'attackPotion' | 'shadowPartner'>>;
  /** Physical Damage Reduction (0–1). Applied as a multiplier: effectiveDps = dps * (1 - pdr). */
  pdr?: number;
}

/** DPS result for a single class/skill/tier combination. */
export interface ScenarioResult {
  className: string;
  skillName: string;
  tier: string;
  scenario: string;
  dps: DpsResult;
}

/** Delta between before and after for a single scenario. */
export interface DeltaEntry {
  className: string;
  skillName: string;
  tier: string;
  scenario: string;
  before: number;
  after: number;
  change: number;
  changePercent: number;
  /** DPS rank within (scenario, tier) group before the change. */
  rankBefore?: number;
  /** DPS rank within (scenario, tier) group after the change. */
  rankAfter?: number;
}

/** Full comparison result for a proposal. */
export interface ComparisonResult {
  proposal: Proposal;
  before: ScenarioResult[];
  after: ScenarioResult[];
  deltas: DeltaEntry[];
}
