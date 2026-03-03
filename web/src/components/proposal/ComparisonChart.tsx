import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import type { DeltaEntry } from '@engine/proposals/types.js';
import { compareTiers } from '@engine/data/types.js';
import { getClassColor } from '../../utils/class-colors.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { colors } from '../../theme.js';

function rankSort(a: DeltaEntry, b: DeltaEntry): number {
  const tierCmp = compareTiers(a.tier, b.tier);
  if (tierCmp !== 0) return tierCmp;
  return (a.rankAfter ?? Infinity) - (b.rankAfter ?? Infinity);
}

export function ComparisonChart({ deltas }: { deltas: DeltaEntry[] }) {
  const isMobile = useIsMobile();
  const chartData = [...deltas]
    .sort(rankSort)
    .map((d) => ({
      label: `${d.className} ${d.skillName} (${d.tier.charAt(0).toUpperCase() + d.tier.slice(1)})`,
      before: Math.round(d.before),
      after: Math.round(d.after),
      className: d.className,
    }));

  const barHeight = 36;
  const chartHeight = Math.max(200, chartData.length * barHeight + 60);
  const yAxisWidth = isMobile ? 180 : 280;

  return (
    <div data-testid="comparison-chart" style={{ width: '100%', height: chartHeight }} className="mb-6">
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
            dataKey="label"
            width={yAxisWidth}
            interval={0}
            tick={{ fill: colors.textSecondary, fontSize: isMobile ? 10 : 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="rounded-md border border-border-active bg-bg-surface p-3 text-xs">
                  <div className="font-semibold" style={{ color: getClassColor(d.className) }}>
                    {d.label}
                  </div>
                  <div className="mt-1">
                    <span className="text-text-muted">Before: </span>
                    <span>{d.before.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">After: </span>
                    <span>{d.after.toLocaleString()}</span>
                  </div>
                  <div className={d.after > d.before ? 'text-positive' : 'text-negative'}>
                    {d.after > d.before ? '+' : ''}{(d.after - d.before).toLocaleString()} ({((d.after - d.before) / d.before * 100).toFixed(1)}%)
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => <span className="text-text-secondary">{value}</span>}
          />
          <Bar dataKey="before" name="Before" fill={colors.textFaint} fillOpacity={0.6} barSize={14} radius={[0, 3, 3, 0]} />
          <Bar dataKey="after" name="After" barSize={14} radius={[0, 3, 3, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getClassColor(entry.className)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
