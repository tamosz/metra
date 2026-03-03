import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DeltaEntry } from '@engine/proposals/types.js';
import { getClassColor } from '../../utils/class-colors.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { colors } from '../../theme.js';

export function RankBumpChart({ deltas }: { deltas: DeltaEntry[] }) {
  const isMobile = useIsMobile();
  const ranked = deltas.filter((d) => d.rankBefore != null && d.rankAfter != null);
  if (ranked.length === 0) return null;

  const maxRank = Math.max(...ranked.map((d) => Math.max(d.rankBefore!, d.rankAfter!)));
  const labelWidth = isMobile ? 140 : 200;
  const chartHeight = Math.max(200, maxRank * 40 + 60);

  const dataPoints = [
    { x: 'Before', ...Object.fromEntries(ranked.map((_, i) => [`r${i}`, ranked[i].rankBefore])) },
    { x: 'After', ...Object.fromEntries(ranked.map((_, i) => [`r${i}`, ranked[i].rankAfter])) },
  ];

  return (
    <div data-testid="rank-bump-chart" className="mb-6">
      <h3 className="mb-2 text-sm font-medium text-text-secondary">Rank Movement</h3>
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer>
          <LineChart data={dataPoints} margin={{ top: 16, bottom: 16, left: labelWidth, right: labelWidth }}>
            <XAxis
              dataKey="x"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.textMuted, fontSize: 12 }}
            />
            <YAxis type="number" domain={[1, maxRank]} reversed hide allowDecimals={false} />
            <Tooltip content={() => null} />
            {ranked.map((d, i) => {
              const isMover = d.rankBefore !== d.rankAfter;
              return (
                <Line
                  key={`${d.className}-${d.skillName}`}
                  dataKey={`r${i}`}
                  stroke={getClassColor(d.className)}
                  strokeWidth={isMover ? 2.5 : 1.5}
                  strokeOpacity={isMover ? 0.9 : 0.25}
                  strokeDasharray={isMover ? undefined : '4 4'}
                  dot={{
                    fill: getClassColor(d.className),
                    r: isMover ? 5 : 3.5,
                    fillOpacity: isMover ? 1 : 0.25,
                    strokeWidth: 0,
                  }}
                  isAnimationActive={false}
                  label={({ x, y, index }: { x: number; y: number; index: number }) => {
                    const name = `${d.className} ${d.skillName}`;
                    const isBefore = index === 0;
                    return (
                      <text
                        x={isBefore ? x - 10 : x + 10}
                        y={y}
                        textAnchor={isBefore ? 'end' : 'start'}
                        fill={isMover ? colors.textSecondary : colors.textDim}
                        fontSize={isMobile ? 10 : 11}
                        dominantBaseline="central"
                      >
                        {name}
                      </text>
                    );
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
