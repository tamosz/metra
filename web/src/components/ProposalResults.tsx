import { useState, useMemo } from 'react';
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
import type { ComparisonResult, DeltaEntry, Proposal } from '@engine/proposals/types.js';
import { renderComparisonReport } from '@engine/report/markdown.js';
import { renderComparisonBBCode } from '@engine/report/bbcode.js';
import { getClassColor } from '../utils/class-colors.js';
import { setProposalInUrl } from '../utils/url-encoding.js';
import { colors } from '../theme.js';

interface ProposalResultsProps {
  result: ComparisonResult;
  proposal: Proposal;
}

export function ProposalResults({ result, proposal }: ProposalResultsProps) {
  const scenarios = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const d of result.deltas) {
      if (!seen.has(d.scenario)) {
        seen.add(d.scenario);
        ordered.push(d.scenario);
      }
    }
    return ordered;
  }, [result.deltas]);

  const [selectedScenario, setSelectedScenario] = useState(scenarios[0] ?? 'Buffed');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(
    () => result.deltas.filter((d) => d.scenario === selectedScenario),
    [result.deltas, selectedScenario]
  );

  const changed = filtered.filter((d) => d.change !== 0);

  const handleShare = () => {
    setProposalInUrl(proposal);
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyMarkdown = () => {
    const md = renderComparisonReport(result);
    navigator.clipboard.writeText(md);
  };

  const handleCopyBBCode = () => {
    const bbcode = renderComparisonBBCode(result);
    navigator.clipboard.writeText(bbcode);
  };

  const actionBtn = 'cursor-pointer rounded border border-border-default bg-bg-active px-2.5 py-1 text-xs text-text-secondary hover:border-border-active hover:text-text-bright transition-colors';

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold">Results</h2>
        <div className="flex gap-2">
          <button onClick={handleShare} className={actionBtn}>
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
          <button onClick={handleCopyMarkdown} className={actionBtn}>
            Copy Markdown
          </button>
          <button onClick={handleCopyBBCode} className={actionBtn}>
            Copy for Forum
          </button>
        </div>
      </div>

      {scenarios.length > 1 && (
        <div className="mb-4 flex gap-0.5">
          {scenarios.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedScenario(s)}
              className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${
                selectedScenario === s
                  ? 'border border-border-active bg-bg-active text-text-bright'
                  : 'border border-transparent bg-transparent text-text-dim hover:text-text-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {changed.length > 0 && <ComparisonChart deltas={changed} />}

      <DeltaTable deltas={filtered} />
    </div>
  );
}

function ComparisonChart({ deltas }: { deltas: DeltaEntry[] }) {
  const chartData = deltas
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .map((d) => ({
      label: `${d.className} ${d.skillName} (${d.tier.charAt(0).toUpperCase() + d.tier.slice(1)})`,
      before: Math.round(d.before),
      after: Math.round(d.after),
      className: d.className,
    }));

  const barHeight = 36;
  const chartHeight = Math.max(200, chartData.length * barHeight + 60);

  return (
    <div data-testid="comparison-chart" style={{ width: '100%', height: chartHeight }} className="mb-6">
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
            width={280}
            tick={{ fill: colors.textSecondary, fontSize: 12 }}
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
                  <div style={{ color: d.after > d.before ? colors.positive : colors.negative }}>
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

function DeltaTable({ deltas }: { deltas: DeltaEntry[] }) {
  const sorted = [...deltas].sort((a, b) => {
    const aChanged = a.change !== 0 ? 0 : 1;
    const bChanged = b.change !== 0 ? 0 : 1;
    if (aChanged !== bChanged) return aChanged - bChanged;
    if (aChanged === 0) return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    return a.className.localeCompare(b.className);
  });

  const hasRanks = sorted.some((d) => d.rankBefore != null);
  const th = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium';

  return (
    <table data-testid="delta-table" className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border-default">
          {hasRanks && <th className={th}>Rank</th>}
          <th className={`${th} text-left`}>Class</th>
          <th className={`${th} text-left`}>Skill</th>
          <th className={`${th} text-left`}>Tier</th>
          <th className={`${th} text-right`}>Before</th>
          <th className={`${th} text-right`}>After</th>
          <th className={`${th} text-right`}>Change</th>
          <th className={`${th} text-right`}>%</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((d, i) => {
          const isChanged = d.change !== 0;
          return (
            <tr key={i} className={`border-b border-border-subtle ${isChanged ? 'bg-accent/[0.03]' : ''}`}>
              {hasRanks && (
                <td className="px-3 py-2 text-xs text-text-dim">
                  {formatRank(d.rankBefore, d.rankAfter)}
                </td>
              )}
              <td className="px-3 py-2">{d.className}</td>
              <td className="px-3 py-2 text-text-secondary">{d.skillName}</td>
              <td className="px-3 py-2 text-text-muted">
                {d.tier.charAt(0).toUpperCase() + d.tier.slice(1)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatDps(d.before)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatDps(d.after)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums" style={{
                color: d.change > 0 ? colors.positive : d.change < 0 ? colors.negative : colors.textFaint,
              }}>
                {d.change > 0 ? '+' : ''}{formatDps(d.change)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums" style={{
                color: d.changePercent > 0 ? colors.positive : d.changePercent < 0 ? colors.negative : colors.textFaint,
              }}>
                {d.changePercent > 0 ? '+' : ''}{d.changePercent.toFixed(1)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatRank(before?: number, after?: number): string {
  if (before == null || after == null) return '-';
  if (before === after) return String(before);
  return `${before}\u2192${after}`;
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}
