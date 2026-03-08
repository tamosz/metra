import { useState, useMemo } from 'react';
import { DpsChart } from './DpsChart.js';
import { TierScalingChart } from './TierScalingChart.js';
import { TierPresets } from './TierPresets.js';
import { SupportClassNote } from './SupportClassNote.js';
import { AssassinateBugNote } from './AssassinateBugNote.js';
import { ArcherPassiveNote } from './ArcherPassiveNote.js';
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
import { RankingTable } from './dashboard/RankingTable.js';
import { TargetSpinner } from './dashboard/TargetSpinner.js';
import { EfficiencyPanel } from './EfficiencyPanel.js';
import { resolveActiveScenario } from '../utils/scenario.js';

interface DashboardProps {
  simulation: SimulationData;
  buildsState: BuildsState;
}

const VARIANT_CLASSES = new Set(['Hero (Axe)', 'Paladin (BW)']);

export function Dashboard({ simulation, buildsState }: DashboardProps) {
  const { selectedTier, targetCount, capEnabled, cgsValues, setCgsValues, setSelectedTier } = useSimulationControls();
  const { results, tiers } = simulation;
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [chartView, setChartView] = useState<'bar' | 'scaling'>('bar');

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
        <ChartViewToggle view={chartView} onToggle={setChartView} />
        <EfficiencyPanel />
      </div>

      <TierAssumptions />

      <SupportClassNote classNames={[...new Set(filtered.map((r) => r.className))]} />
      <AssassinateBugNote classNames={[...new Set(filtered.map((r) => r.className))]} />
      <ArcherPassiveNote classNames={[...new Set(filtered.map((r) => r.className))]} />

      {chartView === 'bar' ? (
        <DpsChart data={filtered} />
      ) : (
        <TierScalingChart data={results} capEnabled={capEnabled} showAllSkills={showAllSkills} targetCount={targetCount} />
      )}

      <div className="mt-6">
        <RankingTable data={filtered} allResults={results} capEnabled={capEnabled} />
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

function ChartViewToggle({ view, onToggle }: { view: 'bar' | 'scaling'; onToggle: (v: 'bar' | 'scaling') => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">View</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title="Bar chart — DPS ranking for selected tier"
          onClick={() => onToggle('bar')}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${view === 'bar' ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          Bar
        </button>
        <button
          type="button"
          title="Tier scaling — DPS across all tiers"
          onClick={() => onToggle('scaling')}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${view === 'scaling' ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          Scaling
        </button>
      </div>
    </div>
  );
}
