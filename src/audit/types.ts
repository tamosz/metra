/** Summary statistics for a scenario group. */
export interface GroupSummary {
  scenario: string;
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
  dps: number;
  /** Signed standard deviations from group mean. */
  deviations: number;
  direction: 'over' | 'under';
}

/** Full balance audit result. */
export interface BalanceAudit {
  groups: GroupSummary[];
  outliers: OutlierEntry[];
}
