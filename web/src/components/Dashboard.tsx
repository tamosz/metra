import { useState, useMemo } from 'react';
import { DpsChart } from './DpsChart.js';
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
import { useWhatIfComparison } from '../hooks/useWhatIfComparison.js';
import { RankingTable } from './dashboard/RankingTable.js';
import { TargetSpinner } from './dashboard/TargetSpinner.js';
import { EfficiencyPanel } from './EfficiencyPanel.js';

interface DashboardProps {
  simulation: SimulationData;
  buildsState: BuildsState;
}

const VARIANT_CLASSES = new Set(['Hero (Axe)', 'Paladin (BW)']);

export function Dashboard({ simulation, buildsState }: DashboardProps) {
  const controls = useSimulationControls();
  const { selectedTier, targetCount, capEnabled, cgsValues, setCgsValues, setSelectedTier, whatIfEnabled, setWhatIfEnabled, whatIfChanges } = controls;
  const { results, tiers } = simulation;

  const comparison = useWhatIfComparison({
    changes: whatIfChanges,
    targetCount: targetCount > 1 ? targetCount : undefined,
    elementModifiers: Object.keys(controls.elementModifiers).length > 0 ? controls.elementModifiers : undefined,
    buffOverrides: Object.keys(controls.buffOverrides).length > 0 ? controls.buffOverrides : undefined,
    kbConfig: controls.kbConfig,
    cgsOverride: { tier: selectedTier, values: cgsValues },
    efficiencyOverrides: Object.keys(controls.efficiencyOverrides).length > 0 ? controls.efficiencyOverrides : undefined,
  });
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
        <WhatIfToggle enabled={whatIfEnabled} onToggle={setWhatIfEnabled} changeCount={whatIfChanges.length} />
        <EfficiencyPanel />
      </div>

      <TierAssumptions />

      <AssassinateBugNote classNames={[...new Set(filtered.map((r) => r.className))]} />

      <DpsChart data={filtered} whatIfComparison={whatIfEnabled ? comparison.result : null} />

      <div className="mt-6">
        <RankingTable data={filtered} allResults={results} capEnabled={capEnabled} whatIfComparison={whatIfEnabled ? comparison.result : null} />
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

function WhatIfToggle({ enabled, onToggle, changeCount }: { enabled: boolean; onToggle: (v: boolean) => void; changeCount: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">What If</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'What-if mode active — click to disable' : 'Click to enable what-if mode'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          {enabled && changeCount > 0 ? `${changeCount} change${changeCount !== 1 ? 's' : ''}` : 'Edit'}
        </button>
      </div>
    </div>
  );
}
