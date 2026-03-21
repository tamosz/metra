import { memo, useCallback, type KeyboardEvent } from 'react';
import type { DpsResult } from '@metra/engine';
import type { ComboSubResult } from '@engine/proposals/types.js';
import { formatDps } from '../utils/format.js';
import { SECTION_LABEL } from '../utils/styles.js';

interface SkillDetailPanelProps {
  dps: DpsResult;
  classColor: string;
  isComposite: boolean;
  comboSubResults?: ComboSubResult[];
  capEnabled: boolean;
  editEnabled?: boolean;
  /** Current skill field values: { basePower: 260, multiplier: 1, ... } */
  skillFields?: Record<string, number>;
  /** Called when user edits a field: (fieldName, newValue, originalValue) */
  onFieldChange?: (field: string, value: number, original: number) => void;
  /** Fields with active edit changes: { basePower: 280 } */
  activeChanges?: Record<string, number>;
  /** Sub-skills for combo group editing */
  comboSkills?: Array<{
    name: string;
    skillFields: Record<string, number>;
    activeChanges: Record<string, number>;
    target: string;
  }>;
  /** Called when a combo sub-skill field is edited */
  onComboFieldChange?: (target: string, field: string, value: number, original: number) => void;
}

const FIELD_LABELS: Record<string, string> = {
  basePower: 'Base Power',
  multiplier: 'Multiplier',
  hitCount: 'Hit Count',
  maxTargets: 'Max Targets',
};

function SkillDetailPanelInner({
  dps,
  classColor,
  isComposite,
  comboSubResults,
  capEnabled,
  editEnabled,
  skillFields,
  onFieldChange,
  activeChanges,
  comboSkills,
  onComboFieldChange,
}: SkillDetailPanelProps) {
  const critContribution = computeCritContribution(dps);

  const showEditFields = editEnabled && skillFields && !isComposite;
  const showComboEditFields = editEnabled && isComposite && comboSkills && comboSkills.length > 0;

  return (
    <div
      className="bg-bg-raised px-3 py-4"
      style={{ borderTop: `2px solid ${classColor}` }}
      data-testid="skill-detail-panel"
    >
      {showEditFields && (
        <div className="border-b border-border-subtle mb-3 pb-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(skillFields).map(([field, original]) => {
              const changed = activeChanges?.[field];
              const hasChange = changed !== undefined;
              return (
                <FieldInput
                  key={`${field}-${changed ?? original}`}
                  field={field}
                  label={FIELD_LABELS[field] ?? field}
                  defaultValue={hasChange ? changed : original}
                  original={original}
                  hasChange={hasChange}
                  onCommit={onFieldChange}
                />
              );
            })}
          </div>
        </div>
      )}
      {showComboEditFields && (
        <div className="border-b border-border-subtle mb-3 pb-3 flex flex-col gap-3">
          {comboSkills.map((sub) => (
            <div key={sub.target}>
              <div className={`${SECTION_LABEL} mb-1.5`}>
                {sub.name}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(sub.skillFields).map(([field, original]) => {
                  const changed = sub.activeChanges[field];
                  const hasChange = changed !== undefined;
                  return (
                    <FieldInput
                      key={`${sub.target}-${field}-${changed ?? original}`}
                      field={field}
                      label={FIELD_LABELS[field] ?? field}
                      defaultValue={hasChange ? changed : original}
                      original={original}
                      hasChange={hasChange}
                      onCommit={(f, value, orig) => onComboFieldChange?.(sub.target, f, value, orig)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:gap-8">
        {/* Formula breakdown */}
        {!isComposite && (
          <div className="flex-1 min-w-0">
            <SkillBreakdown dps={dps} critContribution={critContribution} capEnabled={capEnabled} />
          </div>
        )}
        {isComposite && comboSubResults && comboSubResults.length > 0 && (
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {comboSubResults.map((sub) => (
              <SubSkillBreakdown key={sub.skillName} sub={sub} capEnabled={capEnabled} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const SkillDetailPanel = memo(SkillDetailPanelInner);

function computeCritContribution(d: DpsResult): number {
  if (d.totalCritRate > 0 && d.critDamagePercent > 0) {
    return (
      (d.critDamagePercent * d.totalCritRate) /
      (d.skillDamagePercent * (1 - d.totalCritRate) +
        d.critDamagePercent * d.totalCritRate)
    );
  }
  return 0;
}

function SkillBreakdown({
  dps,
  critContribution,
  capEnabled,
}: {
  dps: DpsResult;
  critContribution: number;
  capEnabled: boolean;
}) {
  return (
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
  );
}

function SubSkillBreakdown({
  sub,
  capEnabled,
}: {
  sub: ComboSubResult;
  capEnabled: boolean;
}) {
  const cc = computeCritContribution(sub.dps);
  const weightLabel = sub.weight != null ? ` (${Math.round(sub.weight * 100)}%)` : '';
  return (
    <div>
      <div className={`${SECTION_LABEL} mb-1.5`}>
        {sub.skillName}{weightLabel}
      </div>
      <SkillBreakdown dps={sub.dps} critContribution={cc} capEnabled={capEnabled} />
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

function FieldInput({
  field,
  label,
  defaultValue,
  original,
  hasChange,
  onCommit,
}: {
  field: string;
  label: string;
  defaultValue: number;
  original: number;
  hasChange: boolean;
  onCommit?: (field: string, value: number, original: number) => void;
}) {
  const commit = useCallback(
    (el: HTMLInputElement) => {
      const parsed = parseFloat(el.value);
      if (!isNaN(parsed)) {
        onCommit?.(field, parsed, original);
      }
    },
    [field, original, onCommit],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => commit(e.currentTarget),
    [commit],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commit(e.currentTarget);
        e.currentTarget.blur();
      }
    },
    [commit],
  );

  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-text-dim">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          aria-label={field}
          defaultValue={defaultValue}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          step={field === 'multiplier' ? 0.1 : 1}
          className={`w-20 rounded border bg-bg-surface px-1.5 py-0.5 text-sm tabular-nums text-text-primary focus:outline-none focus:border-accent ${
            hasChange ? 'border-accent' : 'border-border-default'
          }`}
        />
        {hasChange && (
          <span className="text-[10px] text-text-muted">was {original}</span>
        )}
      </div>
    </label>
  );
}
