import { useState, useMemo } from 'react';
import { DpsChart } from './DpsChart.js';
import { FilterGroup } from './FilterGroup.js';
import { SupportClassNote } from './SupportClassNote.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import { compareTiers } from '@engine/data/types.js';
import { SCENARIO_DESCRIPTIONS } from '../utils/game-terms.js';
import { ClassIcon } from './icons/index.js';
import { WelcomeBanner } from './WelcomeBanner.js';

interface DashboardProps {
  simulation: SimulationData;
}

type SortColumn = 'class' | 'skill' | 'tier' | 'dps';
type SortDirection = 'asc' | 'desc';

const COLUMN_DEFAULTS: Record<SortColumn, SortDirection> = {
  class: 'asc',
  skill: 'asc',
  tier: 'asc',
  dps: 'desc',
};

export function Dashboard({ simulation }: DashboardProps) {
  const { results, tiers, scenarios } = simulation;
  const [selectedScenario, setSelectedScenario] = useState('Buffed');
  const [selectedTier, setSelectedTier] = useState<string | 'all'>('all');

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (r.scenario !== selectedScenario) return false;
      if (selectedTier !== 'all' && r.tier !== selectedTier) return false;
      return true;
    }).sort((a, b) => b.dps.dps - a.dps.dps);
  }, [results, selectedScenario, selectedTier]);

  return (
    <div>
      <WelcomeBanner />
      <div className="mb-6 flex flex-wrap gap-4">
        <FilterGroup
          label="Scenario"
          value={selectedScenario}
          options={scenarios.map((s) => ({ value: s, label: s, tooltip: SCENARIO_DESCRIPTIONS[s] }))}
          onChange={setSelectedScenario}
        />
        <FilterGroup
          label="Tier"
          value={selectedTier}
          options={[
            { value: 'all', label: 'All Tiers' },
            ...tiers.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
          ]}
          onChange={setSelectedTier}
        />
      </div>

      <SupportClassNote classNames={[...new Set(filtered.map((r) => r.className))]} />

      <DpsChart data={filtered} />

      <div className="mt-6">
        <RankingTable data={filtered} />
      </div>
    </div>
  );
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}

function SortArrow({ direction }: { direction: SortDirection }) {
  return <span className="ml-1 text-[10px]">{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>;
}

function RankingTable({ data }: { data: { className: string; skillName: string; tier: string; dps: { dps: number } }[] }) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('dps');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(COLUMN_DEFAULTS[column]);
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      switch (sortColumn) {
        case 'class': return dir * a.className.localeCompare(b.className);
        case 'skill': return dir * a.skillName.localeCompare(b.skillName);
        case 'tier': return dir * compareTiers(a.tier, b.tier);
        case 'dps': return dir * (a.dps.dps - b.dps.dps);
      }
    });
  }, [data, sortColumn, sortDirection]);

  const thBase = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium';
  const thSortable = `${thBase} cursor-pointer select-none`;

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
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-text-dim">
                No results for this filter combination
              </td>
            </tr>
          ) : (
            sorted.map((r, i) => (
              <tr
                key={`${r.className}-${r.skillName}-${r.tier}`}
                className="border-b border-border-subtle hover:bg-white/[0.03]"
              >
                <td className="px-3 py-2 w-8 text-text-faint">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <ClassIcon className={r.className} />
                    {r.className}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-secondary">{r.skillName}</td>
                <td className="px-3 py-2 text-text-muted">{r.tier.charAt(0).toUpperCase() + r.tier.slice(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatDps(r.dps.dps)}
                </td>
              </tr>
            ))
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
