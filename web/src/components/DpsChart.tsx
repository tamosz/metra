import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ScenarioResult, ComparisonResult } from '@engine/proposals/types.js';
import { useMemo } from 'react';
import { getClassColor } from '../utils/class-colors.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import type { DeltaEntry } from '@engine/proposals/types.js';

// Custom bar shape that overlays a ghost bar showing the baseline DPS when an edit change is active.
// Recharts renders multiple <Bar> components side-by-side (grouped), so we use a single Bar with a
// custom shape to draw both the ghost (baseline width) and the actual bar on the same row.
function GhostBarShape(props: unknown) {
  const { x, y, width, height, fill, fillOpacity, baselineDps, dps } = props as {
    x: number; y: number; width: number; height: number;
    fill: string; fillOpacity: number;
    baselineDps?: number; dps: number;
  };
  if (baselineDps === undefined || baselineDps === dps || dps === 0) {
    return <rect x={x} y={y} width={width} height={height} rx={3} fill={fill} fillOpacity={fillOpacity} />;
  }
  // Ghost width = baseline / dps * actual width
  const ghostWidth = (baselineDps / dps) * width;
  return (
    <g>
      <rect x={x} y={y} width={ghostWidth} height={height} rx={3} fill={fill} fillOpacity={0.15} />
      <rect x={x} y={y} width={width} height={height} rx={3} fill={fill} fillOpacity={fillOpacity} />
    </g>
  );
}

interface DpsChartProps {
  data: ScenarioResult[];
  editComparison?: ComparisonResult | null;
}

export function DpsChart({ data, editComparison }: DpsChartProps) {
  const { capEnabled } = useSimulationControls();
  const isMobile = useIsMobile();

  const deltaMap = useMemo(() => {
    if (!editComparison) return null;
    const map = new Map<string, DeltaEntry>();
    for (const d of editComparison.deltas) {
      map.set(`${d.className}\0${d.skillName}\0${d.tier}\0${d.scenario}`, d);
    }
    return map;
  }, [editComparison]);

  const chartData = data.map((r) => {
    let baselineDps: number | undefined;
    if (deltaMap) {
      const delta = deltaMap.get(`${r.className}\0${r.skillName}\0${r.tier}\0${r.scenario}`);
      if (delta && delta.change !== 0) {
        baselineDps = Math.round(delta.before);
      }
    }
    return {
      label: `${r.className} — ${r.skillName}`,
      sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
      // Unique key for Recharts YAxis — includes tier to avoid duplicate labels
      uid: `${r.className} — ${r.skillName} [${r.tier}]`,
      dps: Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps),
      className: r.className,
      description: r.description,
      baselineDps,
    };
  });

  if (chartData.length === 0) {
    return <div className="py-10 text-center text-text-dim">No data</div>;
  }

  const barHeight = 28;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);
  const yAxisWidth = isMobile ? 160 : 260;
  const labelFontSize = isMobile ? 10 : 12;
  const sublabelFontSize = isMobile ? 9 : 10;

  return (
    <div data-testid="dps-chart" style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: isMobile ? 40 : 80, left: 0, bottom: 8 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fill: colors.textFaint, fontSize: 11 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="uid"
            width={yAxisWidth}
            interval={0}
            tick={({ x, y, payload }) => {
              const entry = chartData.find((d) => d.uid === payload.value);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={-8}
                    y={0}
                    dy={-4}
                    textAnchor="end"
                    fill={colors.textSecondary}
                    fontSize={labelFontSize}
                  >
                    {entry?.label ?? payload.value}
                  </text>
                  {entry && (
                    <text
                      x={-8}
                      y={0}
                      dy={10}
                      textAnchor="end"
                      fill={colors.textFaint}
                      fontSize={sublabelFontSize}
                    >
                      {entry.sublabel}
                    </text>
                  )}
                </g>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-md border border-border-active bg-bg-surface p-3 text-xs">
                  <div className="font-semibold" style={{ color: getClassColor(d.className) }}>
                    {d.className}
                  </div>
                  <div className="text-text-secondary">{d.sublabel}</div>
                  <div className="mt-1 tabular-nums">
                    {d.dps.toLocaleString()} DPS
                  </div>
                  {d.baselineDps !== undefined && (
                    <>
                      <div className="mt-1 text-text-dim">
                        Before: {d.baselineDps.toLocaleString()} DPS
                      </div>
                      <div className={d.dps > d.baselineDps ? 'text-emerald-400' : 'text-red-400'}>
                        {d.dps > d.baselineDps ? '+' : ''}{(d.dps - d.baselineDps).toLocaleString()} DPS
                        ({((d.dps - d.baselineDps) / d.baselineDps * 100).toFixed(1)}%)
                      </div>
                    </>
                  )}
                  {d.description && (
                    <div className="mt-1.5 border-t border-border-subtle pt-1.5 text-text-dim leading-relaxed">
                      {d.description}
                    </div>
                  )}
                </div>
              );
            }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar
            dataKey="dps"
            radius={[0, 3, 3, 0]}
            barSize={18}
            shape={editComparison ? GhostBarShape : undefined}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getClassColor(entry.className)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
