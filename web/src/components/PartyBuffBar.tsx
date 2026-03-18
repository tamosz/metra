import type { PartyBuffState } from '@metra/engine';

interface PartyBuffBarProps {
  buffs: PartyBuffState;
  totalDps: number;
}

const BUFF_LABELS: { key: keyof PartyBuffState; label: string }[] = [
  { key: 'sharpEyes', label: 'SE' },
  { key: 'rage', label: 'Rage +12' },
  { key: 'speedInfusion', label: 'SI' },
];

export function PartyBuffBar({ buffs, totalDps }: PartyBuffBarProps) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="flex flex-1 gap-1.5">
        {BUFF_LABELS.map(({ key, label }) => (
          <span key={key} className="rounded px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: buffs[key] ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: buffs[key] ? 'rgb(34, 197, 94)' : 'rgba(255, 255, 255, 0.3)',
            }}>
            {label}
          </span>
        ))}
        <span className="rounded px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'rgb(34, 197, 94)' }}>
          MW20
        </span>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-widest text-text-dim">Total Party DPS</div>
        <div className="text-2xl font-bold text-accent">{totalDps.toLocaleString()}</div>
      </div>
    </div>
  );
}
