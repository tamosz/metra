import { useCallback } from 'react';
import { useSimulationFilters } from '../../context/SimulationFiltersContext.js';
import { useSpinner } from '../../hooks/useSpinner.js';

export function TargetSpinner() {
  const { targetCount, setTargetCount } = useSimulationFilters();
  const clamp = (n: number) => Math.max(1, Math.min(15, n));

  const decrement = useCallback(() => {
    setTargetCount(clamp(targetCount - 1));
  }, [targetCount, setTargetCount]);

  const increment = useCallback(() => {
    setTargetCount(clamp(targetCount + 1));
  }, [targetCount, setTargetCount]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Targets</span>
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
          value={targetCount}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) setTargetCount(clamp(v));
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
