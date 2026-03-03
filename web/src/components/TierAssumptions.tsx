import { useState } from 'react';

export function TierAssumptions() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent p-0 text-xs text-text-dim transition-colors hover:text-text-muted"
      >
        <span className="text-[10px]">{expanded ? '\u25BC' : '\u25B6'}</span>
        Tier Assumptions
      </button>
      {expanded && (
        <div className="mt-2 overflow-x-auto rounded border border-border-subtle bg-bg-raised">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-3 py-2 text-left font-medium text-text-dim" />
                <th className="px-3 py-2 text-left font-medium text-text-dim">Low (~Lv165)</th>
                <th className="px-3 py-2 text-left font-medium text-text-dim">Mid (~Lv185)</th>
                <th className="px-3 py-2 text-left font-medium text-text-dim">High (Lv200)</th>
                <th className="px-3 py-2 text-left font-medium text-text-dim">Perfect (Lv200)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle">
                <td className="px-3 py-1.5 font-medium text-text-muted">Weapon</td>
                <td className="px-3 py-1.5 text-text-secondary">Budget</td>
                <td className="px-3 py-1.5 text-text-secondary">Well-scrolled</td>
                <td className="px-3 py-1.5 text-text-secondary">Near-perfect</td>
                <td className="px-3 py-1.5 text-text-secondary">Theoretical max</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="px-3 py-1.5 font-medium text-text-muted">Potion</td>
                <td className="px-3 py-1.5 text-text-secondary">Stopper</td>
                <td className="px-3 py-1.5 text-text-secondary">Stopper</td>
                <td className="px-3 py-1.5 text-text-secondary">Apple</td>
                <td className="px-3 py-1.5 text-text-secondary">Apple</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-medium text-text-muted">C/G/S</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">10 / 12 / 10</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">15 / 16 / 13</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">20 / 18 / 16</td>
                <td className="px-3 py-1.5 text-text-secondary tabular-nums">22 / 22 / 18</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
