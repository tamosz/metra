import { useState, useMemo } from 'react';
import { DpsChart } from './DpsChart.js';
import type { SimulationData } from '../hooks/useSimulation.js';

interface DashboardProps {
  simulation: SimulationData;
}

export function Dashboard({ simulation }: DashboardProps) {
  const { results, tiers, scenarios } = simulation;
  const [selectedScenario, setSelectedScenario] = useState('Buffed');
  const [selectedTier, setSelectedTier] = useState<string | 'all'>('all');

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (r.scenario !== selectedScenario) return false;
      if (selectedTier !== 'all' && r.tier !== selectedTier) return false;
      return true;
    }).sort((a, b) => b.dps.dps - a.dps.dps);
  }, [results, selectedScenario, selectedTier]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <FilterGroup
          label="Scenario"
          value={selectedScenario}
          options={scenarios.map((s) => ({ value: s, label: s }))}
          onChange={setSelectedScenario}
        />
        <FilterGroup
          label="Tier"
          value={selectedTier}
          options={[
            { value: 'all', label: 'All Tiers' },
            ...tiers.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
          ]}
          onChange={setSelectedTier}
        />
      </div>

      <DpsChart data={filtered} />

      <div style={{ marginTop: 24 }}>
        <RankingTable data={filtered} />
      </div>
    </div>
  );
}

function FilterGroup({
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 2 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              background: value === opt.value ? '#2a2a3e' : 'transparent',
              color: value === opt.value ? '#f0f0f8' : '#666',
              border: value === opt.value ? '1px solid #3a3a5e' : '1px solid transparent',
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}

function RankingTable({ data }: { data: { className: string; skillName: string; tier: string; dps: { dps: number } }[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
          <th style={thStyle}>#</th>
          <th style={{ ...thStyle, textAlign: 'left' }}>Class</th>
          <th style={{ ...thStyle, textAlign: 'left' }}>Skill</th>
          <th style={{ ...thStyle, textAlign: 'left' }}>Tier</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>DPS</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={`${r.className}-${r.skillName}-${r.tier}`} style={{ borderBottom: '1px solid #12121a' }}>
            <td style={{ ...tdStyle, color: '#555', width: 32 }}>{i + 1}</td>
            <td style={tdStyle}>{r.className}</td>
            <td style={{ ...tdStyle, color: '#aaa' }}>{r.skillName}</td>
            <td style={{ ...tdStyle, color: '#888' }}>{r.tier.charAt(0).toUpperCase() + r.tier.slice(1)}</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatDps(r.dps.dps)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#666',
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
};
