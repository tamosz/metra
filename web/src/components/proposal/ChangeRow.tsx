import type { ProposalChange } from '@engine/proposals/types.js';
import { skillSlug } from '@engine/proposals/apply.js';
import type { DiscoveryResult } from '../../data/bundle.js';

const FIELD_LABELS: Record<string, string> = {
  basePower: 'Base Power',
  multiplier: 'Multiplier',
  hitCount: 'Hit Count',
};

function resolveChangeDisplay(
  target: string,
  discovery: DiscoveryResult
): { className: string; skillName: string } | null {
  const dotIndex = target.indexOf('.');
  if (dotIndex === -1) return null;
  const classKey = target.slice(0, dotIndex);
  const skillKey = target.slice(dotIndex + 1);
  const classData = discovery.classDataMap.get(classKey);
  if (!classData) return null;
  const skill = classData.skills.find((s) => skillSlug(s.name) === skillKey);
  return {
    className: classData.className,
    skillName: skill?.name ?? skillKey,
  };
}

export function ChangeRow({ change, discovery, onRemove }: { change: ProposalChange; discovery: DiscoveryResult; onRemove: () => void }) {
  const display = resolveChangeDisplay(change.target, discovery);
  const fieldLabel = FIELD_LABELS[change.field] ?? change.field;

  return (
    <div data-testid="change-row" className="mb-1.5 flex items-center gap-2 rounded-md bg-bg-raised px-3 py-2 text-sm">
      {display ? (
        <>
          <span className="font-medium text-text-primary">{display.className}</span>
          <span className="text-text-dim">&mdash;</span>
          <span className="text-text-secondary">{display.skillName}:</span>
        </>
      ) : (
        <span className="text-text-muted">{change.target}</span>
      )}
      <span className="text-text-muted">{fieldLabel}</span>
      {change.from !== undefined && (
        <span className="text-text-dim">{change.from}</span>
      )}
      <span className="text-text-faint">&rarr;</span>
      <span className="font-semibold text-accent">{change.to}</span>
      <button onClick={onRemove} className="ml-auto cursor-pointer border-none bg-transparent p-0 text-xs text-negative hover:text-red-400 transition-colors">
        Remove
      </button>
    </div>
  );
}
