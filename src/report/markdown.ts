import type { ComparisonResult, DeltaEntry } from '../proposals/types.js';

/**
 * Format a number with thousands separators.
 */
function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Format a change value with +/- prefix.
 */
function formatChange(n: number): string {
  const prefix = n > 0 ? '+' : '';
  return prefix + formatNumber(n);
}

/**
 * Format a percentage with +/- prefix and one decimal.
 */
function formatPercent(n: number): string {
  const prefix = n > 0 ? '+' : '';
  return prefix + n.toFixed(1) + '%';
}

/**
 * Render a ComparisonResult as a Markdown report.
 */
export function renderComparisonReport(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push(`# Proposal: ${result.proposal.name}`);
  lines.push('');
  if (result.proposal.author) {
    lines.push(`**Author:** ${result.proposal.author}`);
  }
  if (result.proposal.description) {
    lines.push(`**Description:** ${result.proposal.description}`);
  }
  lines.push('');

  // Changes summary
  lines.push('## Changes');
  lines.push('');
  for (const change of result.proposal.changes) {
    const fromStr = change.from !== undefined ? ` (was ${change.from})` : '';
    lines.push(`- \`${change.target}.${change.field}\`: **${change.to}**${fromStr}`);
  }
  lines.push('');

  // DPS comparison table
  lines.push('## DPS Comparison');
  lines.push('');
  lines.push(
    '| Class | Skill | Tier | Before | After | Change | % |'
  );
  lines.push(
    '|-------|-------|------|-------:|------:|-------:|--:|'
  );

  const sorted = sortDeltas(result.deltas);
  for (const d of sorted) {
    const row = [
      d.className,
      d.skillName,
      capitalize(d.tier),
      formatNumber(d.before),
      formatNumber(d.after),
      formatChange(d.change),
      formatPercent(d.changePercent),
    ];
    lines.push('| ' + row.join(' | ') + ' |');
  }

  lines.push('');
  return lines.join('\n');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Sort deltas: changed entries first (by absolute % desc), then unchanged.
 * Within each group, sort by class then tier.
 */
function sortDeltas(deltas: DeltaEntry[]): DeltaEntry[] {
  return [...deltas].sort((a, b) => {
    const aChanged = a.change !== 0 ? 0 : 1;
    const bChanged = b.change !== 0 ? 0 : 1;
    if (aChanged !== bChanged) return aChanged - bChanged;
    if (aChanged === 0) {
      // Both changed — sort by absolute % descending
      return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    }
    // Both unchanged — sort by class, then tier
    const classCompare = a.className.localeCompare(b.className);
    if (classCompare !== 0) return classCompare;
    return a.tier.localeCompare(b.tier);
  });
}
