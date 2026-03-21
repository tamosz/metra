import { useState, useEffect, useRef, useCallback } from 'react';
import { CGS_DEFAULTS, type CgsValues } from '../utils/cgs.js';
import { useSpinner } from '../hooks/useSpinner.js';
import type { SavedCgsBuild } from '../types/saved-cgs-build.js';
import { useSimulationFilters } from '../context/SimulationFiltersContext.js';

interface TierPresetsProps {
  tiers: string[];
  builds: SavedCgsBuild[];
  activeBuildId: string | null;
  onSaveBuild: (name: string) => void;
  onSelectBuild: (id: string) => void;
  onDeleteBuild: (id: string) => void;
  onClearBuild: () => void;
}

function matchesTierDefaults(tier: string, cgs: CgsValues): boolean {
  const defaults = CGS_DEFAULTS[tier];
  if (!defaults) return false;
  return defaults.cape === cgs.cape && defaults.glove === cgs.glove && defaults.shoe === cgs.shoe;
}

export function TierPresets({
  tiers,
  builds,
  activeBuildId,
  onSaveBuild,
  onSelectBuild,
  onDeleteBuild,
  onClearBuild,
}: TierPresetsProps) {
  const { selectedTier, setSelectedTier: onTierChange, cgsValues, setCgsValues: onCgsChange } = useSimulationFilters();
  const cgsMatchesSelected = matchesTierDefaults(selectedTier, cgsValues);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleTierClick = (tier: string) => {
    onTierChange(tier);
    onClearBuild();
    const defaults = CGS_DEFAULTS[tier];
    if (defaults) {
      onCgsChange({ ...defaults });
    }
  };

  const handleSaveConfirm = () => {
    const trimmed = saveName.trim();
    if (trimmed) {
      onSaveBuild(trimmed);
      setSaving(false);
      setSaveName('');
    }
  };

  const handleSaveCancel = () => {
    setSaving(false);
    setSaveName('');
  };

  useEffect(() => {
    if (saving && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [saving]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [dropdownOpen]);

  const activeBuild = activeBuildId ? builds.find((b) => b.id === activeBuildId) : null;
  const matchesActiveBuild = activeBuild &&
    activeBuild.cgs.cape === cgsValues.cape &&
    activeBuild.cgs.glove === cgsValues.glove &&
    activeBuild.cgs.shoe === cgsValues.shoe;
  const showSave = !cgsMatchesSelected && !saving && !matchesActiveBuild;

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
                {t.charAt(0).toUpperCase() + t.slice(1)}
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

      <div className="flex items-end gap-2">
        {builds.length > 0 && (
          <div ref={dropdownRef} className="relative flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Build</span>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="cursor-pointer rounded border border-border-default bg-bg-raised px-2.5 py-1 text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
            >
              <span className="max-w-[120px] truncate">{activeBuild ? activeBuild.name : 'Builds'}</span>
              <span className="text-[10px]">{dropdownOpen ? '\u25B4' : '\u25BE'}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 z-10 mt-1 min-w-[160px] rounded border border-border-default bg-bg-raised shadow-lg">
                {builds.map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-white/[0.05] ${
                      b.id === activeBuildId ? 'text-text-bright bg-white/[0.03]' : 'text-text-muted'
                    }`}
                    onClick={() => {
                      onSelectBuild(b.id);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="truncate">{b.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBuild(b.id);
                      }}
                      className="cursor-pointer text-text-faint hover:text-negative shrink-0 bg-transparent border-none p-0 text-xs"
                      title="Delete build"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showSave && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="cursor-pointer text-xs text-accent hover:text-accent-bright bg-transparent border-none p-0 pb-1"
          >
            Save
          </button>
        )}

        {saving && (
          <div className="flex items-end gap-1 pb-0.5">
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveConfirm();
                if (e.key === 'Escape') handleSaveCancel();
              }}
              placeholder="Build name"
              className="w-[100px] rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
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
