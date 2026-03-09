import { useState, useMemo, useCallback } from 'react';
import { getGearBreakdown } from '../data/bundle.js';
import { useSpinner } from '../hooks/useSpinner.js';
import { TemplateProposal } from './TemplateProposal.js';
import { slotDisplayName, OVERALL_TOOLTIP } from '../utils/slot-names.js';
import { TH } from '../utils/styles.js';
import type { SlotChange } from '../utils/template-proposal.js';

interface TemplateEditorProps {
  className: string;
  tier: string;
}

type Edits = Record<string, Record<string, number>>;

export function TemplateEditor({ className, tier }: TemplateEditorProps) {
  const templateKey = `${className}-${tier}`;
  const breakdown = useMemo(() => getGearBreakdown(templateKey), [templateKey]);
  const [edits, setEdits] = useState<Edits>({});

  const slots = useMemo(() => breakdown ? Object.keys(breakdown) : [], [breakdown]);

  const statColumns = useMemo(() => {
    if (!breakdown) return [];
    const stats = new Set<string>();
    for (const slotStats of Object.values(breakdown)) {
      for (const stat of Object.keys(slotStats)) {
        stats.add(stat);
      }
    }
    const order = ['STR', 'DEX', 'INT', 'LUK', 'WATK', 'MATK'];
    return [...stats].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [breakdown]);

  const getValue = useCallback(
    (slot: string, stat: string): number | null => {
      if (!breakdown) return null;
      const edited = edits[slot]?.[stat];
      if (edited !== undefined) return edited;
      return breakdown[slot]?.[stat] ?? null;
    },
    [breakdown, edits]
  );

  const getOriginal = useCallback(
    (slot: string, stat: string): number | null => {
      if (!breakdown) return null;
      return breakdown[slot]?.[stat] ?? null;
    },
    [breakdown]
  );

  const isEdited = useCallback(
    (slot: string, stat: string): boolean => {
      if (!breakdown) return false;
      const edited = edits[slot]?.[stat];
      if (edited === undefined) return false;
      const original = breakdown[slot]?.[stat] ?? 0;
      return edited !== original;
    },
    [breakdown, edits]
  );

  const handleChange = useCallback(
    (slot: string, stat: string, value: number) => {
      setEdits((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], [stat]: value },
      }));
    },
    []
  );

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const stat of statColumns) {
      t[stat] = 0;
      for (const slot of slots) {
        const v = getValue(slot, stat);
        if (v !== null) t[stat] += v;
      }
    }
    return t;
  }, [statColumns, slots, getValue]);

  const originalTotals = useMemo(() => {
    if (!breakdown) return {};
    const t: Record<string, number> = {};
    for (const stat of statColumns) {
      t[stat] = 0;
      for (const slot of slots) {
        const v = breakdown[slot]?.[stat] ?? 0;
        t[stat] += v;
      }
    }
    return t;
  }, [statColumns, slots, breakdown]);

  const changes: SlotChange[] = useMemo(() => {
    if (!breakdown) return [];
    const result: SlotChange[] = [];
    for (const slot of slots) {
      for (const stat of statColumns) {
        if (isEdited(slot, stat)) {
          result.push({
            slot,
            stat,
            from: breakdown[slot]?.[stat] ?? 0,
            to: edits[slot]![stat]!,
          });
        }
      }
    }
    return result;
  }, [slots, statColumns, isEdited, breakdown, edits]);

  if (!breakdown) {
    return (
      <div className="py-4 text-sm text-text-dim">
        No gear breakdown available for this template.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th className={`${TH} text-left`}>Slot</th>
              {statColumns.map((stat) => (
                <th key={stat} className={`${TH} text-right`}>{stat}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-b border-border-subtle hover:bg-white/[0.03]">
                <td className="px-3 py-2 text-xs text-text-muted">
                  {slot === 'top' ? (
                    <span title={OVERALL_TOOLTIP} className="cursor-help underline decoration-dotted decoration-text-faint underline-offset-2">
                      {slotDisplayName(slot)}
                    </span>
                  ) : (
                    slotDisplayName(slot)
                  )}
                </td>
                {statColumns.map((stat) => {
                  const original = getOriginal(slot, stat);
                  const hasStat = original !== null;
                  const edited = isEdited(slot, stat);

                  if (!hasStat) {
                    return <td key={stat} className="px-3 py-2" />;
                  }

                  return (
                    <td key={stat} className="px-3 py-1.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {edited && (
                          <span className="text-[10px] text-text-faint line-through tabular-nums">
                            {original}
                          </span>
                        )}
                        <CellSpinner
                          value={getValue(slot, stat) ?? 0}
                          edited={edited}
                          onChange={(v) => handleChange(slot, stat, v)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-default">
              <td className="px-3 py-2 text-xs font-medium text-text-muted">Total</td>
              {statColumns.map((stat) => {
                const changed = totals[stat] !== originalTotals[stat];
                return (
                  <td key={stat} className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {changed && (
                        <span className="text-[10px] text-text-faint line-through tabular-nums">
                          {originalTotals[stat]}
                        </span>
                      )}
                      <span className={`text-sm font-medium tabular-nums ${changed ? 'text-amber-400' : 'text-text-secondary'}`}>
                        {totals[stat]}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {!slots.some((s) => ['cape', 'glove', 'shoe'].includes(s)) && (
        <p className="mt-2 text-[11px] text-text-faint">
          Cape, glove, and shoe use standardized tier values (configurable via dashboard CGS controls).
        </p>
      )}

      {changes.length > 0 && (
        <TemplateProposal className={className} tier={tier} changes={changes} />
      )}
    </div>
  );
}

function CellSpinner({
  value,
  edited,
  onChange,
}: {
  value: number;
  edited: boolean;
  onChange: (value: number) => void;
}) {
  const decrement = useCallback(() => {
    onChange(Math.max(0, value - 1));
  }, [value, onChange]);

  const increment = useCallback(() => {
    onChange(value + 1);
  }, [value, onChange]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  const btnClass = 'flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted';

  return (
    <div className={`flex items-stretch overflow-hidden rounded border ${
      edited ? 'border-amber-600/50' : 'border-border-default'
    }`}>
      <button type="button" tabIndex={-1} className={btnClass} {...decSpinner}>
        &minus;
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
        className={`w-[48px] border-x px-1 py-1 text-center text-sm tabular-nums transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          edited
            ? 'border-amber-600/50 bg-amber-950/20 text-amber-400'
            : 'border-border-default bg-bg-raised text-text-primary'
        }`}
      />
      <button type="button" tabIndex={-1} className={btnClass} {...incSpinner}>
        +
      </button>
    </div>
  );
}
