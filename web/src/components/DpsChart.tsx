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

interface DpsChartProps {
  data: ScenarioResult[];
}

export function DpsChart({ data }: DpsChartProps) {
  const chartData = data.map((r) => ({
    label: `${r.className} — ${r.skillName}`,
    sublabel: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
    dps: Math.round(r.dps.dps),
    className: r.className,
  }));

  if (chartData.length === 0) {
    return <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>No data</div>;
  }

  const barHeight = 28;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);

  return (
    <div style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 80, left: 0, bottom: 8 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fill: '#555', fontSize: 11 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={260}
            tick={({ x, y, payload }) => {
              const entry = chartData.find((d) => d.label === payload.value);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={-8}
                    y={0}
                    dy={-4}
                    textAnchor="end"
                    fill="#ccc"
                    fontSize={12}
                  >
                    {payload.value}
                  </text>
                  {entry && (
                    <text
                      x={-8}
                      y={0}
                      dy={10}
                      textAnchor="end"
                      fill="#555"
                      fontSize={10}
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
                <div style={{
                  background: '#1a1a2e',
                  border: '1px solid #2a2a4e',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                }}>
                  <div style={{ fontWeight: 600, color: getClassColor(d.className) }}>
                    {d.className}
                  </div>
                  <div style={{ color: '#aaa' }}>{d.sublabel}</div>
                  <div style={{ marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
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
