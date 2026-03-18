import { type PartyMemberResult } from '@metra/engine';
import { discoveredData } from '../data/bundle.js';
import { getClassColor, getClassColorWithOpacity } from '../utils/class-colors.js';

interface PartyAttributionProps {
  members: PartyMemberResult[];
  onSelectMember: (index: number | null) => void;
  selectedMemberIndex: number | null;
}

export function PartyAttribution({ members, onSelectMember, selectedMemberIndex }: PartyAttributionProps) {
  const { classDataMap } = discoveredData;

  const totalDps = members.reduce((sum, m) => sum + m.dps, 0);

  const sorted = members
    .map((member, originalIndex) => ({ member, originalIndex }))
    .sort((a, b) => (b.member.dps + b.member.buffContribution) - (a.member.dps + a.member.buffContribution));

  return (
    <div className="mt-4">
      <div className="mb-2 text-[11px] uppercase tracking-widest text-text-dim">DPS Attribution</div>

      {totalDps > 0 && (
        <div className="mb-3 flex h-5 w-full overflow-hidden rounded">
          {members.map((member, i) => {
            const displayName = classDataMap.get(member.className)?.className ?? member.className;
            const color = getClassColor(displayName);
            const widthPercent = totalDps > 0 ? (member.dps / totalDps) * 100 : 0;
            return (
              <div
                key={i}
                title={`${displayName}: ${member.dps.toLocaleString()} DPS`}
                style={{ width: `${widthPercent}%`, backgroundColor: color }}
              />
            );
          })}
        </div>
      )}

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-default text-[10px] uppercase tracking-widest text-text-dim">
            <th className="pb-1.5 text-left font-medium">Class</th>
            <th className="pb-1.5 text-right font-medium">Own DPS</th>
            <th className="pb-1.5 text-right font-medium">Buff Value</th>
            <th className="pb-1.5 text-right font-medium">Total Slot Value</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ member, originalIndex }) => {
            const displayName = classDataMap.get(member.className)?.className ?? member.className;
            const color = getClassColor(displayName);
            const isSelected = selectedMemberIndex === originalIndex;
            const slotValue = member.dps + member.buffContribution;

            return (
              <tr
                key={originalIndex}
                onClick={() => onSelectMember(isSelected ? null : originalIndex)}
                className="cursor-pointer border-b border-border-default transition-colors last:border-0 hover:brightness-125"
                style={{
                  backgroundColor: isSelected
                    ? getClassColorWithOpacity(displayName, 0.12)
                    : undefined,
                }}
              >
                <td className="py-2">
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-text-primary">{displayName}</span>
                </td>
                <td className="py-2 text-right text-text-secondary">
                  {member.dps.toLocaleString()}
                </td>
                <td className="py-2 text-right">
                  {member.buffContribution > 0 ? (
                    <span style={{ color: 'rgb(34, 197, 94)' }}>
                      +{member.buffContribution.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-text-dim">—</span>
                  )}
                </td>
                <td className="py-2 text-right font-medium text-text-bright">
                  {slotValue.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
