import type { BuildComparisonState } from '../hooks/useBuildComparison.js';
import type { BuildExplorerState, SkillDpsRow } from '../hooks/useBuildExplorer.js';
import { BuildStatEditor } from './BuildStatEditor.js';
import { BuildBuffToggles } from './BuildBuffToggles.js';
import { BuildDpsResults } from './BuildDpsResults.js';
import { ComparisonSummary } from './ComparisonSummary.js';
import { encodeComparison } from '../utils/url-encoding.js';
import { formatClassName, formatChange, changeColorClass } from '../utils/format.js';
import { TH } from '../utils/styles.js';

interface BuildComparisonProps {
  state: BuildComparisonState;
}

export function BuildComparison({ state }: BuildComparisonProps) {
  const { buildA, buildB, comparison } = state;

  const handleShare = () => {
    const encoded = encodeComparison({
      a: { class: buildA.selectedClass, tier: buildA.selectedTier, overrides: buildA.overrides },
      b: { class: buildB.selectedClass, tier: buildB.selectedTier, overrides: buildB.overrides },
    });
    const url = `${window.location.origin}${window.location.pathname}#c=${encoded}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div>
      {/* Two build panels side by side */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <BuildPanel label="Build A" state={buildA} />
        <BuildPanel label="Build B" state={buildB} />
      </div>

      {/* Comparison summary */}
      {comparison.bestA && comparison.bestB && (
        <ComparisonSummary
          classA={buildA.selectedClass}
          classB={buildB.selectedClass}
          bestA={comparison.bestA}
          bestB={comparison.bestB}
          deltaPercent={comparison.deltaPercent}
        />
      )}

      {/* Skill tables */}
      {comparison.sameClass ? (
        <SameClassDeltas resultsA={buildA.results} resultsB={buildB.results} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <BuildDpsResults state={buildA} showCopyLink={false} />
          <BuildDpsResults state={buildB} showCopyLink={false} />
        </div>
      )}

      {/* Copy Link */}
      <div className="mt-4 text-right">
        <button
          onClick={handleShare}
          className="cursor-pointer rounded border border-border-default bg-transparent px-3.5 py-1 text-xs text-text-muted transition-colors hover:border-border-active hover:text-text-bright"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}

function BuildPanel({ label, state }: { label: string; state: BuildExplorerState }) {
  const {
    classNames, tiers, selectedClass, selectedTier,
    classData, template, overrides,
    setClass, setTier, resetOverrides,
  } = state;

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-text-dim">
        {label}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          label="Class"
          value={selectedClass}
          options={classNames.map((c) => ({ value: c, label: formatClassName(c) }))}
          onChange={setClass}
        />
        <Select
          label="Tier"
          value={selectedTier}
          options={tiers.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          onChange={setTier}
        />
        {hasOverrides && (
          <button
            onClick={resetOverrides}
            className="cursor-pointer rounded border border-negative/30 bg-transparent px-2.5 py-1 text-[11px] text-negative"
          >
            Reset
          </button>
        )}
      </div>

      {template && (
        <div className="mb-4 flex gap-3 text-[11px] text-text-dim">
          <span>Weapon: {template.weaponType}</span>
          <span>Speed: {template.weaponSpeed}</span>
        </div>
      )}

      {template && classData && (
        <div className="flex flex-col gap-4">
          <BuildStatEditor state={state} />
          <BuildBuffToggles state={state} />
        </div>
      )}

      {!template && selectedClass && (
        <div className="py-4 text-xs text-text-dim">
          No template for {formatClassName(selectedClass)} ({selectedTier}).
        </div>
      )}
    </div>
  );
}

function SameClassDeltas({ resultsA, resultsB }: { resultsA: SkillDpsRow[]; resultsB: SkillDpsRow[] }) {
  const rows = resultsA.map((a) => {
    const b = resultsB.find((r) => r.skillName === a.skillName);
    const bDps = b?.dps ?? 0;
    const delta = a.dps > 0 ? ((bDps - a.dps) / a.dps) * 100 : 0;
    return { skillName: a.skillName, dpsA: a.dps, dpsB: bDps, delta };
  });

  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Per-Skill Comparison
      </div>
      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className={`${TH} text-left`}>Skill</th>
            <th className={`${TH} text-right`}>Build A</th>
            <th className={`${TH} text-right`}>Build B</th>
            <th className={`${TH} text-right`}>Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.skillName} className="border-b border-border-subtle">
              <td className="px-3 py-2 text-text-primary">{row.skillName}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {Math.round(row.dpsA).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {Math.round(row.dpsB).toLocaleString()}
              </td>
              <td className={`px-3 py-2 text-right tabular-nums ${changeColorClass(row.delta)}`}>
                {formatChange(row.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-wide text-text-dim">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded border border-border-default bg-bg-surface px-2 py-1 text-xs text-text-bright outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

