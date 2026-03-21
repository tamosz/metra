import { useState, useMemo, useRef, useEffect } from 'react';
import { DpsChart } from './DpsChart.js';
import { SimulationDisclaimer } from './SimulationDisclaimer.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import { ElementToggles } from './ElementToggles.js';
import { BuffToggles } from './BuffToggles.js';
import { KbToggle } from './KbToggle.js';
import { CapToggle } from './CapToggle.js';
import { TOGGLE_ON, TOGGLE_OFF } from '../utils/styles.js';
import { useSimulationFilters } from '../context/SimulationFiltersContext.js';
import { useProposalEdit } from '../context/ProposalEditContext.js';
import { useEditComparison } from '../hooks/useEditComparison.js';
import { useBuffBreakdown } from '../hooks/useBuffBreakdown.js';
import { FilterPresets } from './FilterPresets.js';
import { useFilterPresets } from '../hooks/useFilterPresets.js';
import { RankingTable } from './dashboard/RankingTable.js';
import { TargetSpinner } from './dashboard/TargetSpinner.js';
import { EditPopover } from './dashboard/EditPopover.js';
import { EfficiencyPanel } from './EfficiencyPanel.js';
import { resolveActiveScenario } from '../utils/scenario.js';
import { SKILL_GROUPS, isResultVisible, type SkillGroupId } from '../utils/skill-groups.js';
import { useAnimatedDps } from '../hooks/useAnimatedDps.js';
import { FundingScalingChart } from './FundingScalingChart.js';
import { useFundingScaling } from '../hooks/useFundingScaling.js';

interface DashboardProps {
  simulation: SimulationData;
}

export function Dashboard({ simulation }: DashboardProps) {
  const filters = useSimulationFilters();
  const edit = useProposalEdit();
  const presetsState = useFilterPresets();
  const { targetCount, capEnabled, breakdownEnabled, setBreakdownEnabled, activeGroups, toggleGroup } = filters;
  const { editEnabled, setEditEnabled, editChanges } = edit;
  const { results } = simulation;

  const simOptions = useMemo(() => ({
    targetCount: targetCount > 1 ? targetCount : undefined,
    elementModifiers: Object.keys(filters.elementModifiers).length > 0 ? filters.elementModifiers : undefined,
    buffOverrides: Object.keys(filters.buffOverrides).length > 0 ? filters.buffOverrides : undefined,
    kbConfig: filters.kbConfig,
    efficiencyOverrides: Object.keys(filters.efficiencyOverrides).length > 0 ? filters.efficiencyOverrides : undefined,
  }), [targetCount, filters.elementModifiers, filters.buffOverrides, filters.kbConfig, filters.efficiencyOverrides]);
  const comparison = useEditComparison({
    changes: editChanges,
    ...simOptions,
  });
  const showBreakdown = breakdownEnabled && !editEnabled;
  const breakdownMap = useBuffBreakdown(simOptions, results, showBreakdown, capEnabled);
  const filtered = useMemo(() => {
    const activeScenario = resolveActiveScenario(results, targetCount);
    return results
      .filter((r) => {
        if (r.scenario !== activeScenario) return false;
        return isResultVisible(r, activeGroups);
      })
      .sort((a, b) => capEnabled ? b.dps.dps - a.dps.dps : b.dps.uncappedDps - a.dps.uncappedDps);
  }, [results, targetCount, capEnabled, activeGroups]);

  const animationEnabled = !editEnabled && !comparison.result;
  const animation = useAnimatedDps(filtered, capEnabled, animationEnabled);
  const fundingData = useFundingScaling({ activeGroups, capEnabled, simOptions });

  const visibleClassNames = useMemo(
    () => new Set(filtered.map((r) => r.className)),
    [filtered],
  );

  return (
    <div>
      {simulation.error && (
        <div className="mb-4 rounded border border-red-700/30 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          Simulation error: {simulation.error.message}
        </div>
      )}

      <SimulationDisclaimer />

      <div className="mt-8">
        <FilterPresets presetsState={presetsState} />
      </div>

      <div className="mt-3 rounded-lg border border-border-subtle bg-bg-raised/50 px-5 py-4">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <BuffToggles visibleClassNames={visibleClassNames} />
          <ElementToggles />
          <CapToggle />
          <KbToggle />
          <TargetSpinner />

          <div className="self-stretch border-l border-border-default" />

          <SkillGroupToggles activeGroups={activeGroups} onToggle={toggleGroup} />
          <EfficiencyPanel />

          <div className="self-stretch border-l border-border-default" />

          <BreakdownToggle enabled={breakdownEnabled} onToggle={setBreakdownEnabled} />

          <div className="ml-auto flex items-end gap-3">
            <EditModeToggle enabled={editEnabled} onToggle={setEditEnabled} changeCount={editChanges.length} />
            {editEnabled && <EditPopover comparison={comparison} />}
          </div>
        </div>
      </div>

      <div className="mt-6 isolate">
        <DpsChart data={filtered} editComparison={editEnabled ? comparison.result : null} breakdownMap={showBreakdown ? breakdownMap : undefined} animation={animation} />
      </div>

      <div className="mt-6 isolate">
        <FundingScalingChart data={fundingData} />
      </div>

      <div className="relative z-10 mt-6">
        <RankingTable data={filtered} capEnabled={capEnabled} editComparison={editEnabled ? comparison.result : null} animation={animation} />
      </div>
    </div>
  );
}

const GROUP_TOOLTIPS: Record<SkillGroupId, string> = {
  main: 'Headline skills for each class (excludes weapon variants)',
  warriors: 'All skills for Hero, Dark Knight, and Paladin',
  mages: 'All skills for Bishop, Archmage I/L, and Archmage F/P',
  archers: 'All skills for Bowmaster and Marksman',
  thieves: 'All skills for Night Lord and Shadower',
  pirates: 'All skills for Corsair and Buccaneer',
  'multi-target': 'Skills that hit multiple targets',
};

function SkillGroupToggles({ activeGroups, onToggle }: { activeGroups: Set<SkillGroupId>; onToggle: (id: SkillGroupId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const label = activeGroups.size === 0
    ? 'None'
    : activeGroups.size === 1
      ? SKILL_GROUPS.find((g) => activeGroups.has(g.id))?.label ?? 'Skills'
      : `${activeGroups.size} selected`;

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Skills</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`cursor-pointer rounded border px-2 py-0.5 text-xs font-medium transition-colors flex items-center gap-1 ${TOGGLE_OFF}`}
        >
          {label}
          <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
        </button>
        {open && (
          <div role="group" aria-label="Skill group filters" className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded border border-border-default bg-bg-raised py-1 shadow-lg">
            {SKILL_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={activeGroups.has(group.id)}
                title={GROUP_TOOLTIPS[group.id]}
                onClick={() => onToggle(group.id)}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
              >
                <span className={`inline-block h-3 w-3 rounded-sm border ${activeGroups.has(group.id) ? 'border-emerald-500 bg-emerald-600' : 'border-border-default bg-transparent'}`} />
                <span className={activeGroups.has(group.id) ? 'text-emerald-400 font-medium' : 'text-text-muted'}>{group.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Breakdown</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Buff breakdown active — click to hide' : 'Show buff contribution breakdown on bars'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          Buffs
        </button>
      </div>
    </div>
  );
}

function EditModeToggle({ enabled, onToggle, changeCount }: { enabled: boolean; onToggle: (v: boolean) => void; changeCount: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="invisible text-[11px] font-medium uppercase tracking-wide">Label</span>
      <button
        type="button"
        title={enabled ? 'Edit mode active — click to disable' : 'Click to enable edit mode'}
        onClick={() => onToggle(!enabled)}
        className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
      >
        {enabled && changeCount > 0 ? `${changeCount} change${changeCount !== 1 ? 's' : ''}` : 'Edit'}
      </button>
    </div>
  );
}
