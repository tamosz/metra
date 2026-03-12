import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { TOGGLE_ON, TOGGLE_OFF } from '../utils/styles.js';

export function KbToggle() {
  const {
    kbEnabled: enabled,
    setKbEnabled: onToggle,
    bossAttackInterval,
    setBossAttackInterval: onIntervalChange,
    bossAccuracy,
    setBossAccuracy: onAccuracyChange,
  } = useSimulationControls();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Knockback <span className="normal-case tracking-normal text-text-muted">(experimental)</span></span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={enabled ? 'Knockback (experimental): ON (click to disable)' : 'Knockback (experimental): OFF (click to enable)'}
          onClick={() => onToggle(!enabled)}
          className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${enabled ? TOGGLE_ON : TOGGLE_OFF}`}
        >
          KB
        </button>
        {enabled && (
          <>
            <label className="flex items-center gap-1 text-[11px] text-text-dim" title="How often the boss hits you (seconds between attacks)">
              Interval
              <input
                type="number"
                value={bossAttackInterval}
                step={0.1}
                min={0.1}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0.1) onIntervalChange(v);
                }}
                className="w-[48px] rounded border border-border-default bg-bg-raised px-1 py-0.5 text-center text-xs tabular-nums text-text-primary focus:border-border-active transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-text-dim" title="Boss accuracy stat (higher = harder to dodge)">
              Accuracy
              <input
                type="number"
                value={bossAccuracy}
                min={1}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1) onAccuracyChange(v);
                }}
                className="w-[48px] rounded border border-border-default bg-bg-raised px-1 py-0.5 text-center text-xs tabular-nums text-text-primary focus:border-border-active transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
