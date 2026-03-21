import type { ComparisonResult, DeltaEntry, ScenarioResult } from '../proposals/types.js';
import {
  formatNumber,
  formatChange,
  formatPercent,
  formatRank,
  formatCapLoss,
  sortDeltas,
  sortByDps,
  groupDeltasByScenario,
  groupResultsByScenario,
} from './utils.js';
import type { BaselineReportOptions } from './markdown.js';

export function escapeBBCode(value: string): string {
  return value.replace(/\[/g, '\uFF3B').replace(/\]/g, '\uFF3D');
}

/**
 * Render a ComparisonResult as BBCode for royals.ms forums (Xenforo).
 * Uses monospaced [code] blocks with aligned columns for broad compatibility.
 */
export function renderComparisonBBCode(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push(`[b]Proposal: ${escapeBBCode(result.proposal.name)}[/b]`);
  if (result.proposal.author) {
    lines.push(`[i]Author: ${escapeBBCode(result.proposal.author)}[/i]`);
  }
  if (result.proposal.description) {
    lines.push(`[i]${escapeBBCode(result.proposal.description)}[/i]`);
  }
  lines.push('');

  // Changes summary
  lines.push('[b]Changes:[/b]');
  for (const change of result.proposal.changes) {
    const fromStr = change.from !== undefined ? ` (was ${change.from})` : '';
    lines.push(`  ${escapeBBCode(change.target)}.${change.field}: [b]${change.to}[/b]${fromStr}`);
  }
  lines.push('');

  // Group deltas by scenario
  const groups = groupDeltasByScenario(result.deltas);

  for (const group of groups) {
    lines.push(`[b]${escapeBBCode(group.scenario)}[/b]`);
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
export function renderBaselineBBCode(
  results: ScenarioResult[],
  options?: BaselineReportOptions,
): string {
  const lines: string[] = [];
  const showCapLoss = options?.showCapLoss ?? true;

  lines.push('[b]DPS Rankings[/b]');
  lines.push('');

  const groups = groupResultsByScenario(results);

  for (const group of groups) {
    lines.push(`[b]${escapeBBCode(group.scenario)}[/b]`);
    lines.push('[code]');
    renderBaselineCodeTable(lines, group.results, showCapLoss);
    lines.push('[/code]');
    lines.push('');
  }

  return lines.join('\n');
}

interface ColumnDef {
  header: string;
  align: 'left' | 'right';
  minWidth: number;
}

function renderAlignedTable(
  lines: string[],
  columns: ColumnDef[],
  rows: string[][],
): void {
  const widths = columns.map((col, i) =>
    Math.max(col.minWidth, col.header.length, ...rows.map((r) => r[i].length)),
  );

  const header = columns
    .map((col, i) =>
      col.align === 'right'
        ? col.header.padStart(widths[i])
        : col.header.padEnd(widths[i]),
    )
    .join('  ');
  lines.push(header);
  lines.push('-'.repeat(header.length));

  for (const row of rows) {
    lines.push(
      columns
        .map((col, i) =>
          col.align === 'right'
            ? row[i].padStart(widths[i])
            : row[i].padEnd(widths[i]),
        )
        .join('  '),
    );
  }
}

function renderCodeTable(lines: string[], deltas: DeltaEntry[]): void {
  const sorted = sortDeltas(deltas);
  const hasRanks = sorted.some((d) => d.rankBefore != null);

  const rows = sorted.map((d) => {
    const cells = [
      ...(hasRanks ? [formatRank(d.rankBefore, d.rankAfter)] : []),
      d.className,
      d.skillName,
      formatNumber(d.before),
      formatNumber(d.after),
      formatChange(d.change),
      formatPercent(d.changePercent),
    ];
    return cells;
  });

  const columns: ColumnDef[] = [
    ...(hasRanks ? [{ header: 'Rank', align: 'left' as const, minWidth: 4 }] : []),
    { header: 'Class', align: 'left', minWidth: 5 },
    { header: 'Skill', align: 'left', minWidth: 5 },
    { header: 'Before', align: 'right', minWidth: 6 },
    { header: 'After', align: 'right', minWidth: 5 },
    { header: 'Change', align: 'right', minWidth: 6 },
    { header: '%', align: 'right', minWidth: 5 },
  ];

  renderAlignedTable(lines, columns, rows);
}

function renderBaselineCodeTable(
  lines: string[],
  results: ScenarioResult[],
  showCapLoss: boolean,
): void {
  const sorted = sortByDps(results);

  const rows = sorted.map((r, i) => [
    String(i + 1),
    r.className,
    r.skillName,
    formatNumber(r.dps.dps),
    ...(showCapLoss ? [formatCapLoss(r.dps.capLossPercent)] : []),
  ]);

  const columns: ColumnDef[] = [
    { header: '#', align: 'right', minWidth: 1 },
    { header: 'Class', align: 'left', minWidth: 5 },
    { header: 'Skill', align: 'left', minWidth: 5 },
    { header: 'DPS', align: 'right', minWidth: 3 },
    ...(showCapLoss ? [{ header: 'Cap Loss', align: 'right' as const, minWidth: 8 }] : []),
  ];

  renderAlignedTable(lines, columns, rows);
}
