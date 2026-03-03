import type { DpsResult } from '@engine/engine/dps.js';
import { formatDps } from '../utils/format.js';

interface TierDpsEntry {
  tier: string;
  dps: number;
}

interface SkillDetailPanelProps {
  dps: DpsResult;
  tierData: TierDpsEntry[];
  classColor: string;
  isComposite: boolean;
  capEnabled: boolean;
  currentTier: string;
}

export function SkillDetailPanel({
  dps,
  tierData,
  classColor,
  isComposite,
  capEnabled,
  currentTier,
}: SkillDetailPanelProps) {
  const maxTierDps = Math.max(...tierData.map((t) => t.dps));

  // Crit contribution: what fraction of average damage comes from crits
  const critContribution =
    dps.totalCritRate > 0 && dps.critDamagePercent > 0
      ? (dps.critDamagePercent * dps.totalCritRate) /
        (dps.skillDamagePercent * (1 - dps.totalCritRate) +
          dps.critDamagePercent * dps.totalCritRate)
      : 0;

  return (
    <div
      className="bg-bg-raised px-3 py-4"
      style={{ borderTop: `2px solid ${classColor}` }}
      data-testid="skill-detail-panel"
    >
      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        {/* Left: Formula breakdown (non-composite only) */}
        {!isComposite && (
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <StatRow label="Damage Range" value={`${formatDps(dps.damageRange.min)} \u2013 ${formatDps(dps.damageRange.max)}`} />
              <StatRow label="Attack Time" value={`${dps.attackTime.toFixed(2)}s`} />
              <StatRow label="Skill Damage" value={`${Math.round(dps.skillDamagePercent)}%`} />
              <StatRow label="Crit Damage" value={`${Math.round(dps.critDamagePercent)}%`} dim={dps.totalCritRate === 0} />
              <StatRow label="Crit Rate" value={`${Math.round(dps.totalCritRate * 100)}%`} dim={dps.totalCritRate === 0} />
              <StatRow label="Crit Contribution" value={`${Math.round(critContribution * 100)}%`} dim={critContribution === 0} />
              <StatRow label="Avg Damage" value={formatDps(dps.averageDamage)} />
              <StatRow label="Hit Count" value={String(dps.hitCount)} />
              {capEnabled && (
                <StatRow
                  label="Cap Loss"
                  value={dps.capLossPercent < 0.05 ? '-' : `${dps.capLossPercent.toFixed(1)}%`}
                  highlight={dps.capLossPercent >= 5}
                />
              )}
              {dps.hasShadowPartner && (
                <StatRow label="Shadow Partner" value="Active" />
              )}
            </div>
          </div>
        )}

        {/* Right: Tier comparison */}
        <div className={isComposite ? 'w-full' : 'flex-1 min-w-0'}>
          <div className="text-[11px] font-medium uppercase tracking-wide text-text-dim mb-2">
            DPS by Tier
          </div>
          <div className="flex flex-col gap-1.5">
            {tierData.map((t) => {
              const widthPercent = maxTierDps > 0 ? (t.dps / maxTierDps) * 100 : 0;
              const isCurrent = t.tier === currentTier;
              return (
                <div key={t.tier} className="flex items-center gap-2 text-sm">
                  <span className={`w-16 text-right tabular-nums ${isCurrent ? 'text-text-bright font-medium' : 'text-text-muted'}`}>
                    {t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}
                  </span>
                  <div className="flex-1 h-4 rounded-sm bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: classColor,
                        opacity: isCurrent ? 1 : 0.5,
                      }}
                    />
                  </div>
                  <span className={`w-20 text-right tabular-nums ${isCurrent ? 'text-text-bright' : 'text-text-secondary'}`}>
                    {formatDps(t.dps)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  dim,
  highlight,
}: {
  label: string;
  value: string;
  dim?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-text-dim text-xs">{label}</span>
      <span
        className={`tabular-nums ${
          highlight ? 'text-negative' : dim ? 'text-text-faint' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
