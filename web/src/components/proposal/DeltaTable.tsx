import { useState, useMemo, Fragment } from 'react';
import type { DeltaEntry } from '@engine/proposals/types.js';
import { compareTiers } from '@metra/engine';
import { getClassColor } from '../../utils/class-colors.js';
import { ClassIcon } from '../icons/index.js';
import { formatDps } from '../../utils/format.js';
import { RankCell } from './RankCell.js';

function rankSort(a: DeltaEntry, b: DeltaEntry): number {
  const tierCmp = compareTiers(a.tier, b.tier);
  if (tierCmp !== 0) return tierCmp;
  return (a.rankAfter ?? Infinity) - (b.rankAfter ?? Infinity);
}

export function DeltaTable({ deltas, showTierGroups }: { deltas: DeltaEntry[]; showTierGroups?: boolean }) {
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
