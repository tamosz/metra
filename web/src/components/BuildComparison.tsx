import type { BuildComparisonState } from '../hooks/useBuildComparison.js';
import type { BuildExplorerState, SkillDpsRow } from '../hooks/useBuildExplorer.js';
import { BuildStatEditor } from './BuildStatEditor.js';
import { BuildBuffToggles } from './BuildBuffToggles.js';
import { BuildDpsResults } from './BuildDpsResults.js';
import { ComparisonSummary } from './ComparisonSummary.js';
import { encodeComparison } from '../utils/url-encoding.js';
import { formatClassName } from '../utils/format.js';

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <BuildDpsResults state={buildA} showCopyLink={false} />
          <BuildDpsResults state={buildB} showCopyLink={false} />
        </div>
      )}

      {/* Copy Link */}
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <button
          onClick={handleShare}
          style={{
            background: 'transparent', color: '#888',
            border: '1px solid #2a2a3e', padding: '5px 14px',
            borderRadius: 4, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e0e0e8';
            e.currentTarget.style.borderColor = '#3a3a5e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
            e.currentTarget.style.borderColor = '#2a2a3e';
          }}
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
    <div style={{
      background: '#0e0e16',
      border: '1px solid #1e1e2e',
      borderRadius: 8,
      padding: 16,
    }}>
      <div style={{
        fontSize: 11, color: '#555', textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 12, fontWeight: 500,
      }}>
        {label}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
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
              background: 'transparent', color: '#f87171',
              border: '1px solid rgba(248,113,113,0.3)', padding: '4px 10px',
              borderRadius: 4, fontSize: 11, cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {template && (
        <div style={{ fontSize: 11, color: '#555', marginBottom: 16, display: 'flex', gap: 12 }}>
          <span>Weapon: {template.weaponType}</span>
          <span>Speed: {template.weaponSpeed}</span>
        </div>
      )}

      {template && classData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BuildStatEditor state={state} />
          <BuildBuffToggles state={state} />
        </div>
      )}

      {!template && selectedClass && (
        <div style={{ color: '#555', fontSize: 12, padding: '16px 0' }}>
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
      <div style={{
        fontSize: 11, color: '#666', textTransform: 'uppercase',
        letterSpacing: '0.05em', fontWeight: 500, marginBottom: 8,
      }}>
        Per-Skill Comparison
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
            <th style={thStyle}>Skill</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Build A</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Build B</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.skillName} style={{ borderBottom: '1px solid #12121a' }}>
              <td style={{ ...tdStyle, color: '#ccc' }}>{row.skillName}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(row.dpsA).toLocaleString()}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(row.dpsB).toLocaleString()}
              </td>
              <td style={{
                ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                color: changeColor(row.delta),
              }}>
                {formatChange(row.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#1a1a2a', color: '#e0e0e8',
          border: '1px solid #2a2a3e', padding: '4px 8px',
          borderRadius: 4, fontSize: 12, cursor: 'pointer', outline: 'none',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function formatChange(percent: number): string {
  if (Math.abs(percent) < 0.01) return '0.0%';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

function changeColor(percent: number): string {
  if (Math.abs(percent) < 0.01) return '#555';
  return percent > 0 ? '#4ade80' : '#f87171';
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.05em', color: '#666', fontWeight: 500, textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
};
