import { type PartyMemberResult } from '@metra/engine';
import { discoveredData } from '../data/bundle.js';
import { getClassColor, getClassColorWithOpacity } from '../utils/class-colors.js';
import { formatDps } from '../utils/format.js';

interface PartyGridProps {
  members: string[];
  memberResults: PartyMemberResult[];
  onDrop: (className: string) => void;
  onRemove: (index: number) => void;
}

export function PartyGrid({ members, memberResults, onDrop, onRemove }: PartyGridProps) {
  const slots = Array.from({ length: 6 }, (_, i) => ({
    className: members[i] ?? null,
    result: memberResults[i] ?? null,
  }));

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const className = e.dataTransfer.getData('text/plain');
    if (className) onDrop(className);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot, i) => {
        if (!slot.className) {
          return (
            <div key={i} onDragOver={handleDragOver} onDrop={handleDrop}
              className="flex min-h-[72px] items-center justify-center rounded-md border border-dashed border-border-default text-xs text-text-dim">
              Drop class here
            </div>
          );
        }
        const displayName = discoveredData.classDataMap.get(slot.className)?.className ?? slot.className;
        const color = getClassColor(displayName);
        return (
          <div key={i} className="relative rounded-md border border-dashed p-3 text-center"
            style={{ borderColor: `${color}40`, backgroundColor: getClassColorWithOpacity(displayName, 0.08) }}>
            <button onClick={() => onRemove(i)}
              className="absolute right-1 top-1 cursor-pointer border-none bg-transparent p-0.5 text-xs text-text-dim hover:text-text-primary"
              aria-label={`Remove ${displayName}`}>×</button>
            <div className="text-xs font-medium text-text-primary">{displayName}</div>
            {slot.result && (
              <div className="mt-0.5 text-[10px] text-text-muted">{formatDps(slot.result.dps)} DPS</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
