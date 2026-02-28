import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import type { ComparisonResult, DeltaEntry, Proposal } from '@engine/proposals/types.js';
import { renderComparisonReport } from '@engine/report/markdown.js';
import { renderComparisonBBCode } from '@engine/report/bbcode.js';
import { getClassColor } from '../utils/class-colors.js';
import { setProposalInUrl } from '../utils/url-encoding.js';
import { colors } from '../theme.js';

interface ProposalResultsProps {
  result: ComparisonResult;
  proposal: Proposal;
}

export function ProposalResults({ result, proposal }: ProposalResultsProps) {
  const scenarios = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const d of result.deltas) {
      if (!seen.has(d.scenario)) {
        seen.add(d.scenario);
        ordered.push(d.scenario);
      }
    }
    return ordered;
  }, [result.deltas]);

  const [selectedScenario, setSelectedScenario] = useState(scenarios[0] ?? 'Buffed');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(
    () => result.deltas.filter((d) => d.scenario === selectedScenario),
    [result.deltas, selectedScenario]
  );

  const changed = filtered.filter((d) => d.change !== 0);
  const unchanged = filtered.filter((d) => d.change === 0);

  const handleShare = () => {
    setProposalInUrl(proposal);
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyMarkdown = () => {
    const md = renderComparisonReport(result);
    navigator.clipboard.writeText(md);
  };

  const handleCopyBBCode = () => {
    const bbcode = renderComparisonBBCode(result);
    navigator.clipboard.writeText(bbcode);
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Results</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleShare} style={actionButtonStyle}>
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
          <button onClick={handleCopyMarkdown} style={actionButtonStyle}>
            Copy Markdown
          </button>
          <button onClick={handleCopyBBCode} style={actionButtonStyle}>
            Copy for Forum
          </button>
        </div>
      </div>

      {scenarios.length > 1 && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
          {scenarios.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedScenario(s)}
              style={{
                background: selectedScenario === s ? colors.filterBg : 'transparent',
                color: selectedScenario === s ? colors.textBright : colors.textDim,
                border: selectedScenario === s ? `1px solid ${colors.borderActive}` : '1px solid transparent',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {changed.length > 0 && <ComparisonChart deltas={changed} />}

      <DeltaTable deltas={filtered} />
    </div>
  );
}

function ComparisonChart({ deltas }: { deltas: DeltaEntry[] }) {
  const chartData = deltas
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .map((d) => ({
      label: `${d.className} ${d.skillName} (${d.tier.charAt(0).toUpperCase() + d.tier.slice(1)})`,
      before: Math.round(d.before),
      after: Math.round(d.after),
      className: d.className,
    }));

  const barHeight = 36;
  const chartHeight = Math.max(200, chartData.length * barHeight + 60);

  return (
    <div data-testid="comparison-chart" style={{ width: '100%', height: chartHeight, marginBottom: 24 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 80, left: 0, bottom: 8 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fill: colors.textFaint, fontSize: 11 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={280}
            tick={{ fill: '#ccc', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div style={{
                  background: colors.bgSurface,
                  border: `1px solid ${colors.bgButton}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 12,
                }}>
                  <div style={{ fontWeight: 600, color: getClassColor(d.className) }}>
                    {d.label}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: colors.textMuted }}>Before: </span>
                    <span>{d.before.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.textMuted }}>After: </span>
                    <span>{d.after.toLocaleString()}</span>
                  </div>
                  <div style={{ color: d.after > d.before ? colors.positive : colors.negative }}>
                    {d.after > d.before ? '+' : ''}{(d.after - d.before).toLocaleString()} ({((d.after - d.before) / d.before * 100).toFixed(1)}%)
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => <span style={{ color: colors.textSecondary }}>{value}</span>}
          />
          <Bar dataKey="before" name="Before" fill={colors.textFaint} fillOpacity={0.6} barSize={14} radius={[0, 3, 3, 0]} />
          <Bar dataKey="after" name="After" barSize={14} radius={[0, 3, 3, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getClassColor(entry.className)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeltaTable({ deltas }: { deltas: DeltaEntry[] }) {
  const sorted = [...deltas].sort((a, b) => {
    const aChanged = a.change !== 0 ? 0 : 1;
    const bChanged = b.change !== 0 ? 0 : 1;
    if (aChanged !== bChanged) return aChanged - bChanged;
    if (aChanged === 0) return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    return a.className.localeCompare(b.className);
  });

  const hasRanks = sorted.some((d) => d.rankBefore != null);

  return (
    <table data-testid="delta-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
          {hasRanks && <th style={thStyle}>Rank</th>}
          <th style={{ ...thStyle, textAlign: 'left' }}>Class</th>
          <th style={{ ...thStyle, textAlign: 'left' }}>Skill</th>
          <th style={{ ...thStyle, textAlign: 'left' }}>Tier</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Before</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>After</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Change</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((d, i) => {
          const isChanged = d.change !== 0;
          return (
            <tr key={i} style={{
              borderBottom: `1px solid ${colors.borderSubtle}`,
              background: isChanged ? 'rgba(85, 184, 224, 0.03)' : undefined,
            }}>
              {hasRanks && (
                <td style={{ ...tdStyle, color: colors.textDim, fontSize: 12 }}>
                  {formatRank(d.rankBefore, d.rankAfter)}
                </td>
              )}
              <td style={tdStyle}>{d.className}</td>
              <td style={{ ...tdStyle, color: colors.textSecondary }}>{d.skillName}</td>
              <td style={{ ...tdStyle, color: colors.textMuted }}>
                {d.tier.charAt(0).toUpperCase() + d.tier.slice(1)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatDps(d.before)}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatDps(d.after)}
              </td>
              <td style={{
                ...tdStyle,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: d.change > 0 ? colors.positive : d.change < 0 ? colors.negative : colors.textFaint,
              }}>
                {d.change > 0 ? '+' : ''}{formatDps(d.change)}
              </td>
              <td style={{
                ...tdStyle,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: d.changePercent > 0 ? colors.positive : d.changePercent < 0 ? colors.negative : colors.textFaint,
              }}>
                {d.changePercent > 0 ? '+' : ''}{d.changePercent.toFixed(1)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function formatRank(before?: number, after?: number): string {
  if (before == null || after == null) return '-';
  if (before === after) return String(before);
  return `${before}\u2192${after}`;
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: colors.textDim,
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
};

const actionButtonStyle: React.CSSProperties = {
  background: colors.bgActive,
  color: colors.textSecondary,
  border: `1px solid ${colors.borderMuted}`,
  borderRadius: 4,
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
};
