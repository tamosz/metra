import { discoveredData } from '../data/bundle.js';
import { getClassColor } from '../utils/class-colors.js';

interface PartyRosterProps {
  onAddMember: (className: string) => void;
}

export function PartyRoster({ onAddMember }: PartyRosterProps) {
  const { classNames, classDataMap } = discoveredData;

  return (
    <div className="flex flex-shrink-0 flex-col border-r border-border-default pr-3" style={{ width: 172 }}>
      <div className="mb-2 text-[11px] uppercase tracking-widest text-text-dim">
        Class Roster
      </div>
      <div className="flex flex-col gap-1.5">
        {classNames.map((slug) => {
          const displayName = classDataMap.get(slug)?.className ?? slug;
          const color = getClassColor(displayName);
          return (
            <button
              key={slug}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', slug)}
              onClick={() => onAddMember(slug)}
              className="cursor-grab rounded border-none px-2 py-1.5 text-left text-xs font-medium text-text-primary transition-colors hover:brightness-125"
              style={{ backgroundColor: `${color}15` }}
            >
              <span className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
              {displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
