import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ScenarioResult } from '@engine/proposals/types.js';
import { getClassColor } from '../utils/class-colors.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { colors } from '../theme.js';

interface DpsChartProps {
  data: ScenarioResult[];
}

export function DpsChart({ data }: DpsChartProps) {
  const isMobile = useIsMobile();

  const chartData = data.map((r) => ({
    label: `${r.className} — ${r.skillName}`,
    sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
    // Unique key for Recharts YAxis — includes tier to avoid duplicate labels
    uid: `${r.className} — ${r.skillName} [${r.tier}]`,
    dps: Math.round(r.dps.dps),
    className: r.className,
  }));

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
                </div>
              );
            }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="dps" radius={[0, 3, 3, 0]} barSize={18}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getClassColor(entry.className)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
