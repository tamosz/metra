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
import { useMemo, useRef, useState, useEffect } from 'react';
import { getClassColor } from '../utils/class-colors.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { buildDeltaMap, deltaMapKey } from '../utils/delta-map.js';
import { type BuffBreakdownMap, breakdownKey } from '../hooks/useBuffBreakdown.js';
import type { AnimatedDpsResult } from '../hooks/useAnimatedDps.js';
import { TRANSITION_DURATION_MS } from '../utils/animation-config.js';

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

function AnimatedBarShape(props: unknown) {
  const { x, y, width, height, fill, fillOpacity, isHighImpact, transitionId } = props as {
    x: number; y: number; width: number; height: number;
    fill: string; fillOpacity: number;
    isHighImpact?: boolean; transitionId?: number;
  };

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} fill={fill} fillOpacity={fillOpacity}>
        {isHighImpact && (
          <animate
            key={transitionId}
            attributeName="fill-opacity"
            values="0.8;1;0.5;0.8"
            keyTimes="0;0.3;0.7;1"
            dur="1s"
            fill="remove"
          />
        )}
      </rect>
      {isHighImpact && (
        <rect x={x} y={y} width={width} height={height} rx={3} fill={fill} fillOpacity={0} filter={`drop-shadow(0 0 6px ${fill})`}>
          <animate
            key={transitionId}
            attributeName="fill-opacity"
            values="0;0.4;0"
            keyTimes="0;0.3;1"
            dur="1s"
            fill="remove"
          />
        </rect>
      )}
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
  const showStacked = !!breakdownMap;

  const deltaMap = useMemo(() => buildDeltaMap(editComparison), [editComparison]);

  const interpolatedRef = useRef<Map<string, number>>(new Map());
  const rafsRef = useRef<Map<string, number>>(new Map());
  const [, forceRender] = useState(0);

  const chartData = useMemo(() => data.map((r) => {
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

    const animKey = `${r.className}|${r.skillName}|${r.tier}`;
    const animEntry = animation?.entries.get(animKey);
    const uid = `${r.className} — ${r.skillName} [${r.tier}]`;

    return {
      label: r.className,
      skillLabel: r.skillName,
      sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
      uid,
      dps,
      className: r.className,
      description: r.description,
      baselineDps,
      baseDps,
      seDps,
      siDps,
      echoDps,
      interpolatedDps: interpolatedRef.current.get(uid) ?? dps,
      isHighImpact: animEntry?.isHighImpact ?? false,
      transitionId: animation?.transitionId ?? 0,
    };
  }).sort((a, b) => b.dps - a.dps), [data, capEnabled, deltaMap, breakdownMap, animation, interpolatedRef]);

  useEffect(() => {
    if (!animation || animation.prefersReducedMotion || editComparison || showStacked) {
      interpolatedRef.current = new Map(chartData.map((d) => [d.uid, d.dps]));
      return;
    }

    for (const d of chartData) {
      const animKey = `${d.className}|${d.skillLabel}|${d.sublabel.toLowerCase()}`;
      const animEntry = animation.entries.get(animKey);
      const from = animEntry?.previousDps ?? d.dps;
      const to = d.dps;

      if (from === to) {
        interpolatedRef.current.set(d.uid, to);
        continue;
      }

      let startTime = -1;
      const step = (time: number) => {
        if (startTime < 0) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION_MS, 1);
        interpolatedRef.current.set(d.uid, Math.round(from + (to - from) * progress));
        forceRender((n) => n + 1);
        if (progress < 1) {
          rafsRef.current.set(d.uid, requestAnimationFrame(step));
        }
      };

      const existingRaf = rafsRef.current.get(d.uid);
      if (existingRaf) cancelAnimationFrame(existingRaf);
      rafsRef.current.set(d.uid, requestAnimationFrame(step));
    }

    return () => {
      for (const id of rafsRef.current.values()) cancelAnimationFrame(id);
      rafsRef.current.clear();
    };
  }, [chartData, animation, editComparison, showStacked]);

  if (chartData.length === 0) {
    return <div className="py-10 text-center text-text-dim">No data</div>;
  }

  const barHeight = 28;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);
  const yAxisWidth = isMobile ? 130 : 200;
  const labelFontSize = isMobile ? 10 : 12;
  const sublabelFontSize = isMobile ? 8 : 9;

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
          {renderBars(showStacked, chartData, editComparison, animation)}
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
  interpolatedDps: number;
  isHighImpact: boolean;
  transitionId: number;
  [key: string]: unknown;
};

function renderBars(
  showStacked: boolean,
  chartData: ChartEntry[],
  editComparison: ComparisonResult | null | undefined,
  animation: AnimatedDpsResult | undefined,
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
  const useAnimated = !editComparison && animation && !animation.prefersReducedMotion;
  return [
    <Bar
      key="dps"
      dataKey={useAnimated ? 'interpolatedDps' : 'dps'}
      radius={[0, 3, 3, 0]}
      barSize={18}
      shape={editComparison ? GhostBarShape : (useAnimated ? AnimatedBarShape : undefined)}
    >
      {chartData.map((entry, index) => (
        <Cell
          key={index}
          fill={getClassColor(entry.className)}
          fillOpacity={0.8}
          {...(useAnimated ? { isHighImpact: entry.isHighImpact, transitionId: entry.transitionId } : {})}
        />
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
