import { useState } from 'react';
import type { CustomTierAdjustments } from '../types/custom-tier.js';
import { DEFAULT_ADJUSTMENTS } from '../types/custom-tier.js';

interface CustomTierEditorProps {
  baseTiers: string[];
  initialName?: string;
  initialBaseTier?: string;
  initialAdjustments?: CustomTierAdjustments;
  onSave: (name: string, baseTier: string, adjustments: CustomTierAdjustments) => void;
  onCancel: () => void;
}

export function CustomTierEditor({
  baseTiers,
  initialName = '',
  initialBaseTier,
  initialAdjustments,
  onSave,
  onCancel,
}: CustomTierEditorProps) {
  const [name, setName] = useState(initialName);
  const [baseTier, setBaseTier] = useState(initialBaseTier ?? baseTiers[0] ?? 'mid');
  const [adj, setAdj] = useState<CustomTierAdjustments>(initialAdjustments ?? DEFAULT_ADJUSTMENTS);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), baseTier, adj);
  };

  const inputClass =
    'w-20 rounded border border-border-default bg-bg-surface px-2 py-1 text-sm text-text-primary tabular-nums focus:border-border-active transition-colors';
  const labelClass = 'text-xs text-text-muted';
  const sectionClass = 'flex flex-wrap items-center gap-3';

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={labelClass}>Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Event +30 WATK"
            className="w-48 rounded border border-border-default bg-bg px-2 py-1 text-sm text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={labelClass}>Base Tier</span>
          <select
            value={baseTier}
            onChange={(e) => setBaseTier(e.target.value)}
            className="cursor-pointer rounded border border-border-default bg-bg-surface px-2 py-1 text-sm text-text-primary focus:border-border-active transition-colors"
          >
            {baseTiers.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        <div className={sectionClass}>
          <NumberField
            label="Primary Stat"
            value={adj.primaryStatDelta}
            onChange={(v) => setAdj({ ...adj, primaryStatDelta: v })}
            signed
            className={inputClass}
            labelClassName={labelClass}
          />
          <NumberField
            label="Secondary Stat"
            value={adj.secondaryStatDelta}
            onChange={(v) => setAdj({ ...adj, secondaryStatDelta: v })}
            signed
            className={inputClass}
            labelClassName={labelClass}
          />
          <NumberField
            label="WATK"
            value={adj.watkDelta}
            onChange={(v) => setAdj({ ...adj, watkDelta: v })}
            signed
            className={inputClass}
            labelClassName={labelClass}
          />
        </div>

        <div className={sectionClass}>
          <NullableNumberField
            label="Potion WATK"
            value={adj.attackPotion}
            onChange={(v) => setAdj({ ...adj, attackPotion: v })}
            className={inputClass}
            labelClassName={labelClass}
          />
          <NullableNumberField
            label="MW Level"
            value={adj.mwLevel}
            onChange={(v) => setAdj({ ...adj, mwLevel: v })}
            className={inputClass}
            labelClassName={labelClass}
          />
        </div>

        <div className={sectionClass}>
          <TriToggle
            label="Echo"
            value={adj.echoActive}
            onChange={(v) => setAdj({ ...adj, echoActive: v })}
          />
          <TriToggle
            label="SE"
            value={adj.sharpEyes}
            onChange={(v) => setAdj({ ...adj, sharpEyes: v })}
          />
          <TriToggle
            label="SI"
            value={adj.speedInfusion}
            onChange={(v) => setAdj({ ...adj, speedInfusion: v })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="cursor-pointer rounded border border-border-active bg-bg-active px-3 py-1.5 text-xs font-medium text-text-bright transition-colors hover:bg-bg-active/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer rounded border border-border-default bg-transparent px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  signed,
  className,
  labelClassName,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  signed?: boolean;
  className: string;
  labelClassName: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={labelClassName}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={className}
        placeholder={signed ? '+0' : '0'}
      />
    </div>
  );
}

function NullableNumberField({
  label,
  value,
  onChange,
  className,
  labelClassName,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  className: string;
  labelClassName: string;
}) {
  const isOverridden = value !== null;
  return (
    <div className="flex items-center gap-1.5">
      <span className={labelClassName}>{label}</span>
      <input
        type="number"
        value={isOverridden ? value : ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Number(v) || 0);
        }}
        placeholder="base"
        className={className}
      />
    </div>
  );
}

function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  const states: (boolean | null)[] = [null, true, false];
  const labels = ['Base', 'On', 'Off'];
  const current = states.indexOf(value);
  const next = () => onChange(states[(current + 1) % states.length]);

  const btnClass = value === null
    ? 'text-text-faint border-border-default'
    : value
      ? 'text-positive border-positive/30'
      : 'text-negative border-negative/30';

  return (
    <button
      onClick={next}
      className={`cursor-pointer rounded border px-2 py-1 text-xs transition-colors ${btnClass}`}
      title={`${label}: ${labels[current]} (click to cycle)`}
    >
      {label}: {labels[current]}
    </button>
  );
}
