import { useState, useMemo, useCallback } from 'react';
import { DpsChart } from './DpsChart.js';
import { FilterGroup } from './FilterGroup.js';
import { SupportClassNote } from './SupportClassNote.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { CustomTiersState } from '../hooks/useCustomTiers.js';
import { compareTiers } from '@engine/data/types.js';
import { ClassIcon } from './icons/index.js';
import { WelcomeBanner } from './WelcomeBanner.js';
import { CustomTierList } from './CustomTierList.js';
import { useSpinner } from '../hooks/useSpinner.js';
import { formatDps } from '../utils/format.js';
import { ElementToggles } from './ElementToggles.js';
import { BuffToggles } from './BuffToggles.js';
import type { BuffOverrides } from './BuffToggles.js';
import { KbToggle } from './KbToggle.js';

interface DashboardProps {
  simulation: SimulationData;
  customTiers: CustomTiersState;
  baseTiers: string[];
  targetCount: number;
  setTargetCount: (n: number) => void;
  elementModifiers: Record<string, number>;
  setElementModifiers: (mods: Record<string, number>) => void;
  buffOverrides: BuffOverrides;
  setBuffOverrides: (overrides: BuffOverrides) => void;
  kbEnabled: boolean;
  setKbEnabled: (enabled: boolean) => void;
  bossAttackInterval: number;
  setBossAttackInterval: (n: number) => void;
  bossAccuracy: number;
  setBossAccuracy: (n: number) => void;
}

type SortColumn = 'class' | 'skill' | 'tier' | 'dps';
type SortDirection = 'asc' | 'desc';

const COLUMN_DEFAULTS: Record<SortColumn, SortDirection> = {
  class: 'asc',
  skill: 'asc',
  tier: 'asc',
  dps: 'desc',
};

function tierDisplayName(tier: string, customTierNames: Map<string, string>): string {
  const custom = customTierNames.get(tier);
  if (custom) return custom;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function Dashboard({ simulation, customTiers, baseTiers, targetCount, setTargetCount, elementModifiers, setElementModifiers, buffOverrides, setBuffOverrides, kbEnabled, setKbEnabled, bossAttackInterval, setBossAttackInterval, bossAccuracy, setBossAccuracy }: DashboardProps) {
  const { results, tiers, customTierNames } = simulation;
  const [selectedTier, setSelectedTier] = useState<string | 'all'>('all');

  const filtered = useMemo(() => {
    const activeScenario = targetCount > 1
      ? results.find((r) => r.scenario.startsWith('Training'))?.scenario
      : results[0]?.scenario;
    return results
      .filter((r) => {
        if (r.scenario !== activeScenario) return false;
        if (selectedTier !== 'all' && r.tier !== selectedTier) return false;
        return true;
      })
      .sort((a, b) => b.dps.dps - a.dps.dps);
  }, [results, selectedTier, targetCount]);

  return (
    <div>
      <WelcomeBanner />

      <CustomTierList customTiers={customTiers} baseTiers={baseTiers} />

      <div className="mb-6 flex items-center gap-4">
        <FilterGroup
          label="Tier"
          value={selectedTier}
          options={[
            { value: 'all', label: 'All Tiers' },
            ...tiers.map((t) => ({ value: t, label: tierDisplayName(t, customTierNames) })),
          ]}
          onChange={setSelectedTier}
        />
        <TargetSpinner value={targetCount} onChange={setTargetCount} />
        <ElementToggles modifiers={elementModifiers} onChange={setElementModifiers} />
        <BuffToggles overrides={buffOverrides} onChange={setBuffOverrides} />
        <KbToggle
          enabled={kbEnabled}
          onToggle={setKbEnabled}
          bossAttackInterval={bossAttackInterval}
          onIntervalChange={setBossAttackInterval}
          bossAccuracy={bossAccuracy}
          onAccuracyChange={setBossAccuracy}
        />
      </div>

      <SupportClassNote classNames={[...new Set(filtered.map((r) => r.className))]} />

      <DpsChart data={filtered} />

      <div className="mt-6">
        <RankingTable data={filtered} customTierNames={customTierNames} />
      </div>
    </div>
  );
}

function TargetSpinner({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const clamp = (n: number) => Math.max(1, Math.min(15, n));

  const decrement = useCallback(() => {
    onChange(clamp(value - 1));
  }, [value, onChange]);

  const increment = useCallback(() => {
    onChange(clamp(value + 1));
  }, [value, onChange]);

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
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(clamp(v));
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

function SortArrow({ direction }: { direction: SortDirection }) {
  return <span className="ml-1 text-[10px]">{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>;
}

function RankingTable({
  data,
  customTierNames,
}: {
  data: { className: string; skillName: string; tier: string; dps: { dps: number } }[];
  customTierNames: Map<string, string>;
}) {
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
                <td className="px-3 py-2 text-text-muted">{tierDisplayName(r.tier, customTierNames)}</td>
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
