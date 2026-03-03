import { useCallback } from 'react';
import { CGS_DEFAULTS, type CgsValues } from '../utils/cgs.js';
import { useSpinner } from '../hooks/useSpinner.js';

interface TierPresetsProps {
  tiers: string[];
  selectedTier: string;
  cgsValues: CgsValues;
  onTierChange: (tier: string) => void;
  onCgsChange: (values: CgsValues) => void;
  customTierNames: Map<string, string>;
}

function tierDisplayName(tier: string, customTierNames: Map<string, string>): string {
  const custom = customTierNames.get(tier);
  if (custom) return custom;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function matchesTierDefaults(tier: string, cgs: CgsValues): boolean {
  const defaults = CGS_DEFAULTS[tier];
  if (!defaults) return false;
  return defaults.cape === cgs.cape && defaults.glove === cgs.glove && defaults.shoe === cgs.shoe;
}

export function TierPresets({
  tiers,
  selectedTier,
  cgsValues,
  onTierChange,
  onCgsChange,
  customTierNames,
}: TierPresetsProps) {
  const cgsMatchesSelected = matchesTierDefaults(selectedTier, cgsValues);

  const handleTierClick = (tier: string) => {
    onTierChange(tier);
    const defaults = CGS_DEFAULTS[tier];
    if (defaults) {
      onCgsChange({ ...defaults });
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Tier</span>
        <div className="flex flex-wrap gap-0.5">
          {tiers.map((t) => {
            const isSelected = t === selectedTier;
            const activeStyle = isSelected && cgsMatchesSelected
              ? 'border border-border-active bg-bg-active text-text-bright'
              : isSelected
                ? 'border border-amber-700/50 bg-amber-950/30 text-amber-400'
                : 'border border-transparent bg-transparent text-text-dim hover:text-text-muted';
            return (
              <button
                key={t}
                onClick={() => handleTierClick(t)}
                className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${activeStyle}`}
              >
                {tierDisplayName(t, customTierNames)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4">
        <CgsInput label="Cape" value={cgsValues.cape} onChange={(v) => onCgsChange({ ...cgsValues, cape: v })} />
        <CgsInput label="Glove" value={cgsValues.glove} onChange={(v) => onCgsChange({ ...cgsValues, glove: v })} />
        <CgsInput label="Shoe" value={cgsValues.shoe} onChange={(v) => onCgsChange({ ...cgsValues, shoe: v })} />
      </div>
    </div>
  );
}

function CgsInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const clamp = (n: number) => Math.max(0, n);

  const decrement = useCallback(() => {
    onChange(clamp(value - 1));
  }, [value, onChange]);

  const increment = useCallback(() => {
    onChange(clamp(value + 1));
  }, [value, onChange]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded border border-border-default">
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...decSpinner}
        >
          &minus;
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(clamp(v));
          }}
          className="w-[36px] border-x border-border-default bg-bg-raised px-1 py-1 text-center text-sm tabular-nums text-text-primary focus:border-border-active transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...incSpinner}
        >
          +
        </button>
      </div>
    </div>
  );
}
