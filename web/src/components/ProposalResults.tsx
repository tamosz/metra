import { useState, useMemo } from 'react';
import type { ComparisonResult, Proposal } from '@engine/proposals/types.js';
import { renderComparisonReport } from '@engine/report/markdown.js';
import { renderComparisonBBCode } from '@engine/report/bbcode.js';
import { setProposalInUrl } from '../utils/url-encoding.js';
import { FilterGroup } from './FilterGroup.js';
import { getScenarioDescription } from '../utils/game-terms.js';
import { ComparisonChart } from './proposal/ComparisonChart.js';
import { RankBumpChart } from './proposal/RankBumpChart.js';
import { DeltaTable } from './proposal/DeltaTable.js';

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
              tooltip: getScenarioDescription(s),
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

      {changed.length > 0 && <ComparisonChart deltas={changed} />}

      {selectedTier !== 'all' && filtered.some((d) => d.rankBefore != null) && (
        <RankBumpChart deltas={filtered} />
      )}

      <DeltaTable deltas={filtered} showTierGroups={selectedTier === 'all'} />
    </div>
  );
}
