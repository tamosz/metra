import type { CharacterBuild, DpsResult } from '@metra/engine';

/** A single change within a proposal. */
export interface ProposalChange {
  /** Target skill in "className.skill-slug" format, e.g. "hero.brandish-sword". */
  target: string;
  /** Field to change on the SkillEntry, e.g. "basePower". */
  field: string;
  /** Optional: expected current value (throws on mismatch to catch stale proposals). */
  from?: number | string;
  /** New value to set. */
  to: number | string;
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
    'mwLevel' | 'attackPotion' | 'shadowPartner'>>;
  /** Physical Damage Reduction (0–1). Applied as a multiplier: effectiveDps = dps * (1 - pdr). */
  pdr?: number;
  /** Element → damage multiplier map. Skills with a matching element get multiplied (default 1.0). */
  elementModifiers?: Record<string, number>;
  /** Number of mobs available. Training DPS = singleTargetDps × min(skill.maxTargets, targetCount). */
  targetCount?: number;
  /** Boss attack interval in seconds. KB model only activates when set. */
  bossAttackInterval?: number;
  /** Boss accuracy value. Default: very high (dodge ≈ 0). */
  bossAccuracy?: number;
}

/** DPS result for a single class/skill/tier combination. */
export interface ScenarioResult {
  className: string;
  skillName: string;
  tier: string;
  scenario: string;
  dps: DpsResult;
  /** Tooltip description for mixed rotation entries. */
  description?: string;
  /** If false, result is only shown when "show all skills" is toggled on. Default true. */
  headline?: boolean;
  /** Stable key for before/after comparison. Used by elementVariantGroup so the key doesn't
   *  change when a different variant wins. Defaults to skillName if not set. */
  comparisonKey?: string;
  /** True for combo group aggregates and mixed rotations (formula breakdown is not meaningful). */
  isComposite?: boolean;
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
