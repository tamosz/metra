import { TOGGLE_ON, TOGGLE_OFF } from '../utils/styles.js';

interface CapToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CapToggle({ enabled, onToggle }: CapToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Damage Cap</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Damage cap (199,999): ON — showing capped DPS (click for uncapped)' : 'Damage cap: OFF — showing uncapped DPS (click for capped)'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          Cap
        </button>
      </div>
    </div>
  );
}
