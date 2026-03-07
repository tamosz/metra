import { useState, useMemo, useCallback } from 'react';
import { getGearBreakdown } from '../data/bundle.js';
import { TemplateProposal } from './TemplateProposal.js';
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
  const [activeInput, setActiveInput] = useState<{ slot: string; stat: string; text: string } | null>(null);

  if (!breakdown) {
    return (
      <div className="py-4 text-sm text-text-dim">
        No gear breakdown available for this template.
      </div>
    );
  }

  const slots = Object.keys(breakdown);

  // Discover all stat columns from the breakdown
  const statColumns = useMemo(() => {
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
      const edited = edits[slot]?.[stat];
      if (edited !== undefined) return edited;
      return breakdown[slot]?.[stat] ?? null;
    },
    [breakdown, edits]
  );

  const getOriginal = useCallback(
    (slot: string, stat: string): number | null => {
      return breakdown[slot]?.[stat] ?? null;
    },
    [breakdown]
  );

  const isEdited = useCallback(
    (slot: string, stat: string): boolean => {
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

  // Compute totals
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

  // Collect changes for proposal
  const changes: SlotChange[] = useMemo(() => {
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

  const thStyle = 'px-2 py-1.5 text-[11px] uppercase tracking-wide text-text-dim font-medium text-right';
  const tdSlot = 'px-2 py-1 text-xs text-text-muted text-left';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th className={`${thStyle} text-left`}>Slot</th>
              {statColumns.map((stat) => (
                <th key={stat} className={thStyle}>{stat}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="border-b border-border-default/50">
                <td className={tdSlot}>{slot}</td>
                {statColumns.map((stat) => {
                  const original = getOriginal(slot, stat);
                  const hasStat = original !== null;
                  const edited = isEdited(slot, stat);

                  if (!hasStat) {
                    return <td key={stat} className="px-2 py-1" />;
                  }

                  return (
                    <td key={stat} className="px-2 py-0.5">
                      <div className="flex items-center justify-end gap-1">
                        {edited && (
                          <span className="text-[10px] text-text-faint line-through tabular-nums">
                            {original}
                          </span>
                        )}
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={
                            activeInput?.slot === slot && activeInput?.stat === stat
                              ? activeInput.text
                              : (getValue(slot, stat) ?? '')
                          }
                          onFocus={(e) => {
                            setActiveInput({ slot, stat, text: e.target.value });
                          }}
                          onChange={(e) => {
                            setActiveInput({ slot, stat, text: e.target.value });
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) handleChange(slot, stat, v);
                          }}
                          onBlur={() => {
                            if (activeInput && activeInput.text === '') {
                              const original = getOriginal(slot, stat) ?? 0;
                              handleChange(slot, stat, original);
                            }
                            setActiveInput(null);
                          }}
                          className={`w-14 rounded border px-1.5 py-0.5 text-right text-sm tabular-nums transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            edited
                              ? 'border-amber-600/50 bg-amber-950/20 text-amber-400'
                              : 'border-border-default bg-bg-surface text-text-primary'
                          }`}
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
              <td className={`${tdSlot} font-medium`}>Total</td>
              {statColumns.map((stat) => {
                const changed = totals[stat] !== originalTotals[stat];
                return (
                  <td key={stat} className="px-2 py-1.5 text-right">
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
