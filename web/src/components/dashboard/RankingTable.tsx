import { Fragment, useState, useMemo } from 'react';
import { SkillDetailPanel } from '../SkillDetailPanel.js';
import { ClassIcon } from '../icons/index.js';
import { Tooltip } from '../Tooltip.js';
import { formatDps } from '../../utils/format.js';
import { getClassColor } from '../../utils/class-colors.js';
import { compareTiers, type DpsResult } from '@metra/engine';
import type { ScenarioResult } from '@engine/proposals/types.js';

type SortColumn = 'class' | 'skill' | 'tier' | 'dps' | 'capLoss';
type SortDirection = 'asc' | 'desc';

const COLUMN_DEFAULTS: Record<SortColumn, SortDirection> = {
  class: 'asc',
  skill: 'asc',
  tier: 'asc',
  dps: 'desc',
  capLoss: 'desc',
};

function tierDisplayName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function SortArrow({ direction }: { direction: SortDirection }) {
  return <span className="ml-1 text-[10px]">{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>;
}

export function buildTierData(
  row: { className: string; skillName: string },
  allResults: ScenarioResult[],
  capEnabled: boolean,
): { tier: string; dps: number }[] {
  const firstMatch = allResults.find(
    (r) => r.className === row.className && r.skillName === row.skillName,
  );
  if (!firstMatch) return [];

  return allResults
    .filter(
      (r) =>
        r.className === row.className &&
        r.skillName === row.skillName &&
        r.scenario === firstMatch.scenario,
    )
    .sort((a, b) => compareTiers(a.tier, b.tier))
    .map((r) => ({
      tier: r.tier,
      dps: capEnabled ? r.dps.dps : r.dps.uncappedDps,
    }));
}

export function RankingTable({
  data,
  allResults,
  capEnabled,
}: {
  data: { className: string; skillName: string; tier: string; dps: DpsResult; description?: string; isComposite?: boolean }[];
  allResults: ScenarioResult[];
  capEnabled: boolean;
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('dps');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(COLUMN_DEFAULTS[column]);
    }
  };

  const getDps = (r: typeof data[0]) => capEnabled ? r.dps.dps : r.dps.uncappedDps;

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      switch (sortColumn) {
        case 'class': return dir * a.className.localeCompare(b.className);
        case 'skill': return dir * a.skillName.localeCompare(b.skillName);
        case 'tier': return dir * compareTiers(a.tier, b.tier);
        case 'dps': return dir * (getDps(a) - getDps(b));
        case 'capLoss': return dir * (a.dps.capLossPercent - b.dps.capLossPercent);
      }
    });
  }, [data, sortColumn, sortDirection, capEnabled]);

  const thBase = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium';
  const thSortable = `${thBase} cursor-pointer select-none`;
  const columnCount = capEnabled ? 6 : 5;

  return (
    <>
      <div className="overflow-x-auto">
      <table data-testid="ranking-table" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className={thBase}>#</th>
            <th className={`${thSortable} text-left`} onClick={() => handleSort('class')}>
              Class{sortColumn === 'class' && <SortArrow direction={sortDirection} />}
            </th>
            <th className={`${thSortable} text-left`} onClick={() => handleSort('skill')}>
              Skill{sortColumn === 'skill' && <SortArrow direction={sortDirection} />}
            </th>
            <th className={`${thSortable} text-left`} onClick={() => handleSort('tier')}>
              Tier{sortColumn === 'tier' && <SortArrow direction={sortDirection} />}
            </th>
            <th className={`${thSortable} text-right`} onClick={() => handleSort('dps')}>
              DPS{sortColumn === 'dps' && <SortArrow direction={sortDirection} />}
            </th>
            {capEnabled && (
              <th className={`${thSortable} text-right`} onClick={() => handleSort('capLoss')}>
                Cap Loss{sortColumn === 'capLoss' && <SortArrow direction={sortDirection} />}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-3 py-6 text-center text-sm text-text-dim">
                No results for this filter combination
              </td>
            </tr>
          ) : (
            sorted.map((r, i) => {
              const rowKey = `${r.className}-${r.skillName}-${r.tier}`;
              const isExpanded = expandedRows.has(rowKey);
              return (
                <Fragment key={rowKey}>
                  <tr
                    className="border-b border-border-subtle hover:bg-white/[0.03] cursor-pointer"
                    onClick={() => toggleRow(rowKey)}
                  >
                    <td className="px-3 py-2 w-8 text-text-faint">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-[10px] text-text-faint">{isExpanded ? '\u25BE' : '\u25B8'}</span>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <ClassIcon className={r.className} />
                        {r.className}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {r.skillName}
                      {r.description && <Tooltip text={r.description} />}
                    </td>
                    <td className="px-3 py-2 text-text-muted">{tierDisplayName(r.tier)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatDps(getDps(r))}
                    </td>
                    {capEnabled && (
                      <td className="px-3 py-2 text-right tabular-nums text-text-muted">
                        {r.dps.capLossPercent < 0.05 ? '-' : `${r.dps.capLossPercent.toFixed(1)}%`}
                      </td>
                    )}
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={columnCount} className="p-0">
                        <SkillDetailPanel
                          dps={r.dps}
                          tierData={buildTierData(r, allResults, capEnabled)}
                          classColor={getClassColor(r.className)}
                          isComposite={!!r.isComposite}
                          capEnabled={capEnabled}
                          currentTier={r.tier}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
      </div>
      {sorted.length > 0 && (
        <div className="mt-2 text-right text-xs text-text-faint">
          Showing {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
        </div>
      )}
    </>
  );
}
