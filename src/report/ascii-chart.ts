import { formatNumber } from './utils.js';

/** Full block character used for bar chart rendering. */
const FULL_BLOCK = '\u2588';

export interface ChartEntry {
  label: string;
  value: number;
}

/**
 * Render a horizontal ASCII bar chart.
 * Entries are sorted by value descending. Bars are normalized to maxWidth.
 */
export function renderAsciiChart(
  entries: ChartEntry[],
  maxWidth: number = 50
): string {
  if (entries.length === 0) return '';

  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const maxValue = sorted[0].value;
  const maxLabelLength = Math.max(...sorted.map((e) => e.label.length));

  const lines: string[] = [];
  for (const entry of sorted) {
    const barLength = maxValue > 0
      ? Math.round((entry.value / maxValue) * maxWidth)
      : 0;
    const bar = FULL_BLOCK.repeat(barLength);
    const label = entry.label.padEnd(maxLabelLength);
    const valueStr = formatNumber(entry.value);
    lines.push(`  ${label}  ${bar} ${valueStr}`);
  }

  return lines.join('\n') + '\n';
}
