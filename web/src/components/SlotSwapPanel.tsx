import type { SlotSwapOption } from '../hooks/usePartySimulation.js';
import { discoveredData } from '../data/bundle.js';
import { getClassColor } from '../utils/class-colors.js';

interface SlotSwapPanelProps {
  currentClassName: string;
  options: SlotSwapOption[];
}

export function SlotSwapPanel({ currentClassName, options }: SlotSwapPanelProps) {
  const { classDataMap } = discoveredData;
  const currentDisplayName = classDataMap.get(currentClassName)?.className ?? currentClassName;

  return (
    <div className="mt-4">
      <div className="mb-2 text-[11px] uppercase tracking-widest text-text-dim">
        Slot Swap — replacing {currentDisplayName}
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-default text-[10px] uppercase tracking-widest text-text-dim">
              <th className="pb-1.5 text-left font-medium">Replacement</th>
              <th className="pb-1.5 text-right font-medium">Party DPS Delta</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const displayName = classDataMap.get(option.className)?.className ?? option.className;
              const color = getClassColor(displayName);
              const isCurrent = option.className === currentClassName;

              return (
                <tr
                  key={option.className}
                  className="border-b border-border-default last:border-0"
                  style={{ opacity: isCurrent ? 0.45 : 1 }}
                >
                  <td className="py-1.5">
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-text-primary">{displayName}</span>
                    {isCurrent && (
                      <span className="ml-1.5 text-text-dim">(current)</span>
                    )}
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {isCurrent ? (
                      <span className="text-text-dim">—</span>
                    ) : option.partyDpsDelta >= 0 ? (
                      <span style={{ color: 'rgb(34, 197, 94)' }}>
                        +{Math.round(option.partyDpsDelta).toLocaleString()}
                      </span>
                    ) : (
                      <span style={{ color: 'rgb(239, 68, 68)' }}>
                        {Math.round(option.partyDpsDelta).toLocaleString()}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
