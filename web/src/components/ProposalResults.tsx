import { useState, useMemo, Fragment } from 'react';
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
import { compareTiers } from '@engine/data/types.js';
import { getClassColor } from '../utils/class-colors.js';
import { setProposalInUrl } from '../utils/url-encoding.js';
import { FilterGroup } from './FilterGroup.js';
import { SupportClassNote } from './SupportClassNote.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { SCENARIO_DESCRIPTIONS } from '../utils/game-terms.js';
import { ClassIcon } from './icons/index.js';
import { colors } from '../theme.js';

function rankSort(a: DeltaEntry, b: DeltaEntry): number {
  const tierCmp = compareTiers(a.tier, b.tier);
  if (tierCmp !== 0) return tierCmp;
  return (a.rankAfter ?? Infinity) - (b.rankAfter ?? Infinity);
}

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

  const tiers = useMemo(() => {
    const seen = new Set<string>();
    for (const d of result.deltas) seen.add(d.tier);
    return [...seen];
  }, [result.deltas]);

  const [selectedScenario, setSelectedScenario] = useState(scenarios[0] ?? 'Buffed');
  const [selectedTier, setSelectedTier] = useState<string | 'all'>('all');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(
    () => result.deltas.filter((d) => {
      if (d.scenario !== selectedScenario) return false;
      if (selectedTier !== 'all' && d.tier !== selectedTier) return false;
      return true;
    }),
    [result.deltas, selectedScenario, selectedTier]
  );

  const changed = filtered.filter((d) => d.change !== 0);

  // Scenario impact hints: avg change% of changed rows (respecting tier filter)
  const scenarioHints = useMemo(() => {
    const hints: Record<string, string> = {};
    for (const s of scenarios) {
      const scenarioDeltas = result.deltas.filter((d) => {
        if (d.scenario !== s) return false;
        if (selectedTier !== 'all' && d.tier !== selectedTier) return false;
        return d.change !== 0;
      });
      if (scenarioDeltas.length === 0) {
        hints[s] = 'no change';
      } else {
        const avg = scenarioDeltas.reduce((sum, d) => sum + d.changePercent, 0) / scenarioDeltas.length;
        hints[s] = `${avg > 0 ? '+' : ''}${avg.toFixed(1)}% avg`;
      }
    }
    return hints;
  }, [result.deltas, scenarios, selectedTier]);

  // Summary headline
  const summary = useMemo(() => {
    if (changed.length === 0) return null;
    const avg = changed.reduce((sum, d) => sum + d.changePercent, 0) / changed.length;
    const biggest = changed.reduce((best, d) =>
      Math.abs(d.changePercent) > Math.abs(best.changePercent) ? d : best
    );
    const direction = biggest.changePercent > 0 ? 'winner' : 'loser';
    return {
      count: changed.length,
      avg,
      biggestLabel: `${biggest.className} ${biggest.skillName}`,
      biggestChange: biggest.changePercent,
      direction,
    };
  }, [changed]);

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
        <div className="flex flex-wrap gap-2">
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

      {summary && (
        <div className="mb-4 text-xs text-text-muted">
          {summary.count} skill{summary.count !== 1 ? 's' : ''} affected, avg{' '}
          <span className={summary.avg > 0 ? 'text-positive' : summary.avg < 0 ? 'text-negative' : ''}>
            {summary.avg > 0 ? '+' : ''}{summary.avg.toFixed(1)}%
          </span>
          , biggest {summary.direction}:{' '}
          <span className="text-text-secondary">{summary.biggestLabel}</span>{' '}
          <span className={summary.biggestChange > 0 ? 'text-positive' : 'text-negative'}>
            {summary.biggestChange > 0 ? '+' : ''}{summary.biggestChange.toFixed(1)}%
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-4">
        {scenarios.length > 1 && (
          <FilterGroup
            label="Scenario"
            value={selectedScenario}
            options={scenarios.map((s) => ({
              value: s,
              label: s,
              annotation: scenarioHints[s],
              tooltip: SCENARIO_DESCRIPTIONS[s],
            }))}
            onChange={setSelectedScenario}
          />
        )}
        {tiers.length > 1 && (
          <FilterGroup
            label="Tier"
            value={selectedTier}
            options={[
              { value: 'all', label: 'All Tiers' },
              ...tiers.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
            ]}
            onChange={setSelectedTier}
          />
        )}
      </div>

      <SupportClassNote classNames={[...new Set(filtered.map((d) => d.className))]} />

      {changed.length > 0 && <ComparisonChart deltas={changed} />}

      <DeltaTable deltas={filtered} showTierGroups={selectedTier === 'all'} />
    </div>
  );
}

function ComparisonChart({ deltas }: { deltas: DeltaEntry[] }) {
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

function RankCell({ before, after }: { before?: number; after?: number }) {
  if (before == null || after == null) return <span className="text-text-faint">-</span>;
  const diff = before - after; // positive = improved (lower rank number = better)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-text-secondary">{after}</span>
      {diff !== 0 && (
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
            diff > 0 ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
          }`}
        >
          {diff > 0 ? `\u2191${diff}` : `\u2193${Math.abs(diff)}`}
        </span>
      )}
    </span>
  );
}

function DeltaTable({ deltas, showTierGroups }: { deltas: DeltaEntry[]; showTierGroups?: boolean }) {
  const [showUnchanged, setShowUnchanged] = useState(false);

  const changedRows = useMemo(() =>
    [...deltas]
      .filter((d) => d.change !== 0)
      .sort(rankSort),
    [deltas]
  );

  const unchangedRows = useMemo(() =>
    [...deltas]
      .filter((d) => d.change === 0)
      .sort(rankSort),
    [deltas]
  );

  const visibleRows = showUnchanged ? [...changedRows, ...unchangedRows] : changedRows;
  const hasRanks = deltas.some((d) => d.rankBefore != null);
  const th = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium';

  return (
    <>
      <div className="overflow-x-auto">
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
          {visibleRows.map((d, i) => {
            const isChanged = d.change !== 0;
            const colCount = hasRanks ? 8 : 7;
            const tierChanged = showTierGroups && i > 0 && visibleRows[i - 1].tier !== d.tier;

            return (
              <Fragment key={i}>
                {tierChanged && (
                  <tr>
                    <td colSpan={colCount} className="h-px bg-border-default" />
                  </tr>
                )}
                <tr
                  className={`border-b border-border-subtle ${isChanged ? 'bg-accent/[0.03]' : ''}`}
                  style={{ borderLeft: `3px solid ${getClassColor(d.className)}` }}
                >
                {hasRanks && (
                  <td className="px-3 py-2 text-xs">
                    <RankCell before={d.rankBefore} after={d.rankAfter} />
                  </td>
                )}
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <ClassIcon className={d.className} />
                    {d.className}
                  </span>
                </td>
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
                <td className={`px-3 py-2 text-right tabular-nums ${d.change > 0 ? 'text-positive' : d.change < 0 ? 'text-negative' : 'text-text-faint'}`}>
                  {d.change > 0 ? '+' : ''}{formatDps(d.change)}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${d.changePercent > 0 ? 'text-positive' : d.changePercent < 0 ? 'text-negative' : 'text-text-faint'}`}>
                  {d.changePercent > 0 ? '+' : ''}{d.changePercent.toFixed(1)}%
                </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
      {unchangedRows.length > 0 && (
        <button
          onClick={() => setShowUnchanged(!showUnchanged)}
          className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs text-text-dim hover:text-text-muted transition-colors"
        >
          {showUnchanged ? 'Hide unchanged' : `Show ${unchangedRows.length} unchanged`}
        </button>
      )}
    </>
  );
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}
