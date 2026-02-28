import type { BuildExplorerState } from '../hooks/useBuildExplorer.js';
import { encodeBuild } from '../utils/url-encoding.js';

interface BuildDpsResultsProps {
  state: BuildExplorerState;
}

export function BuildDpsResults({ state }: BuildDpsResultsProps) {
  const { results, selectedClass, selectedTier, overrides } = state;

  const handleShare = () => {
    const encoded = encodeBuild({ class: selectedClass, tier: selectedTier, overrides });
    const url = `${window.location.origin}${window.location.pathname}#b=${encoded}`;
    navigator.clipboard.writeText(url);
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          fontSize: 11,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}>
          DPS Results
        </div>
        <button
          onClick={handleShare}
          style={{
            background: 'transparent',
            color: '#888',
            border: '1px solid #2a2a3e',
            padding: '3px 10px',
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.15s',
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

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
            <th style={thStyle}>Skill</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Your DPS</th>
            {hasOverrides && (
              <>
                <th style={{ ...thStyle, textAlign: 'right' }}>Template</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Change</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr
              key={row.skillName}
              style={{ borderBottom: '1px solid #12121a' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <td style={{ ...tdStyle, color: '#ccc' }}>{row.skillName}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatDps(row.dps)}
              </td>
              {hasOverrides && (
                <>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#666', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDps(row.baselineDps)}
                  </td>
                  <td style={{
                    ...tdStyle,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: changeColor(row.changePercent),
                  }}>
                    {formatChange(row.changePercent)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {results.length === 0 && (
        <div style={{ color: '#555', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
          No skills found for this class.
        </div>
      )}
    </div>
  );
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
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
  padding: '8px 12px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#666',
  fontWeight: 500,
  textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
};
