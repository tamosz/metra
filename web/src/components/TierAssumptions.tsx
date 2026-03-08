import { useState } from 'react';
import { CGS_DEFAULTS } from '../utils/cgs';

const POTION_NAMES: Record<string, string> = {
  low: 'Stopper',
  mid: 'Stopper',
  high: 'Apple',
  perfect: 'Naricain Demon Elixir',
};

const WEAPON_LABELS: Record<string, string> = {
  low: 'Budget',
  mid: 'Well-scrolled',
  high: 'Near-perfect',
  perfect: 'Theoretical max',
};

const TIER_HEADERS: Record<string, string> = {
  low: 'Low (~Lv165)',
  mid: 'Mid (~Lv185)',
  high: 'High (Lv200)',
  perfect: 'Perfect (Lv200)',
};

const TIERS = ['low', 'mid', 'high', 'perfect'] as const;

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
                {TIERS.map((tier) => (
                  <th key={tier} className="px-3 py-2 text-left font-medium text-text-dim">
                    {TIER_HEADERS[tier]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle">
                <td className="px-3 py-1.5 font-medium text-text-muted">Weapon</td>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-1.5 text-text-secondary">
                    {WEAPON_LABELS[tier]}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="px-3 py-1.5 font-medium text-text-muted">Potion</td>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-3 py-1.5 text-text-secondary">
                    {POTION_NAMES[tier]}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-medium text-text-muted">C/G/S</td>
                {TIERS.map((tier) => {
                  const cgs = CGS_DEFAULTS[tier];
                  return (
                    <td key={tier} className="px-3 py-1.5 text-text-secondary tabular-nums">
                      {cgs.cape} / {cgs.glove} / {cgs.shoe}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
