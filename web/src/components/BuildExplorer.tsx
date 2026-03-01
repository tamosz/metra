import type { BuildExplorerState } from '../hooks/useBuildExplorer.js';
import { BuildStatEditor } from './BuildStatEditor.js';
import { BuildBuffToggles } from './BuildBuffToggles.js';
import { BuildDpsResults } from './BuildDpsResults.js';
import { SupportClassNote } from './SupportClassNote.js';
import { formatClassName } from '../utils/format.js';

interface BuildExplorerProps {
  state: BuildExplorerState;
}

export function BuildExplorer({ state }: BuildExplorerProps) {
  const {
    classNames, tiers, selectedClass, selectedTier,
    classData, template, overrides,
    setClass, setTier, resetOverrides,
  } = state;

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
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
            className="cursor-pointer rounded border border-red-500/30 bg-transparent px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
          >
            Reset All
          </button>
        )}
      </div>

      <SupportClassNote classNames={[selectedClass]} />

      {template && (
        <div className="mb-6 flex gap-4 text-xs text-text-dim">
          <span>Weapon: {template.weaponType}</span>
          <span>Base Speed: {template.weaponSpeed}</span>
        </div>
      )}

      {template && classData && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            <BuildStatEditor state={state} />
            <BuildBuffToggles state={state} />
          </div>
          <div>
            <BuildDpsResults state={state} />
          </div>
        </div>
      )}

      {!template && selectedClass && (
        <div className="py-6 text-sm text-text-dim">
          No gear template found for {formatClassName(selectedClass)} ({selectedTier}).
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-text-dim">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded border border-border-default bg-bg-surface px-2.5 py-1.5 text-sm text-text-primary focus:border-border-active transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
