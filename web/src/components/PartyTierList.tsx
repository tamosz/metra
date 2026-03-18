import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  findOptimalParty,
  computeBuffAttribution,
  type PartySimulationResult,
  type Party,
} from '@metra/engine';
import { discoveredData, weaponData, attackSpeedData, mwData } from '../data/bundle.js';
import { getClassColor, getClassColorWithOpacity, VARIANT_CLASS_SLUGS } from '../utils/class-colors.js';
import { colors } from '../theme.js';

interface PartyTierListProps {
  onLoadParty: (members: { className: string }[]) => void;
}

function getDisplayName(slug: string): string {
  return discoveredData.classDataMap.get(slug)?.className ?? slug;
}

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

function StackedBar({
  party,
  maxDps,
  compact,
  isExpanded,
}: {
  party: PartySimulationResult;
  maxDps: number;
  compact: boolean;
  isExpanded: boolean;
}) {
  const widthPercent = maxDps > 0 ? (party.totalDps / maxDps) * 100 : 0;
  const sorted = [...party.members].sort((a, b) => b.dps - a.dps);

  return (
    <div
      className="relative overflow-hidden rounded"
      style={{
        width: `${widthPercent}%`,
        height: compact ? 6 : 28,
        minWidth: 4,
        display: 'flex',
      }}
    >
      {sorted.map((member, i) => {
        const displayName = getDisplayName(member.className);
        const color = getClassColor(displayName);
        const segmentPercent = party.totalDps > 0 ? (member.dps / party.totalDps) * 100 : 0;
        return (
          <div
            key={i}
            style={{
              width: `${segmentPercent}%`,
              backgroundColor: color,
              opacity: isExpanded ? 0.9 : 0.65,
              minWidth: segmentPercent > 0 ? 1 : 0,
            }}
            title={compact ? undefined : `${displayName}: ${Math.round(member.dps).toLocaleString()} DPS`}
          />
        );
      })}
    </div>
  );
}

/** Virtualized list of compact bars for "show all" mode. */
function VirtualizedBars({
  parties,
  maxDps,
  expandedRank,
  expandedAttribution,
  onToggleExpand,
  onLoadParty,
}: {
  parties: PartySimulationResult[];
  maxDps: number;
  expandedRank: number | null;
  expandedAttribution: PartySimulationResult | null;
  onToggleExpand: (rank: number) => void;
  onLoadParty: (members: { className: string }[]) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 8;

  const virtualizer = useVirtualizer({
    count: parties.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const rank = index + 1;
      return rank === expandedRank ? ROW_HEIGHT + 220 : ROW_HEIGHT;
    },
    overscan: 50,
  });

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto rounded-md border border-border-default"
      style={{ maxHeight: '70vh' }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const index = virtualRow.index;
          const party = parties[index];
          const rank = index + 1;
          const isExpanded = expandedRank === rank;
          const isEven = rank % 2 === 0;
          const summary = getPartySummary(party);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <button
                onClick={() => onToggleExpand(rank)}
                className="flex w-full items-center gap-0 border-none p-0 cursor-pointer"
                style={{
                  backgroundColor: isExpanded
                    ? 'rgba(255,255,255,0.06)'
                    : isEven
                      ? 'rgba(255,255,255,0.02)'
                      : 'transparent',
                  height: ROW_HEIGHT,
                }}
                title={`#${rank} — ${summary} — ${Math.round(party.totalDps).toLocaleString()} DPS`}
              >
                <div className="flex-1" style={{ padding: '1px 4px' }}>
                  <StackedBar party={party} maxDps={maxDps} compact isExpanded={isExpanded} />
                </div>
              </button>

              {isExpanded && expandedAttribution && (
                <div style={{ padding: '0 4px' }}>
                  <ExpandedDetail
                    rank={rank}
                    party={expandedAttribution}
                    onLoadParty={onLoadParty}
                    onClose={() => onToggleExpand(rank)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PartyTierList({ onLoadParty }: PartyTierListProps) {
  const [expandedRank, setExpandedRank] = useState<number | null>(null);
  const [maxDuplicates, setMaxDuplicates] = useState<number | undefined>(2);
  const [showAll, setShowAll] = useState(false);

  const { classDataMap, gearTemplates } = discoveredData;

  const topParties = useMemo(() => {
    try {
      const excluded = [...VARIANT_CLASS_SLUGS];
      const opt = findOptimalParty(
        classDataMap, gearTemplates, weaponData, attackSpeedData, mwData,
        6,
        { excluded, ...(maxDuplicates !== undefined ? { maxDuplicates } : {}) },
        100_000,
      );
      return opt.topParties;
    } catch {
      return [];
    }
  }, [classDataMap, gearTemplates, maxDuplicates]);

  const expandedAttribution = useMemo(() => {
    if (expandedRank === null || expandedRank > topParties.length) return null;
    const party = topParties[expandedRank - 1];
    const p: Party = { name: '', members: party.members.map((m) => ({ className: m.className })) };
    return computeBuffAttribution(p, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
  }, [expandedRank, topParties, classDataMap, gearTemplates]);

  if (topParties.length === 0) {
    return <div className="py-6 text-center text-sm text-text-dim">No party compositions found</div>;
  }

  const maxDps = topParties[0].totalDps;

  const handleToggleExpand = (rank: number) => {
    setExpandedRank((prev) => (prev === rank ? null : rank));
  };

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
                  setShowAll(false);
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

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-text-dim">
            {topParties.length.toLocaleString()} compositions
          </span>
          <button
            onClick={() => {
              setShowAll(!showAll);
              setExpandedRank(null);
            }}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              showAll
                ? 'border-border-button bg-bg-active text-text-bright'
                : 'border-border-default bg-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {showAll ? 'Top 25' : 'Show all'}
          </button>
        </div>
      </div>

      {/* Bar chart */}
      {showAll ? (
        <VirtualizedBars
          parties={topParties}
          maxDps={maxDps}
          expandedRank={expandedRank}
          expandedAttribution={expandedAttribution}
          onToggleExpand={handleToggleExpand}
          onLoadParty={onLoadParty}
        />
      ) : (
        <div className="flex flex-col gap-1">
          {topParties.slice(0, 25).map((party, index) => {
            const rank = index + 1;
            const isExpanded = expandedRank === rank;
            const summary = getPartySummary(party);

            return (
              <div key={rank}>
                <button
                  onClick={() => handleToggleExpand(rank)}
                  className="group flex w-full items-center gap-2 rounded border-none bg-transparent p-0 text-left cursor-pointer"
                >
                  <span className="w-7 flex-shrink-0 text-right text-[11px] tabular-nums text-text-dim">
                    #{rank}
                  </span>

                  <div className="relative flex-1 h-7 rounded overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <StackedBar party={party} maxDps={maxDps} compact={false} isExpanded={isExpanded} />
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

                {isExpanded && expandedAttribution && (
                  <ExpandedDetail
                    rank={rank}
                    party={expandedAttribution}
                    onLoadParty={onLoadParty}
                    onClose={() => setExpandedRank(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExpandedDetail({
  rank,
  party,
  onLoadParty,
  onClose,
}: {
  rank: number;
  party: PartySimulationResult;
  onLoadParty: (members: { className: string }[]) => void;
  onClose: () => void;
}) {
  const sorted = [...party.members].sort(
    (a, b) => (b.dps + b.buffContribution) - (a.dps + a.buffContribution),
  );
  const topMember = party.members.reduce((best, m) => (m.dps > best.dps ? m : best));
  const barColor = getClassColor(getDisplayName(topMember.className));

  return (
    <div
      className="mt-1 mb-2 rounded-md border p-3"
      style={{
        borderColor: `${barColor}40`,
        backgroundColor: getClassColorWithOpacity(getDisplayName(topMember.className), 0.04),
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-text-bright">
          #{rank} — {Math.round(party.totalDps).toLocaleString()} DPS
        </div>
        <div className="flex items-center gap-2">
          {(party.activeBuffs.sharpEyes || party.activeBuffs.speedInfusion) && (
            <div className="flex gap-1">
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
          <button
            onClick={onClose}
            className="text-xs text-text-dim hover:text-text-muted cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-default text-[10px] uppercase tracking-widest text-text-dim">
            <th className="pb-1.5 text-left font-medium">Class</th>
            <th className="pb-1.5 text-right font-medium">Own DPS</th>
            <th className="pb-1.5 text-right font-medium">Buff Value</th>
            <th className="pb-1.5 text-right font-medium">Slot Value</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((member, i) => {
            const displayName = getDisplayName(member.className);
            const color = getClassColor(displayName);
            const slotValue = member.dps + member.buffContribution;
            return (
              <tr key={i} className="border-b border-border-default last:border-0">
                <td className="py-1.5">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-text-primary">{displayName}</span>
                </td>
                <td className="py-1.5 text-right tabular-nums text-text-secondary">
                  {Math.round(member.dps).toLocaleString()}
                </td>
                <td className="py-1.5 text-right tabular-nums" style={{ color: member.buffContribution > 0 ? 'rgb(34, 197, 94)' : colors.textDim }}>
                  {member.buffContribution > 0 ? `+${Math.round(member.buffContribution).toLocaleString()}` : '—'}
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-text-primary">
                  {Math.round(slotValue).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-2.5">
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
  );
}
