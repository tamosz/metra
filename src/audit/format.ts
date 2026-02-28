import type { BalanceAudit } from './types.js';

function formatNumber(n: number): string {
  const str = Math.round(n).toString();
  const negative = str.startsWith('-');
  const digits = negative ? str.slice(1) : str;
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? '-' + withCommas : withCommas;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
    lines.push('No outliers detected (threshold: 1.5\u03C3).');
  } else {
    lines.push('| Class | Skill | Scenario | Tier | DPS | Deviation |');
    lines.push('|-------|-------|----------|------|----:|----------:|');
    for (const o of audit.outliers) {
      const sign = o.deviations > 0 ? '+' : '';
      const dev = `${sign}${o.deviations.toFixed(1)}\u03C3`;
      lines.push(`| ${o.className} | ${o.skillName} | ${o.scenario} | ${capitalize(o.tier)} | ${formatNumber(o.dps)} | ${dev} |`);
    }
  }
  lines.push('');

  // Tier Sensitivity
  lines.push('## Tier Sensitivity');
  lines.push('');
  if (audit.tierSensitivities.length === 0) {
    lines.push('No unusual tier scaling detected.');
  } else {
    lines.push('| Class | Skill | Scenario | High/Low | Median | Deviation |');
    lines.push('|-------|-------|----------|:--------:|:------:|----------:|');
    for (const t of audit.tierSensitivities) {
      const sign = t.deviation > 0 ? '+' : '';
      lines.push(`| ${t.className} | ${t.skillName} | ${t.scenario} | ${t.ratio.toFixed(2)}x | ${t.medianRatio.toFixed(2)}x | ${sign}${t.deviation.toFixed(2)} |`);
    }
  }
  lines.push('');

  // Group Summaries
  lines.push('## Group Summaries');
  lines.push('');
  lines.push('| Scenario | Tier | Mean | Std Dev | Min | Max | Spread | Count |');
  lines.push('|----------|------|-----:|--------:|----:|----:|-------:|------:|');
  for (const g of audit.groups) {
    lines.push(`| ${g.scenario} | ${capitalize(g.tier)} | ${formatNumber(g.mean)} | ${formatNumber(g.stdDev)} | ${formatNumber(g.min)} | ${formatNumber(g.max)} | ${g.spread === Infinity ? '\u221E' : g.spread.toFixed(2) + 'x'} | ${g.count} |`);
  }
  lines.push('');

  return lines.join('\n');
}
