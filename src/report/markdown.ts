import type { ComparisonResult, DeltaEntry, ScenarioResult } from '../proposals/types.js';
import {
  formatNumber,
  formatChange,
  formatPercent,
  formatRank,
  formatCapLoss,
  sortDeltas,
  groupDeltasByScenario,
  groupResultsByScenario,
} from './utils.js';

export function escapePipe(value: string): string {
  return value.replace(/\|/g, '\\|');
}

export interface BaselineReportOptions {
  showCapLoss?: boolean;
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
 * Render a sorted DPS comparison table into the lines array.
 */
function renderDeltaTable(lines: string[], deltas: DeltaEntry[]): void {
  const hasRanks = deltas.some((d) => d.rankBefore != null);

  if (hasRanks) {
    lines.push(
      '| Rank | Class | Skill | Before | After | Change | % |'
    );
    lines.push(
      '|------|-------|-------|-------:|------:|-------:|--:|'
    );
  } else {
    lines.push(
      '| Class | Skill | Before | After | Change | % |'
    );
    lines.push(
      '|-------|-------|-------:|------:|-------:|--:|'
    );
  }

  const sorted = sortDeltas(deltas);
  for (const d of sorted) {
    const row: string[] = [];
    if (hasRanks) {
      row.push(formatRank(d.rankBefore, d.rankAfter));
    }
    row.push(
      escapePipe(d.className),
      escapePipe(d.skillName),
      formatNumber(d.before),
      formatNumber(d.after),
      formatChange(d.change),
      formatPercent(d.changePercent),
    );
    lines.push('| ' + row.join(' | ') + ' |');
  }
}

/**
 * Render a baseline DPS ranking report (no proposal).
 * Groups by scenario, sorts by DPS descending, adds rank column.
 */
export function renderBaselineReport(
  results: ScenarioResult[],
  options?: BaselineReportOptions,
): string {
  const lines: string[] = [];
  const showCapLoss = options?.showCapLoss ?? true;

  lines.push('# DPS Rankings');
  lines.push('');

  const scenarioGroups = groupResultsByScenario(results);

  for (const group of scenarioGroups) {
    lines.push(`## ${group.scenario}`);
    lines.push('');
    renderBaselineTable(lines, group.results, showCapLoss);
    lines.push('');
  }

  return lines.join('\n');
}

function renderBaselineTable(
  lines: string[],
  results: ScenarioResult[],
  showCapLoss: boolean,
): void {
  if (showCapLoss) {
    lines.push('| Rank | Class | Skill | DPS | Cap Loss |');
    lines.push('|-----:|-------|-------|----:|---------:|');
  } else {
    lines.push('| Rank | Class | Skill | DPS |');
    lines.push('|-----:|-------|-------|----:|');
  }

  const sorted = [...results].sort((a, b) => b.dps.dps - a.dps.dps);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const row = [
      String(i + 1),
      escapePipe(r.className),
      escapePipe(r.skillName),
      formatNumber(r.dps.dps),
    ];
    if (showCapLoss) {
      row.push(formatCapLoss(r.dps.capLossPercent));
    }
    lines.push('| ' + row.join(' | ') + ' |');
  }
}
