import type { BuildExplorerState } from '../hooks/useBuildExplorer.js';
import { BuildStatEditor } from './BuildStatEditor.js';
import { BuildBuffToggles } from './BuildBuffToggles.js';
import { BuildDpsResults } from './BuildDpsResults.js';

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
      {/* Class / Tier selectors */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
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
            style={{
              background: 'transparent',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.3)',
              padding: '5px 12px',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Reset All
          </button>
        )}
      </div>

      {/* Weapon info */}
      {template && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 24, display: 'flex', gap: 16 }}>
          <span>Weapon: {template.weaponType}</span>
          <span>Base Speed: {template.weaponSpeed}</span>
        </div>
      )}

      {template && classData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left column: stats + buffs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <BuildStatEditor state={state} />
            <BuildBuffToggles state={state} />
          </div>

          {/* Right column: results */}
          <div>
            <BuildDpsResults state={state} />
          </div>
        </div>
      )}

      {!template && selectedClass && (
        <div style={{ color: '#666', fontSize: 13, padding: '24px 0' }}>
          No gear template found for {formatClassName(selectedClass)} ({selectedTier}).
        </div>
      )}
    </div>
  );
}

function formatClassName(name: string): string {
  // hero-axe → Hero (Axe), drk → DrK, nl → NL, sair → Corsair, bucc → Buccaneer
  const special: Record<string, string> = {
    'drk': 'DrK',
    'nl': 'NL',
    'sair': 'Corsair',
    'bucc': 'Buccaneer',
    'hero-axe': 'Hero (Axe)',
    'mm': 'Marksman',
  };
  if (special[name]) return special[name];
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#1a1a2a',
          color: '#e0e0e8',
          border: '1px solid #2a2a3e',
          padding: '5px 10px',
          borderRadius: 4,
          fontSize: 13,
          cursor: 'pointer',
          outline: 'none',
        }}
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
