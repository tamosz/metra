import type { PresetParty } from '@metra/engine';

interface PresetSelectorProps {
  presets: PresetParty[];
  onSelect: (members: { className: string }[]) => void;
}

export function PresetSelector({ presets, onSelect }: PresetSelectorProps) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] uppercase tracking-widest text-text-dim">Presets</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {presets.map((preset) => {
          const disabled = preset.members.length === 0;
          return (
            <button
              key={preset.name}
              title={preset.description}
              disabled={disabled}
              onClick={() => onSelect(preset.members)}
              className="flex-shrink-0 rounded-md border border-border-default bg-bg-subtle px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-active hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
