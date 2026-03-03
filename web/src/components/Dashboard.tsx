import { Fragment, memo, useState, useMemo, useCallback } from 'react';
import { DpsChart } from './DpsChart.js';
import { TierPresets } from './TierPresets.js';
import { SupportClassNote } from './SupportClassNote.js';
import { TierAssumptions } from './TierAssumptions.js';
import { SkillDetailPanel } from './SkillDetailPanel.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { BuildsState } from '../hooks/useBuilds.js';
import { compareTiers } from '@engine/data/types.js';
import { ClassIcon } from './icons/index.js';
import { WelcomeBanner } from './WelcomeBanner.js';
import { useSpinner } from '../hooks/useSpinner.js';
import { formatDps } from '../utils/format.js';
import { ElementToggles } from './ElementToggles.js';
import { BuffToggles } from './BuffToggles.js';
import { KbToggle } from './KbToggle.js';
import { Tooltip } from './Tooltip.js';
import { CapToggle } from './CapToggle.js';
import { getClassColor } from '../utils/class-colors.js';
import { TOGGLE_ON, TOGGLE_OFF, TH } from '../utils/styles.js';
import type { DpsResult } from '@engine/engine/dps.js';
import type { ScenarioResult } from '@engine/proposals/types.js';
import { useSimulationControls } from '../context/SimulationControlsContext.js';

interface DashboardProps {
  simulation: SimulationData;
  buildsState: BuildsState;
}

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

const VARIANT_CLASSES = new Set(['Hero (Axe)', 'Paladin (BW)']);

export function Dashboard({ simulation, buildsState }: DashboardProps) {
  const { selectedTier, targetCount, capEnabled, cgsValues, setCgsValues, setSelectedTier } = useSimulationControls();
  const { results, tiers } = simulation;
  const [showAllSkills, setShowAllSkills] = useState(false);

  const filtered = useMemo(() => {
    const activeScenario = targetCount > 1
      ? results.find((r) => r.scenario.startsWith('Training'))?.scenario
      : results[0]?.scenario;
    return results
      .filter((r) => {
        if (r.scenario !== activeScenario) return false;
        if (r.tier !== selectedTier) return false;
        if (!showAllSkills && r.headline === false) return false;
        if (!showAllSkills && VARIANT_CLASSES.has(r.className)) return false;
        return true;
      })
      .sort((a, b) => capEnabled ? b.dps.dps - a.dps.dps : b.dps.uncappedDps - a.dps.uncappedDps);
  }, [results, selectedTier, targetCount, capEnabled, showAllSkills]);

  return (
    <div>
      <WelcomeBanner />

      {simulation.error && (
        <div className="mb-4 rounded border border-red-700/30 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          Simulation error: {simulation.error.message}
        </div>
      )}


      <div className="mb-6 flex items-center gap-4">
        <TierPresets
          tiers={tiers}
          builds={buildsState.builds}
          activeBuildId={buildsState.activeBuildId}
          onSaveBuild={(name) => {
            const build = buildsState.save(name, cgsValues);
            buildsState.setActive(build.id);
          }}
          onSelectBuild={(id) => {
            const build = buildsState.builds.find((b) => b.id === id);
            if (build) {
              setCgsValues({ ...build.cgs });
              buildsState.setActive(id);
            }
          }}
          onDeleteBuild={(id) => buildsState.remove(id)}
          onClearBuild={() => buildsState.setActive(null)}
        />
        <TargetSpinner />
        <ElementToggles />
        <BuffToggles />
        <KbToggle />
        <CapToggle />
        <AllSkillsToggle enabled={showAllSkills} onToggle={setShowAllSkills} />
      </div>

      <TierAssumptions />

      <SupportClassNote classNames={[...new Set(filtered.map((r) => r.className))]} />

      <DpsChart data={filtered} />

      <div className="mt-6">
        <RankingTable data={filtered} allResults={results} capEnabled={capEnabled} />
      </div>
    </div>
  );
}

function TargetSpinner() {
  const { targetCount, setTargetCount } = useSimulationControls();
  const clamp = (n: number) => Math.max(1, Math.min(15, n));

  const decrement = useCallback(() => {
    setTargetCount(clamp(targetCount - 1));
  }, [targetCount, setTargetCount]);

  const increment = useCallback(() => {
    setTargetCount(clamp(targetCount + 1));
  }, [targetCount, setTargetCount]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Targets</span>
      <div className="flex items-stretch overflow-hidden rounded border border-border-default">
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...decSpinner}
        >
          &minus;
        </button>
        <input
          type="number"
          value={targetCount}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) setTargetCount(clamp(v));
          }}
          className="w-[36px] border-x border-border-default bg-bg-raised px-1 py-1 text-center text-sm tabular-nums text-text-primary focus:border-border-active transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...incSpinner}
        >
          +
        </button>
      </div>
    </div>
  );
}

function AllSkillsToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Skills</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Showing all skills — click to show only headline skills' : 'Showing headline skills only — click to show all'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          All
        </button>
      </div>
    </div>
  );
}

const SortArrow = memo(function SortArrow({ direction }: { direction: SortDirection }) {
  return <span className="ml-1 text-[10px]">{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>;
});

function buildTierData(
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

function RankingTable({
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

  const columnCount = capEnabled ? 6 : 5;

  return (
    <>
      <div className="overflow-x-auto">
      <table data-testid="ranking-table" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className={TH}>#</th>
            <th className={`${TH} text-left`} aria-sort={sortColumn === 'class' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>
              <button type="button" onClick={() => handleSort('class')} className="cursor-pointer select-none bg-transparent border-none p-0 text-inherit font-inherit">
                Class{sortColumn === 'class' && <SortArrow direction={sortDirection} />}
              </button>
            </th>
            <th className={`${TH} text-left`} aria-sort={sortColumn === 'skill' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>
              <button type="button" onClick={() => handleSort('skill')} className="cursor-pointer select-none bg-transparent border-none p-0 text-inherit font-inherit">
                Skill{sortColumn === 'skill' && <SortArrow direction={sortDirection} />}
              </button>
            </th>
            <th className={`${TH} text-left`} aria-sort={sortColumn === 'tier' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>
              <button type="button" onClick={() => handleSort('tier')} className="cursor-pointer select-none bg-transparent border-none p-0 text-inherit font-inherit">
                Tier{sortColumn === 'tier' && <SortArrow direction={sortDirection} />}
              </button>
            </th>
            <th className={`${TH} text-right`} aria-sort={sortColumn === 'dps' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>
              <button type="button" onClick={() => handleSort('dps')} className="cursor-pointer select-none bg-transparent border-none p-0 text-inherit font-inherit">
                DPS{sortColumn === 'dps' && <SortArrow direction={sortDirection} />}
              </button>
            </th>
            {capEnabled && (
              <th className={`${TH} text-right`} aria-sort={sortColumn === 'capLoss' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>
                <button type="button" onClick={() => handleSort('capLoss')} className="cursor-pointer select-none bg-transparent border-none p-0 text-inherit font-inherit">
                  Cap Loss{sortColumn === 'capLoss' && <SortArrow direction={sortDirection} />}
                </button>
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
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(rowKey); } }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
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
