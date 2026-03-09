import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ScenarioResult, ComparisonResult } from '@engine/proposals/types.js';
import { getClassColor } from '../utils/class-colors.js';
import { isResultVisible, type SkillGroupId } from '../utils/skill-groups.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';
import { resolveActiveScenario } from '../utils/scenario.js';
import { buildDeltaMap, deltaMapKey } from '../utils/delta-map.js';

interface TierScalingChartProps {
  data: ScenarioResult[];
  capEnabled: boolean;
  activeGroups: Set<SkillGroupId>;
  targetCount: number;
  selectedTier: string;
  editComparison?: ComparisonResult | null;
}

const TIER_ORDER = ['low', 'mid', 'high', 'perfect'];
const TIER_LABELS: Record<string, string> = {
  low: 'Low',
  mid: 'Mid',
  high: 'High',
  perfect: 'Perfect',
};

export function TierScalingChart({ data, capEnabled, activeGroups, targetCount, selectedTier, editComparison }: TierScalingChartProps) {
  const isMobile = useIsMobile();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const deltaMap = useMemo(() => buildDeltaMap(editComparison), [editComparison]);

  // Group results by class+skill across tiers, compute tight Y-axis domain
  const { chartData, lines, yDomain } = useMemo(() => {
    const activeScenario = resolveActiveScenario(data, targetCount);
    const filtered = data.filter((r) => {
      if (r.scenario !== activeScenario) return false;
      return isResultVisible(r, activeGroups);
    });

    // Group by className + skillName
    const groups = new Map<string, Map<string, number>>();
    const classForKey = new Map<string, string>();
    const skillForKey = new Map<string, string>();
    for (const r of filtered) {
      const key = `${r.className} — ${r.skillName}`;
      if (!groups.has(key)) groups.set(key, new Map());
      classForKey.set(key, r.className);
      skillForKey.set(key, r.skillName);
      let dps = Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps);
      if (deltaMap) {
        const delta = deltaMap.get(deltaMapKey(r.className, r.skillName, r.tier, r.scenario));
        const change = delta ? (capEnabled ? delta.change : delta.uncappedChange) : 0;
        if (delta && change !== 0) {
          dps = Math.round(capEnabled ? delta.after : delta.uncappedAfter);
        }
      }
      groups.get(key)!.set(r.tier, dps);
    }

    // Build Recharts data: one object per tier with all lines as keys
    const lineKeys = [...groups.keys()];
    const chartData = TIER_ORDER
      .filter((tier) => filtered.some((r) => r.tier === tier))
      .map((tier) => {
        const point: Record<string, string | number> = { tier: TIER_LABELS[tier] ?? tier };
        for (const key of lineKeys) {
          const dps = groups.get(key)?.get(tier);
          if (dps != null) point[key] = dps;
        }
        return point;
      });

    const lines = lineKeys.map((key) => ({
      key,
      className: classForKey.get(key)!,
      skillName: skillForKey.get(key)!,
    }));

    // Compute tight Y-axis domain from actual data
    const allValues = chartData.flatMap((point) =>
      Object.entries(point)
        .filter(([k]) => k !== 'tier')
        .map(([, v]) => v as number),
    );
    let yDomain: [number, number] = [0, 1];
    if (allValues.length > 0) {
      const dataMin = Math.min(...allValues);
      const dataMax = Math.max(...allValues);
      const padding = (dataMax - dataMin) * 0.08;
      yDomain = [
        Math.max(0, Math.floor((dataMin - padding) / 1000) * 1000),
        Math.ceil((dataMax + padding) / 1000) * 1000,
      ];
    }

    return { chartData, lines, yDomain };
  }, [data, capEnabled, activeGroups, targetCount, deltaMap]);

  const chartHeight = isMobile ? 400 : 600;
  const rightMargin = isMobile ? 100 : 140;

  // Compute label y-offsets to avoid overlap at the rightmost tier
  const labelOffsets = useMemo(() => {
    if (chartData.length === 0) return new Map<string, number>();
    const lastTier = chartData[chartData.length - 1];

    // Get each line's DPS at the last tier, sorted descending (top of chart first)
    const items = lines
      .map((line) => ({
        key: line.key,
        dps: (lastTier[line.key] as number) ?? 0,
      }))
      .sort((a, b) => b.dps - a.dps);

    // Convert DPS range to approximate pixels so we can enforce a min gap
    const usableHeight = chartHeight - 32; // minus top + bottom margins
    const dpsRange = yDomain[1] - yDomain[0];
    if (dpsRange === 0) return new Map<string, number>();
    const dpsPerPixel = dpsRange / usableHeight;
    const minGapDps = (isMobile ? 22 : 24) * dpsPerPixel;

    // Pass 1: walk top-to-bottom, push labels down when too close
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

    // Pass 2: walk bottom-to-top, push labels up if they fell below the chart floor
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

    // Higher DPS = lower pixel y, so if adjustedDps < originalDps the label moves down (+y)
    const offsets = new Map<string, number>();
    for (const item of items) {
      const delta = item.dps - adjusted.get(item.key)!;
      offsets.set(item.key, delta / dpsPerPixel);
    }
    return offsets;
  }, [chartData, lines, chartHeight, yDomain, isMobile]);

  if (lines.length === 0) {
    return <div className="py-10 text-center text-text-dim">No data</div>;
  }

  return (
    <div data-testid="tier-scaling-chart">
      <div style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 16, right: rightMargin, left: 0, bottom: 16 }}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <XAxis
            dataKey="tier"
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
          <ReferenceLine
            x={TIER_LABELS[selectedTier] ?? selectedTier}
            stroke={colors.borderActive}
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              // Sort tooltip entries by DPS descending
              const sorted = [...payload].sort(
                (a, b) => ((b.value as number) ?? 0) - ((a.value as number) ?? 0),
              );
              return (
                <div className="max-h-80 overflow-y-auto rounded-md border border-border-active bg-bg-surface p-3 text-xs">
                  <div className="mb-2 font-semibold text-text-secondary">{label}</div>
                  {sorted.map((entry) => (
                    <div key={entry.dataKey as string} className="flex items-center gap-2 py-0.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-text-secondary">{entry.dataKey as string}</span>
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
                label={({ x, y, index }: { x: number; y: number; index: number }) => {
                  // Only label the last point (rightmost tier)
                  if (index !== chartData.length - 1) return <text />;
                  const offset = labelOffsets.get(line.key) ?? 0;
                  return (
                    <g
                      style={{ cursor: 'pointer' }}
                      onClick={() => setHoveredKey(hoveredKey === line.key ? null : line.key)}
                      onMouseEnter={() => setHoveredKey(line.key)}
                      opacity={isDimmed ? 0.3 : 1}
                    >
                      <text
                        x={x + 10}
                        y={y + offset - 5}
                        textAnchor="start"
                        fill={isDimmed ? colors.textFaint : getClassColor(line.className)}
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
              onClick={() => setHoveredKey(hoveredKey === line.key ? null : line.key)}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: getClassColor(line.className) }}
              />
              <span className="text-text-secondary">{line.className}</span>
              <span className="text-text-faint text-[10px]">{line.skillName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
