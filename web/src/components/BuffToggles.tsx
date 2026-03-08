import type { CharacterBuild } from '@metra/engine';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { TOGGLE_ON, TOGGLE_OFF_RED } from '../utils/styles.js';

type BuffOverrides = Partial<Pick<CharacterBuild, 'sharpEyes' | 'echoActive' | 'speedInfusion' | 'mwLevel' | 'attackPotion'>>;

const BUFFS = [
  { key: 'sharpEyes' as const, label: 'SE', offValue: false as const, tooltip: 'Sharp Eyes' },
  { key: 'echoActive' as const, label: 'Echo', offValue: false as const, tooltip: 'Echo of Hero' },
  { key: 'speedInfusion' as const, label: 'SI', offValue: false as const, tooltip: 'Speed Infusion' },
  { key: 'mwLevel' as const, label: 'MW', offValue: 0 as const, tooltip: 'Maple Warrior' },
  { key: 'attackPotion' as const, label: 'Pot', offValue: 0 as const, tooltip: 'Attack Potion' },
] as const;


export type { BuffOverrides };

export function BuffToggles() {
  const { buffOverrides: overrides, setBuffOverrides: onChange } = useSimulationControls();

  const handleClick = (key: keyof BuffOverrides, offValue: boolean | number) => {
    const isOff = key in overrides;
    const updated = { ...overrides };
    if (isOff) {
      delete updated[key];
    } else {
      (updated as Record<string, unknown>)[key] = offValue;
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Buffs</span>
      <div className="flex gap-1">
        {BUFFS.map(({ key, label, offValue, tooltip }) => {
          const isOff = key in overrides;
          return (
            <button
              key={key}
              type="button"
              title={isOff ? `${tooltip}: OFF (click to enable)` : `${tooltip}: ON (click to disable)`}
              onClick={() => handleClick(key, offValue)}
              className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${isOff ? TOGGLE_OFF_RED : TOGGLE_ON}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
