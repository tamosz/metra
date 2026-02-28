import type { ComparisonResult, DeltaEntry } from '../proposals/types.js';

/**
 * Format a number with thousands separators (locale-independent).
 */
function formatNumber(n: number): string {
  const str = Math.round(n).toString();
  const negative = str.startsWith('-');
  const digits = negative ? str.slice(1) : str;
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? '-' + withCommas : withCommas;
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
 *
 * When multiple scenarios are present, renders a separate table section per scenario.
 * When only one scenario exists, output is identical to the original single-table format.
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

  // Group deltas by scenario, preserving order
  const scenarioGroups = groupDeltasByScenario(result.deltas);
  const multiScenario = scenarioGroups.length > 1;

  if (multiScenario) {
    for (const group of scenarioGroups) {
      lines.push(`## ${group.scenario}`);
      lines.push('');
      renderDeltaTable(lines, group.deltas);
      lines.push('');
    }
  } else {
    // Single scenario: backward-compatible output (no scenario name in heading)
    lines.push('## DPS Comparison');
    lines.push('');
    const deltas = scenarioGroups.length > 0 ? scenarioGroups[0].deltas : result.deltas;
    renderDeltaTable(lines, deltas);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Group deltas by scenario name, preserving insertion order.
 */
function groupDeltasByScenario(
  deltas: DeltaEntry[]
): { scenario: string; deltas: DeltaEntry[] }[] {
  const groups: { scenario: string; deltas: DeltaEntry[] }[] = [];
  const indexMap = new Map<string, number>();

  for (const d of deltas) {
    const scenario = d.scenario ?? 'Buffed';
    if (!indexMap.has(scenario)) {
      indexMap.set(scenario, groups.length);
      groups.push({ scenario, deltas: [] });
    }
    groups[indexMap.get(scenario)!].deltas.push(d);
  }

  return groups;
}

/**
 * Render a sorted DPS comparison table into the lines array.
 */
function renderDeltaTable(lines: string[], deltas: DeltaEntry[]): void {
  lines.push(
    '| Class | Skill | Tier | Before | After | Change | % |'
  );
  lines.push(
    '|-------|-------|------|-------:|------:|-------:|--:|'
  );

  const sorted = sortDeltas(deltas);
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
