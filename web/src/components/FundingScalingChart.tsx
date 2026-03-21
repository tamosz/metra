import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FundingScalingData } from '../hooks/useFundingScaling.js';
import { getClassColor } from '../utils/class-colors.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';

interface FundingScalingChartProps {
  data: FundingScalingData;
}

export function FundingScalingChart({ data }: FundingScalingChartProps) {
  const isMobile = useIsMobile();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { points, lines } = data;

  // Add 8% padding to Y domain and snap to 1000s
  const yDomain = useMemo((): [number, number] => {
    const [dataMin, dataMax] = data.yDomain;
    if (dataMax <= dataMin) return [0, 1];
    const padding = (dataMax - dataMin) * 0.08;
    return [
      Math.max(0, Math.floor((dataMin - padding) / 1000) * 1000),
      Math.ceil((dataMax + padding) / 1000) * 1000,
    ];
  }, [data.yDomain]);

  const chartHeight = isMobile ? 400 : 600;
  const rightMargin = isMobile ? 100 : 140;

  // Label y-offsets to avoid overlap at the rightmost point
  const labelOffsets = useMemo(() => {
    if (points.length === 0) return new Map<string, number>();
    const lastPoint = points[points.length - 1];

    const items = lines
      .map((line) => ({
        key: line.key,
        dps: (lastPoint[line.key] as number) ?? 0,
      }))
      .sort((a, b) => b.dps - a.dps);

    const marginVertical = 16 + 16; // top + bottom from LineChart margin
    const usableHeight = chartHeight - marginVertical;
    const dpsRange = yDomain[1] - yDomain[0];
    if (dpsRange === 0) return new Map<string, number>();
    const dpsPerPixel = dpsRange / usableHeight;
    const minGapDps = (isMobile ? 22 : 24) * dpsPerPixel;

    // Pass 1: push labels down when too close
    const adjusted = new Map<string, number>();
    let lastAdj = Infinity;
    for (const item of items) {
      let adj = item.dps;
      if (lastAdj - adj < minGapDps) {
        adj = lastAdj - minGapDps;
      }
      adjusted.set(item.key, adj);
      lastAdj = adj;
    }

    // Pass 2: push labels up if they fell below chart floor
    const chartFloorDps = yDomain[0];
    let prevAdj = chartFloorDps;
    for (let i = items.length - 1; i >= 0; i--) {
      let adj = adjusted.get(items[i].key)!;
      if (adj < prevAdj) {
        adj = prevAdj;
      }
      adjusted.set(items[i].key, adj);
      prevAdj = adj + minGapDps;
    }

    const offsets = new Map<string, number>();
    for (const item of items) {
      const delta = item.dps - adjusted.get(item.key)!;
      offsets.set(item.key, delta / dpsPerPixel);
    }
    return offsets;
  }, [points, lines, chartHeight, yDomain, isMobile]);

  if (lines.length === 0) {
    return <div className="py-10 text-center text-text-dim">No data</div>;
  }

  return (
    <div data-testid="funding-scaling-chart">
      <p className="mb-2 px-1 text-xs text-text-muted">
        All build parameters (base stats, weapon attack, gear stats) scaled
        uniformly from 10–100% of their max values. Shows how each class scales
        with overall character power, not a specific funding scenario.
      </p>
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer>
          <LineChart
            data={points}
            margin={{ top: 16, right: rightMargin, left: 0, bottom: 16 }}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <XAxis
              dataKey="funding"
              type="number"
              domain={[10, 100]}
              ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              tickFormatter={(v: number) => `${v}%`}
              label={{
                value: 'Gear Stats (% of max)',
                position: 'insideBottom',
                offset: -8,
                fill: colors.textMuted,
                fontSize: 12,
              }}
              axisLine={{ stroke: colors.border }}
              tickLine={false}
              tick={{ fill: colors.textSecondary, fontSize: 12 }}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fill: colors.textFaint, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const sorted = [...payload].sort(
                  (a, b) => ((b.value as number) ?? 0) - ((a.value as number) ?? 0),
                );
                return (
                  <div className="max-h-80 overflow-y-auto rounded-md border border-border-active bg-bg-surface p-3 text-xs">
                    <div className="mb-2 font-semibold text-text-secondary">
                      {label}% of max
                    </div>
                    {sorted.map((entry) => (
                      <div
                        key={entry.dataKey as string}
                        className="flex items-center gap-2 py-0.5"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-text-secondary">
                          {entry.name}
                        </span>
                        <span className="ml-auto tabular-nums">
                          {(entry.value as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            {lines.map((line) => {
              const isHovered = hoveredKey === line.key;
              const isDimmed = hoveredKey != null && !isHovered;
              return (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.key}
                  stroke={getClassColor(line.className)}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeOpacity={isDimmed ? 0.12 : 0.85}
                  dot={{
                    fill: getClassColor(line.className),
                    r: isHovered ? 5 : 3,
                    fillOpacity: isDimmed ? 0.12 : 1,
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 5,
                    fill: getClassColor(line.className),
                    strokeWidth: 0,
                    onMouseEnter: () => setHoveredKey(line.key),
                  }}
                  isAnimationActive={false}
                  connectNulls
                  label={(props: {
                    x?: string | number;
                    y?: string | number;
                    index?: number;
                  }) => {
                    const { x, y, index } = props;
                    if (
                      index !== points.length - 1 ||
                      typeof x !== 'number' ||
                      typeof y !== 'number'
                    )
                      return <text />;
                    const offset = labelOffsets.get(line.key) ?? 0;
                    return (
                      <g
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          setHoveredKey(
                            hoveredKey === line.key ? null : line.key,
                          )
                        }
                        onMouseEnter={() => setHoveredKey(line.key)}
                        opacity={isDimmed ? 0.3 : 1}
                      >
                        <text
                          x={x + 10}
                          y={y + offset - 5}
                          textAnchor="start"
                          fill={
                            isDimmed
                              ? colors.textFaint
                              : getClassColor(line.className)
                          }
                          fontSize={isMobile ? 9 : 11}
                        >
                          {line.className}
                        </text>
                        <text
                          x={x + 10}
                          y={y + offset + 6}
                          textAnchor="start"
                          fill={colors.textFaint}
                          fontSize={isMobile ? 7 : 9}
                        >
                          {line.skillName}
                        </text>
                      </g>
                    );
                  }}
                  onMouseEnter={() => setHoveredKey(line.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1"
        onMouseLeave={() => setHoveredKey(null)}
      >
        {lines.map((line) => {
          const isHovered = hoveredKey === line.key;
          const isDimmed = hoveredKey != null && !isHovered;
          return (
            <button
              key={line.key}
              type="button"
              className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-xs transition-opacity hover:bg-bg-surface"
              style={{ opacity: isDimmed ? 0.25 : 1 }}
              onMouseEnter={() => setHoveredKey(line.key)}
              onClick={() =>
                setHoveredKey(hoveredKey === line.key ? null : line.key)
              }
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: getClassColor(line.className) }}
              />
              <span className="text-text-secondary">{line.className}</span>
              <span className="text-text-faint text-[10px]">
                {line.skillName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
