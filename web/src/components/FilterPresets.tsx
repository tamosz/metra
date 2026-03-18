import { useState, useEffect, useRef } from 'react';
import type { FilterPresetsState } from '../hooks/useFilterPresets.js';

interface FilterPresetsProps {
  presetsState: FilterPresetsState;
}

export function FilterPresets({ presetsState }: FilterPresetsProps) {
  const { presets, activePresetId, isDirty, apply, revert, save, remove, deselect } = presetsState;
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saving && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [saving]);

  const handleSaveConfirm = () => {
    const trimmed = saveName.trim();
    if (trimmed) {
      save(trimmed);
      setSaving(false);
      setSaveName('');
    }
  };

  const handleSaveCancel = () => {
    setSaving(false);
    setSaveName('');
  };

  const handlePresetClick = (id: string) => {
    if (id === activePresetId) {
      if (isDirty) {
        revert();
      } else {
        deselect();
      }
    } else {
      apply(id);
    }
  };

  const showSave = !saving && !(activePresetId && !isDirty);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised/50 px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Preset</span>

        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          const activeStyle = isActive && !isDirty
            ? 'border border-border-active bg-bg-active text-text-bright'
            : isActive && isDirty
              ? 'border border-amber-700/50 bg-amber-950/30 text-amber-400'
              : 'border border-transparent bg-transparent text-text-dim hover:text-text-muted';

          return (
            <div key={preset.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${activeStyle}`}
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(preset.id);
                }}
                className="absolute -right-1 -top-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg-raised border border-border-default text-[9px] text-text-faint hover:text-negative cursor-pointer"
                title={`Delete ${preset.name}`}
              >
                &times;
              </button>
            </div>
          );
        })}

        {showSave && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="cursor-pointer text-xs text-accent hover:text-accent-bright bg-transparent border-none p-0"
          >
            Save current...
          </button>
        )}

        {saving && (
          <div className="flex items-center gap-1">
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveConfirm();
                if (e.key === 'Escape') handleSaveCancel();
              }}
              placeholder="Preset name"
              className="w-[120px] rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
            />
            <button
              type="button"
              onClick={handleSaveConfirm}
              className="cursor-pointer rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
