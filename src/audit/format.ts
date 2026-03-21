import type { BalanceAudit } from './types.js';
import { formatNumber } from '../report/utils.js';

const SIGMA = '\u03C3';
const INFINITY_SYM = '\u221E';

/**
 * Render a BalanceAudit as a Markdown report.
 */
export function formatAuditReport(audit: BalanceAudit): string {
  const lines: string[] = [];

  lines.push('# Balance Audit');
  lines.push('');

  // Outliers
  lines.push('## Outliers');
  lines.push('');
  if (audit.outliers.length === 0) {
    lines.push(`No outliers detected (threshold: 1.5${SIGMA}).`);
  } else {
    lines.push('| Class | Skill | Scenario | DPS | Deviation |');
    lines.push('|-------|-------|----------|----:|----------:|');
    for (const o of audit.outliers) {
      const sign = o.deviations > 0 ? '+' : '';
      const dev = `${sign}${o.deviations.toFixed(1)}${SIGMA}`;
      lines.push(`| ${o.className} | ${o.skillName} | ${o.scenario} | ${formatNumber(o.dps)} | ${dev} |`);
    }
  }
  lines.push('');

  // Group Summaries
  lines.push('## Group Summaries');
  lines.push('');
  lines.push('| Scenario | Mean | Std Dev | Min | Max | Spread | Count |');
  lines.push('|----------|-----:|--------:|----:|----:|-------:|------:|');
  for (const g of audit.groups) {
    lines.push(`| ${g.scenario} | ${formatNumber(g.mean)} | ${formatNumber(g.stdDev)} | ${formatNumber(g.min)} | ${formatNumber(g.max)} | ${g.spread === Infinity ? INFINITY_SYM : g.spread.toFixed(2) + 'x'} | ${g.count} |`);
  }
  lines.push('');

  return lines.join('\n');
}
