import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ScenarioResult } from '@engine/proposals/types.js';
import { getClassColor } from '../utils/class-colors.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';

interface TierScalingChartProps {
  data: ScenarioResult[];
  capEnabled: boolean;
  showAllSkills: boolean;
  targetCount: number;
}

const TIER_ORDER = ['low', 'mid', 'high', 'perfect'];
const TIER_LABELS: Record<string, string> = {
  low: 'Low',
  mid: 'Mid',
  high: 'High',
  perfect: 'Perfect',
};
const VARIANT_CLASSES = new Set(['Hero (Axe)', 'Paladin (BW)']);

export function TierScalingChart({ data, capEnabled, showAllSkills, targetCount }: TierScalingChartProps) {
  const isMobile = useIsMobile();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Group results by class+skill across tiers
  const { chartData, lines } = useMemo(() => {
    // Filter to active scenario only (not tier — we want all tiers)
    const activeScenario = targetCount > 1
      ? data.find((r) => r.scenario.startsWith('Training'))?.scenario
      : data[0]?.scenario;
    const filtered = data.filter((r) => {
      if (r.scenario !== activeScenario) return false;
      if (!showAllSkills && r.headline === false) return false;
      if (!showAllSkills && VARIANT_CLASSES.has(r.className)) return false;
      return true;
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
      groups.get(key)!.set(r.tier, Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps));
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

    return { chartData, lines };
  }, [data, capEnabled, showAllSkills, targetCount]);

  if (lines.length === 0) {
    return <div className="py-10 text-center text-text-dim">No data</div>;
  }

  const chartHeight = isMobile ? 350 : 450;
  const rightMargin = isMobile ? 120 : 180;

  return (
    <div data-testid="tier-scaling-chart" style={{ width: '100%', height: chartHeight }}>
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
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fill: colors.textFaint, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
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
                  if (index !== chartData.length - 1) return <g />;
                  return (
                    <text
                      x={x + 10}
                      y={y}
                      textAnchor="start"
                      fill={isDimmed
                        ? colors.textFaint
                        : getClassColor(line.className)}
                      fontSize={isMobile ? 9 : 11}
                      dominantBaseline="central"
                      opacity={isDimmed ? 0.3 : 1}
                    >
                      {line.key}
                    </text>
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
  );
}
