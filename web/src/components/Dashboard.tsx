import { useState, useMemo } from 'react';
import { DpsChart } from './DpsChart.js';
import { TierScalingChart } from './TierScalingChart.js';
import { TierPresets } from './TierPresets.js';
import { AssassinateBugNote } from './AssassinateBugNote.js';
import { TierAssumptions } from './TierAssumptions.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { BuildsState } from '../hooks/useBuilds.js';
import { WelcomeBanner } from './WelcomeBanner.js';
import { ElementToggles } from './ElementToggles.js';
import { BuffToggles } from './BuffToggles.js';
import { KbToggle } from './KbToggle.js';
import { CapToggle } from './CapToggle.js';
import { TOGGLE_ON, TOGGLE_OFF } from '../utils/styles.js';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { useEditComparison } from '../hooks/useEditComparison.js';
import { RankingTable } from './dashboard/RankingTable.js';
import { TargetSpinner } from './dashboard/TargetSpinner.js';
import { EditPopover } from './dashboard/EditPopover.js';
import { EfficiencyPanel } from './EfficiencyPanel.js';
import { resolveActiveScenario } from '../utils/scenario.js';
import { VARIANT_CLASSES } from '../utils/class-colors.js';

interface DashboardProps {
  simulation: SimulationData;
  buildsState: BuildsState;
}

export function Dashboard({ simulation, buildsState }: DashboardProps) {
  const controls = useSimulationControls();
  const { selectedTier, targetCount, capEnabled, cgsValues, setCgsValues, editEnabled, setEditEnabled, editChanges } = controls;
  const { results, tiers } = simulation;

  const comparison = useEditComparison({
    changes: editChanges,
    targetCount: targetCount > 1 ? targetCount : undefined,
    elementModifiers: Object.keys(controls.elementModifiers).length > 0 ? controls.elementModifiers : undefined,
    buffOverrides: Object.keys(controls.buffOverrides).length > 0 ? controls.buffOverrides : undefined,
    kbConfig: controls.kbConfig,
    cgsOverride: { tier: selectedTier, values: cgsValues },
    efficiencyOverrides: Object.keys(controls.efficiencyOverrides).length > 0 ? controls.efficiencyOverrides : undefined,
  });
  const [showAllSkills, setShowAllSkills] = useState(false);

  const filtered = useMemo(() => {
    const activeScenario = resolveActiveScenario(results, targetCount);
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
        <EfficiencyPanel />

        <div className="ml-auto border-l border-border-default pl-4 flex items-center gap-3">
          <EditModeToggle enabled={editEnabled} onToggle={setEditEnabled} changeCount={editChanges.length} />
          {editEnabled && <EditPopover comparison={comparison} />}
        </div>
      </div>

      <TierAssumptions />

      <AssassinateBugNote classNames={[...new Set(filtered.map((r) => r.className))]} />

      <TierScalingChart data={results} capEnabled={capEnabled} showAllSkills={showAllSkills} targetCount={targetCount} selectedTier={selectedTier} />
      <div className="mt-6">
        <DpsChart data={filtered} editComparison={editEnabled ? comparison.result : null} />
      </div>

      <div className="mt-6">
        <RankingTable data={filtered} allResults={results} capEnabled={capEnabled} editComparison={editEnabled ? comparison.result : null} />
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

function EditModeToggle({ enabled, onToggle, changeCount }: { enabled: boolean; onToggle: (v: boolean) => void; changeCount: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Edit</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Edit mode active — click to disable' : 'Click to enable edit mode'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          {enabled && changeCount > 0 ? `${changeCount} change${changeCount !== 1 ? 's' : ''}` : 'Edit'}
        </button>
      </div>
    </div>
  );
}
