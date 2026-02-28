import { useState, useMemo } from 'react';
import { DpsChart } from './DpsChart.js';
import type { SimulationData } from '../hooks/useSimulation.js';

interface DashboardProps {
  simulation: SimulationData;
}

type SortColumn = 'class' | 'skill' | 'tier' | 'dps';
type SortDirection = 'asc' | 'desc';

const COLUMN_DEFAULTS: Record<SortColumn, SortDirection> = {
  class: 'asc',
  skill: 'asc',
  tier: 'asc',
  dps: 'desc',
};

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

function SortArrow({ direction }: { direction: SortDirection }) {
  return <span style={{ marginLeft: 4, fontSize: 10 }}>{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>;
}

function RankingTable({ data }: { data: { className: string; skillName: string; tier: string; dps: { dps: number } }[] }) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('dps');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(COLUMN_DEFAULTS[column]);
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      switch (sortColumn) {
        case 'class': return dir * a.className.localeCompare(b.className);
        case 'skill': return dir * a.skillName.localeCompare(b.skillName);
        case 'tier': return dir * a.tier.localeCompare(b.tier);
        case 'dps': return dir * (a.dps.dps - b.dps.dps);
      }
    });
  }, [data, sortColumn, sortDirection]);

  const sortableThStyle = (column: SortColumn): React.CSSProperties => ({
    ...thStyle,
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: column === 'dps' ? 'right' : 'left',
  });

  return (
    <>
      <table data-testid="ranking-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
            <th style={thStyle}>#</th>
            <th style={sortableThStyle('class')} onClick={() => handleSort('class')}>
              Class{sortColumn === 'class' && <SortArrow direction={sortDirection} />}
            </th>
            <th style={sortableThStyle('skill')} onClick={() => handleSort('skill')}>
              Skill{sortColumn === 'skill' && <SortArrow direction={sortDirection} />}
            </th>
            <th style={sortableThStyle('tier')} onClick={() => handleSort('tier')}>
              Tier{sortColumn === 'tier' && <SortArrow direction={sortDirection} />}
            </th>
            <th style={sortableThStyle('dps')} onClick={() => handleSort('dps')}>
              DPS{sortColumn === 'dps' && <SortArrow direction={sortDirection} />}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#666', fontSize: 13 }}>
                No results for this filter combination
              </td>
            </tr>
          ) : (
            sorted.map((r, i) => (
              <tr
                key={`${r.className}-${r.skillName}-${r.tier}`}
                style={{ borderBottom: '1px solid #12121a' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <td style={{ ...tdStyle, color: '#555', width: 32 }}>{i + 1}</td>
                <td style={tdStyle}>{r.className}</td>
                <td style={{ ...tdStyle, color: '#aaa' }}>{r.skillName}</td>
                <td style={{ ...tdStyle, color: '#888' }}>{r.tier.charAt(0).toUpperCase() + r.tier.slice(1)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDps(r.dps.dps)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {sorted.length > 0 && (
        <div style={{ fontSize: 12, color: '#555', marginTop: 8, textAlign: 'right' }}>
          Showing {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
        </div>
      )}
    </>
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
