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
import type React from 'react';
import { useMemo } from 'react';
import { getClassColor } from '../utils/class-colors.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { buildDeltaMap, deltaMapKey } from '../utils/delta-map.js';
import { type BuffBreakdownMap, breakdownKey } from '../hooks/useBuffBreakdown.js';
import type { AnimatedDpsResult } from '../hooks/useAnimatedDps.js';

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

const BUFF_SEGMENTS = [
  { key: 'seDps', label: 'SE', color: colors.buffSe },
  { key: 'siDps', label: 'SI', color: colors.buffSi },
  { key: 'echoDps', label: 'Echo', color: colors.buffEcho },
] as const;

interface DpsChartProps {
  data: ScenarioResult[];
  editComparison?: ComparisonResult | null;
  breakdownMap?: BuffBreakdownMap;
  animation?: AnimatedDpsResult;
}

export function DpsChart({ data, editComparison, breakdownMap, animation }: DpsChartProps) {
  const { capEnabled } = useSimulationControls();
  const isMobile = useIsMobile();

  const deltaMap = useMemo(() => buildDeltaMap(editComparison), [editComparison]);

  const chartData = data.map((r) => {
    const rawDps = Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps);
    let dps = rawDps;
    let baselineDps: number | undefined;
    if (deltaMap) {
      const delta = deltaMap.get(deltaMapKey(r.className, r.skillName, r.tier, r.scenario));
      const change = capEnabled ? delta?.change : delta?.uncappedChange;
      if (delta && change !== 0) {
        dps = Math.round(capEnabled ? delta.after : delta.uncappedAfter);
        baselineDps = rawDps;
      }
    }

    let baseDps = dps;
    let seDps = 0;
    let siDps = 0;
    let echoDps = 0;
    if (breakdownMap) {
      const bd = breakdownMap.get(breakdownKey(r.className, r.skillName, r.tier, r.scenario));
      if (bd) {
        baseDps = Math.round(bd.baseDps);
        seDps = Math.round(bd.seContribution);
        siDps = Math.round(bd.siContribution);
        echoDps = Math.round(bd.echoContribution);
      }
    }

    return {
      label: r.className,
      skillLabel: r.skillName,
      sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
      uid: `${r.className} — ${r.skillName} [${r.tier}]`,
      dps,
      className: r.className,
      description: r.description,
      baselineDps,
      baseDps,
      seDps,
      siDps,
      echoDps,
    };
  }).sort((a, b) => b.dps - a.dps);

  if (chartData.length === 0) {
    return <div className="py-10 text-center text-text-dim">No data</div>;
  }

  const barHeight = 28;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);
  const yAxisWidth = isMobile ? 130 : 200;
  const labelFontSize = isMobile ? 10 : 12;
  const sublabelFontSize = isMobile ? 8 : 9;
  const showStacked = !!breakdownMap;

  return (
    <div data-testid="dps-chart" style={{ width: '100%', height: chartHeight + (showStacked ? 28 : 0) }}>
      {showStacked && <BreakdownLegend />}
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
                    dy={-5}
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
                      dy={8}
                      textAnchor="end"
                      fill={colors.textFaint}
                      fontSize={sublabelFontSize}
                    >
                      {entry.skillLabel} · {entry.sublabel}
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
                  {showStacked && d.dps > 0 && (
                    <div className="mt-1.5 border-t border-border-subtle pt-1.5 space-y-0.5 tabular-nums">
                      <BreakdownLine label="Base" value={d.baseDps} total={d.dps} color={getClassColor(d.className)} />
                      {d.seDps > 0 && <BreakdownLine label="SE" value={d.seDps} total={d.dps} color={colors.buffSe} />}
                      {d.siDps > 0 && <BreakdownLine label="SI" value={d.siDps} total={d.dps} color={colors.buffSi} />}
                      {d.echoDps > 0 && <BreakdownLine label="Echo" value={d.echoDps} total={d.dps} color={colors.buffEcho} />}
                    </div>
                  )}
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
          {renderBars(showStacked, chartData, editComparison)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type ChartEntry = {
  className: string;
  dps: number;
  baseDps: number;
  seDps: number;
  siDps: number;
  echoDps: number;
  baselineDps?: number;
  [key: string]: unknown;
};

function renderBars(
  showStacked: boolean,
  chartData: ChartEntry[],
  editComparison: ComparisonResult | null | undefined,
): React.ReactElement[] {
  if (showStacked) {
    return [
      <Bar key="base" dataKey="baseDps" stackId="dps" barSize={18}>
        {chartData.map((entry, index) => (
          <Cell key={index} fill={getClassColor(entry.className)} fillOpacity={0.8} />
        ))}
      </Bar>,
      <Bar key="se" dataKey="seDps" stackId="dps" fill={colors.buffSe} fillOpacity={0.85} barSize={18} />,
      <Bar key="si" dataKey="siDps" stackId="dps" fill={colors.buffSi} fillOpacity={0.85} barSize={18} />,
      <Bar key="echo" dataKey="echoDps" stackId="dps" fill={colors.buffEcho} fillOpacity={0.85} barSize={18} radius={[0, 3, 3, 0]} />,
    ];
  }
  return [
    <Bar
      key="dps"
      dataKey="dps"
      radius={[0, 3, 3, 0]}
      barSize={18}
      shape={editComparison ? GhostBarShape : undefined}
    >
      {chartData.map((entry, index) => (
        <Cell key={index} fill={getClassColor(entry.className)} fillOpacity={0.8} />
      ))}
    </Bar>,
  ];
}

function BreakdownLine({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-text-muted">{label}</span>
      <span className="ml-auto">{value.toLocaleString()}</span>
      <span className="text-text-dim">({pct}%)</span>
    </div>
  );
}

function BreakdownLegend() {
  return (
    <div data-testid="breakdown-legend" className="mb-2 flex items-center gap-4 text-[11px] text-text-muted">
      <span className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-text-dim" />
        Base
      </span>
      {BUFF_SEGMENTS.map(({ key, label, color }) => (
        <span key={key} className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
