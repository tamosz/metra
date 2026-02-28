/** Summary statistics for a (scenario, tier) group. */
export interface GroupSummary {
  scenario: string;
  tier: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  /** Ratio of highest to lowest DPS. */
  spread: number;
  count: number;
}

/** A skill flagged as a statistical outlier within its group. */
export interface OutlierEntry {
  className: string;
  skillName: string;
  scenario: string;
  tier: string;
  dps: number;
  /** Signed standard deviations from group mean. */
  deviations: number;
  direction: 'over' | 'under';
}

/** A skill with unusual high/low tier DPS scaling. */
export interface TierSensitivity {
  className: string;
  skillName: string;
  scenario: string;
  highDps: number;
  lowDps: number;
  /** high / low DPS ratio. */
  ratio: number;
  /** Median ratio across all skills in the scenario. */
  medianRatio: number;
  /** ratio - medianRatio. */
  deviation: number;
}

/** Full balance audit result. */
export interface BalanceAudit {
  groups: GroupSummary[];
  outliers: OutlierEntry[];
  tierSensitivities: TierSensitivity[];
}
