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
    const bar = '\u2588'.repeat(barLength);
    const label = entry.label.padEnd(maxLabelLength);
    const valueStr = formatChartValue(entry.value);
    lines.push(`  ${label}  ${bar} ${valueStr}`);
  }

  return lines.join('\n') + '\n';
}

function formatChartValue(n: number): string {
  const str = Math.round(n).toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
