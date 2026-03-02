import { useState } from 'react';
import type { BuildExplorerState } from '../hooks/useBuildExplorer.js';
import type { SavedBuildsState } from '../hooks/useSavedBuilds.js';
import { BuildStatEditor } from './BuildStatEditor.js';
import { BuildBuffToggles } from './BuildBuffToggles.js';
import { BuildDpsResults } from './BuildDpsResults.js';
import { SupportClassNote } from './SupportClassNote.js';
import { MarginalGainsTable } from './MarginalGainsTable.js';
import { formatClassName } from '../utils/format.js';

interface BuildExplorerProps {
  state: BuildExplorerState;
  savedBuilds: SavedBuildsState;
}

export function BuildExplorer({ state, savedBuilds }: BuildExplorerProps) {
  const {
    classNames, tiers, selectedClass, selectedTier,
    classData, template, overrides,
    setClass, setTier, resetOverrides, loadFromUrl,
  } = state;

  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const hasOverrides = Object.keys(overrides).length > 0;

  const relevantBuilds = savedBuilds.builds.filter(
    (b) => b.className === selectedClass
  );

  const handleSave = () => {
    if (!saveName.trim()) return;
    savedBuilds.save(saveName.trim(), selectedClass, selectedTier, overrides);
    setSaveName('');
    setShowSaveInput(false);
  };

  const handleLoad = (buildId: string) => {
    const build = savedBuilds.builds.find((b) => b.id === buildId);
    if (!build) return;
    loadFromUrl(build.className, build.tier, build.overrides);
  };

  const actionBtn =
    'cursor-pointer rounded border border-border-default bg-transparent px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-border-active hover:text-text-secondary';

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
            className="cursor-pointer rounded border border-negative/30 bg-transparent px-3 py-1.5 text-xs text-negative transition-colors hover:bg-negative/10"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {!showSaveInput ? (
          <button onClick={() => setShowSaveInput(true)} className={actionBtn}>
            Save Build
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Build name..."
              className="w-36 rounded border border-border-default bg-bg-surface px-2 py-1 text-sm text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="cursor-pointer rounded border border-border-active bg-bg-active px-2 py-1 text-xs text-text-bright disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => { setShowSaveInput(false); setSaveName(''); }}
              className="cursor-pointer border-none bg-transparent px-1 text-xs text-text-dim hover:text-text-muted"
            >
              Cancel
            </button>
          </div>
        )}
        {relevantBuilds.length > 0 && (
          <Select
            label="Load"
            value=""
            options={[
              { value: '', label: 'Saved builds...' },
              ...relevantBuilds.map((b) => ({ value: b.id, label: `${b.name} (${b.tier})` })),
            ]}
            onChange={(v) => { if (v) handleLoad(v); }}
          />
        )}
        {relevantBuilds.length > 0 && (
          <div className="flex gap-1">
            {relevantBuilds.map((b) => (
              <button
                key={b.id}
                onClick={() => savedBuilds.remove(b.id)}
                className="cursor-pointer border-none bg-transparent px-1 py-0.5 text-[10px] text-negative/50 transition-colors hover:text-negative"
                title={`Delete "${b.name}"`}
              >
                x {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <SupportClassNote classNames={[formatClassName(selectedClass)]} />

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
            {state.effectiveBuild && state.classData && (
              <MarginalGainsTable
                build={state.effectiveBuild}
                classData={state.classData}
              />
            )}
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
