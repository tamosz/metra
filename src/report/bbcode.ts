import type { ComparisonResult, DeltaEntry, ScenarioResult } from '../proposals/types.js';
import {
  formatNumber,
  formatChange,
  formatPercent,
  formatRank,
  capitalize,
  sortDeltas,
  groupDeltasByScenario,
  groupResultsByScenario,
} from './utils.js';

/**
 * Render a ComparisonResult as BBCode for royals.ms forums (Xenforo).
 * Uses monospaced [code] blocks with aligned columns for broad compatibility.
 */
export function renderComparisonBBCode(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push(`[b]Proposal: ${result.proposal.name}[/b]`);
  if (result.proposal.author) {
    lines.push(`[i]Author: ${result.proposal.author}[/i]`);
  }
  if (result.proposal.description) {
    lines.push(`[i]${result.proposal.description}[/i]`);
  }
  lines.push('');

  // Changes summary
  lines.push('[b]Changes:[/b]');
  for (const change of result.proposal.changes) {
    const fromStr = change.from !== undefined ? ` (was ${change.from})` : '';
    lines.push(`  ${change.target}.${change.field}: [b]${change.to}[/b]${fromStr}`);
  }
  lines.push('');

  // Group deltas by scenario
  const groups = groupDeltasByScenario(result.deltas);

  for (const group of groups) {
    lines.push(`[b]${group.scenario}[/b]`);
    lines.push('[code]');
    renderCodeTable(lines, group.deltas);
    lines.push('[/code]');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Render a baseline DPS ranking as BBCode.
 */
export function renderBaselineBBCode(results: ScenarioResult[]): string {
  const lines: string[] = [];

  lines.push('[b]DPS Rankings[/b]');
  lines.push('');

  const groups = groupResultsByScenario(results);

  for (const group of groups) {
    lines.push(`[b]${group.scenario}[/b]`);
    lines.push('[code]');
    renderBaselineCodeTable(lines, group.results);
    lines.push('[/code]');
    lines.push('');
  }

  return lines.join('\n');
}

function renderCodeTable(lines: string[], deltas: DeltaEntry[]): void {
  const sorted = sortDeltas(deltas);
  const hasRanks = sorted.some((d) => d.rankBefore != null);

  // Compute column widths
  const rows = sorted.map((d) => {
    const rank = hasRanks ? formatRank(d.rankBefore, d.rankAfter) : '';
    return {
      rank,
      className: d.className,
      skillName: d.skillName,
      tier: capitalize(d.tier),
      before: formatNumber(d.before),
      after: formatNumber(d.after),
      change: formatChange(d.change),
      percent: formatPercent(d.changePercent),
    };
  });

  const cols = {
    rank: hasRanks ? Math.max(4, ...rows.map((r) => r.rank.length)) : 0,
    className: Math.max(5, ...rows.map((r) => r.className.length)),
    skillName: Math.max(5, ...rows.map((r) => r.skillName.length)),
    tier: Math.max(4, ...rows.map((r) => r.tier.length)),
    before: Math.max(6, ...rows.map((r) => r.before.length)),
    after: Math.max(5, ...rows.map((r) => r.after.length)),
    change: Math.max(6, ...rows.map((r) => r.change.length)),
    percent: Math.max(5, ...rows.map((r) => r.percent.length)),
  };

  // Header
  const headerParts: string[] = [];
  if (hasRanks) headerParts.push('Rank'.padEnd(cols.rank));
  headerParts.push(
    'Class'.padEnd(cols.className),
    'Skill'.padEnd(cols.skillName),
    'Tier'.padEnd(cols.tier),
    'Before'.padStart(cols.before),
    'After'.padStart(cols.after),
    'Change'.padStart(cols.change),
    '%'.padStart(cols.percent),
  );
  lines.push(headerParts.join('  '));
  lines.push('-'.repeat(headerParts.join('  ').length));

  for (const row of rows) {
    const parts: string[] = [];
    if (hasRanks) parts.push(row.rank.padEnd(cols.rank));
    parts.push(
      row.className.padEnd(cols.className),
      row.skillName.padEnd(cols.skillName),
      row.tier.padEnd(cols.tier),
      row.before.padStart(cols.before),
      row.after.padStart(cols.after),
      row.change.padStart(cols.change),
      row.percent.padStart(cols.percent),
    );
    lines.push(parts.join('  '));
  }
}

function renderBaselineCodeTable(lines: string[], results: ScenarioResult[]): void {
  const sorted = [...results].sort((a, b) => b.dps.dps - a.dps.dps);

  const rows = sorted.map((r, i) => ({
    rank: String(i + 1),
    className: r.className,
    skillName: r.skillName,
    tier: capitalize(r.tier),
    dps: formatNumber(r.dps.dps),
  }));

  const cols = {
    rank: Math.max(1, ...rows.map((r) => r.rank.length)),
    className: Math.max(5, ...rows.map((r) => r.className.length)),
    skillName: Math.max(5, ...rows.map((r) => r.skillName.length)),
    tier: Math.max(4, ...rows.map((r) => r.tier.length)),
    dps: Math.max(3, ...rows.map((r) => r.dps.length)),
  };

  const header = [
    '#'.padStart(cols.rank),
    'Class'.padEnd(cols.className),
    'Skill'.padEnd(cols.skillName),
    'Tier'.padEnd(cols.tier),
    'DPS'.padStart(cols.dps),
  ].join('  ');
  lines.push(header);
  lines.push('-'.repeat(header.length));

  for (const row of rows) {
    lines.push([
      row.rank.padStart(cols.rank),
      row.className.padEnd(cols.className),
      row.skillName.padEnd(cols.skillName),
      row.tier.padEnd(cols.tier),
      row.dps.padStart(cols.dps),
    ].join('  '));
  }
}
