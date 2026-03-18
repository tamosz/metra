import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PartySimulationResult } from '@metra/engine';
import { discoveredData } from '../data/bundle.js';
import { getClassColor } from '../utils/class-colors.js';
import { colors } from '../theme.js';

interface PartyTierListProps {
  topParties: PartySimulationResult[];
  onLoadParty: (members: { className: string }[]) => void;
}

interface ChartEntry {
  rank: number;
  label: string;
  totalDps: number;
  party: PartySimulationResult;
}

function buildChartData(topParties: PartySimulationResult[], classDataMap: Map<string, { className: string }>): ChartEntry[] {
  return topParties.map((party, index) => {
    const displayNames = party.members.map(
      (m) => classDataMap.get(m.className)?.className ?? m.className,
    );
    const label = `#${index + 1}`;
    return {
      rank: index + 1,
      label,
      totalDps: Math.round(party.totalDps),
      party,
      displayNames,
    };
  });
}

function barFillOpacity(rank: number, total: number): number {
  // Fade from 0.85 at rank 1 down to 0.35 at last rank
  if (total <= 1) return 0.85;
  return 0.85 - ((rank - 1) / (total - 1)) * 0.5;
}

const ACCENT = 'rgb(99, 102, 241)';

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartEntry & { displayNames: string[] } }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border-active bg-bg-surface p-3 text-xs">
      <div className="mb-1 font-semibold text-text-bright">Party {d.label}</div>
      <div className="mb-1.5 text-text-secondary">{d.displayNames.join(' + ')}</div>
      <div className="tabular-nums text-text-primary">{d.totalDps.toLocaleString()} total DPS</div>
      {(d.party.activeBuffs.sharpEyes || d.party.activeBuffs.speedInfusion) && (
        <div className="mt-1.5 flex gap-1">
          {d.party.activeBuffs.sharpEyes && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.buffSe + '33', color: colors.buffSe }}>
              SE
            </span>
          )}
          {d.party.activeBuffs.speedInfusion && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.buffSi + '33', color: colors.buffSi }}>
              SI
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface DetailPanelProps {
  entry: ChartEntry & { displayNames: string[] };
  onLoadParty: (members: { className: string }[]) => void;
  onClose: () => void;
}

function DetailPanel({ entry, onLoadParty, onClose }: DetailPanelProps) {
  const { classDataMap } = discoveredData;
  const { party } = entry;
  const totalDps = party.totalDps;

  const sorted = [...party.members].sort((a, b) => b.dps - a.dps);

  return (
    <div className="mt-3 rounded-md border border-border-active bg-bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-text-bright">
          Party {entry.label} — {entry.totalDps.toLocaleString()} DPS
        </div>
        <div className="flex items-center gap-2">
          {(party.activeBuffs.sharpEyes || party.activeBuffs.speedInfusion) && (
            <div className="flex gap-1">
              {party.activeBuffs.sharpEyes && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.buffSe + '33', color: colors.buffSe }}>
                  SE
                </span>
              )}
              {party.activeBuffs.speedInfusion && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.buffSi + '33', color: colors.buffSi }}>
                  SI
                </span>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-xs text-text-dim hover:text-text-muted"
            aria-label="Close detail panel"
          >
            ✕
          </button>
        </div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-default text-[10px] uppercase tracking-widest text-text-dim">
            <th className="pb-1.5 text-left font-medium">Class</th>
            <th className="pb-1.5 text-right font-medium">DPS</th>
            <th className="pb-1.5 text-right font-medium">Share</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((member, i) => {
            const displayName = classDataMap.get(member.className)?.className ?? member.className;
            const color = getClassColor(displayName);
            const share = totalDps > 0 ? ((member.dps / totalDps) * 100).toFixed(1) : '0.0';
            return (
              <tr key={i} className="border-b border-border-default last:border-0">
                <td className="py-2">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-text-primary">{displayName}</span>
                </td>
                <td className="py-2 text-right tabular-nums text-text-secondary">
                  {Math.round(member.dps).toLocaleString()}
                </td>
                <td className="py-2 text-right tabular-nums text-text-dim">
                  {share}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3">
        <button
          onClick={() => onLoadParty(party.members.map((m) => ({ className: m.className })))}
          className="rounded border border-border-active bg-bg-active px-3 py-1.5 text-xs font-medium text-text-primary hover:border-border-button hover:text-text-bright transition-colors"
        >
          Load this party
        </button>
      </div>
    </div>
  );
}

export function PartyTierList({ topParties, onLoadParty }: PartyTierListProps) {
  const { classDataMap } = discoveredData;
  const [expandedRank, setExpandedRank] = useState<number | null>(null);

  if (topParties.length === 0) {
    return <div className="py-6 text-center text-sm text-text-dim">No party data available</div>;
  }

  const chartData = buildChartData(topParties, classDataMap) as (ChartEntry & { displayNames: string[] })[];
  const expandedEntry = expandedRank !== null ? chartData.find((d) => d.rank === expandedRank) ?? null : null;

  const barHeight = 28;
  const chartHeight = chartData.length * barHeight + 60;

  function handleBarClick(data: ChartEntry & { displayNames: string[] }) {
    setExpandedRank((prev) => (prev === data.rank ? null : data.rank));
  }

  return (
    <div>
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
              tick={{ fill: colors.textFaint, fontSize: 11 }}
              axisLine={{ stroke: colors.border }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={36}
              interval={0}
              tick={{ fill: colors.textSecondary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => (
                <CustomTooltip active={active} payload={payload as unknown as { payload: ChartEntry & { displayNames: string[] } }[] | undefined} />
              )}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar
              dataKey="totalDps"
              radius={[0, 3, 3, 0]}
              barSize={18}
              onClick={(data) => handleBarClick(data as unknown as ChartEntry & { displayNames: string[] })}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.rank}
                  fill={entry.rank === expandedRank ? 'rgb(129, 140, 248)' : ACCENT}
                  fillOpacity={entry.rank === expandedRank ? 0.95 : barFillOpacity(entry.rank, chartData.length)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {expandedEntry && (
        <DetailPanel
          entry={expandedEntry}
          onLoadParty={onLoadParty}
          onClose={() => setExpandedRank(null)}
        />
      )}
    </div>
  );
}
