import { useState, useMemo } from 'react';
import {
  findOptimalParty,
  type PartySimulationResult,
} from '@metra/engine';
import { discoveredData, weaponData, attackSpeedData, mwData } from '../data/bundle.js';
import { getClassColor, getClassColorWithOpacity } from '../utils/class-colors.js';
import { colors } from '../theme.js';

interface PartyTierListProps {
  onLoadParty: (members: { className: string }[]) => void;
}

function getDisplayName(slug: string): string {
  return discoveredData.classDataMap.get(slug)?.className ?? slug;
}

/** Color bar by the highest-DPS member's class. */
function getPartyColor(party: PartySimulationResult): string {
  if (party.members.length === 0) return colors.textDim;
  const top = party.members.reduce((best, m) => (m.dps > best.dps ? m : best));
  return getClassColor(getDisplayName(top.className));
}

/** Compact party summary: class names with counts for duplicates. */
function getPartySummary(party: PartySimulationResult): string {
  const counts = new Map<string, number>();
  for (const m of party.members) {
    const name = getDisplayName(m.className);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => (count > 1 ? `${name} ×${count}` : name))
    .join(', ');
}

const DIVERSITY_OPTIONS = [
  { label: 'Unrestricted', value: undefined as number | undefined },
  { label: 'Max 3 each', value: 3 },
  { label: 'Max 2 each', value: 2 },
  { label: 'All unique', value: 1 },
] as const;

export function PartyTierList({ onLoadParty }: PartyTierListProps) {
  const [expandedRank, setExpandedRank] = useState<number | null>(null);
  const [maxDuplicates, setMaxDuplicates] = useState<number | undefined>(2);

  const { classDataMap, gearTemplates } = discoveredData;

  const topParties = useMemo(() => {
    try {
      const opt = findOptimalParty(
        classDataMap, gearTemplates, weaponData, attackSpeedData, mwData,
        6,
        maxDuplicates !== undefined ? { maxDuplicates } : undefined,
        25,
      );
      return opt.topParties;
    } catch {
      return [];
    }
  }, [classDataMap, gearTemplates, maxDuplicates]);

  if (topParties.length === 0) {
    return <div className="py-6 text-center text-sm text-text-dim">No party compositions found</div>;
  }

  const maxDps = topParties[0].totalDps;

  return (
    <div>
      {/* Diversity filter */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-widest text-text-dim">Diversity</span>
        <div className="flex gap-1">
          {DIVERSITY_OPTIONS.map((opt) => {
            const isActive = maxDuplicates === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  setMaxDuplicates(opt.value);
                  setExpandedRank(null);
                }}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'border-border-button bg-bg-active text-text-bright'
                    : 'border-border-default bg-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex flex-col gap-1">
        {topParties.map((party, index) => {
          const rank = index + 1;
          const isExpanded = expandedRank === rank;
          const barColor = getPartyColor(party);
          const widthPercent = maxDps > 0 ? (party.totalDps / maxDps) * 100 : 0;
          const summary = getPartySummary(party);

          return (
            <div key={rank}>
              {/* Bar row */}
              <button
                onClick={() => setExpandedRank(isExpanded ? null : rank)}
                className="group flex w-full items-center gap-2 rounded border-none bg-transparent p-0 text-left cursor-pointer"
              >
                <span className="w-7 flex-shrink-0 text-right text-[11px] tabular-nums text-text-dim">
                  #{rank}
                </span>

                <div className="relative flex-1 h-7 rounded overflow-hidden" style={{ backgroundColor: `${barColor}10` }}>
                  <div
                    className="h-full rounded transition-all duration-200"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: barColor,
                      opacity: isExpanded ? 0.9 : 0.6,
                      minWidth: 4,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-2.5 pointer-events-none">
                    <span className="truncate text-[11px] font-medium text-text-bright drop-shadow-sm">
                      {summary}
                    </span>
                  </div>
                </div>

                <span className="w-16 flex-shrink-0 text-right text-[11px] tabular-nums text-text-secondary group-hover:text-text-bright transition-colors">
                  {(Math.round(party.totalDps) / 1000).toFixed(0)}k
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div
                  className="ml-9 mt-1 mb-2 rounded-md border p-3"
                  style={{
                    borderColor: `${barColor}40`,
                    backgroundColor: getClassColorWithOpacity(getDisplayName(party.members.reduce((best, m) => m.dps > best.dps ? m : best).className), 0.04),
                  }}
                >
                  {(party.activeBuffs.sharpEyes || party.activeBuffs.speedInfusion) && (
                    <div className="mb-2.5 flex gap-1">
                      {party.activeBuffs.sharpEyes && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.buffSe + '33', color: colors.buffSe }}>
                          SE
                        </span>
                      )}
                      {party.activeBuffs.speedInfusion && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: colors.buffSi + '33', color: colors.buffSi }}>
                          SI
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5">
                    {[...party.members]
                      .sort((a, b) => b.dps - a.dps)
                      .map((member, i) => {
                        const displayName = getDisplayName(member.className);
                        const color = getClassColor(displayName);
                        const share = party.totalDps > 0 ? ((member.dps / party.totalDps) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                            <span className="inline-block h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="flex-1 text-text-primary">{displayName}</span>
                            <span className="tabular-nums text-text-secondary">{Math.round(member.dps).toLocaleString()}</span>
                            <span className="w-10 text-right tabular-nums text-text-dim">{share}%</span>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t pt-2" style={{ borderColor: `${barColor}20` }}>
                    <span className="text-xs font-semibold text-text-bright tabular-nums">
                      {Math.round(party.totalDps).toLocaleString()} total DPS
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadParty(party.members.map((m) => ({ className: m.className })));
                      }}
                      className="rounded border border-border-active bg-bg-active px-2.5 py-1 text-[11px] font-medium text-text-primary hover:border-border-button hover:text-text-bright transition-colors cursor-pointer"
                    >
                      Load this party
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
