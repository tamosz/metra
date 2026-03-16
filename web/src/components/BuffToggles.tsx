import type { CharacterBuild } from '@metra/engine';
import { useSimulationControls } from '../context/SimulationControlsContext.js';
import { TOGGLE_ON, TOGGLE_OFF_RED } from '../utils/styles.js';

type BuffOverrides = Partial<Pick<CharacterBuild, 'sharpEyes' | 'echoActive' | 'speedInfusion' | 'mwLevel' | 'attackPotion' | 'bullseye'>>;

interface BuffDef {
  key: keyof BuffOverrides;
  label: string;
  offValue: boolean | number;
  tooltip: string;
  classFilter?: string;
}

const BUFFS: readonly BuffDef[] = [
  { key: 'sharpEyes', label: 'SE', offValue: false, tooltip: 'Sharp Eyes' },
  { key: 'echoActive', label: 'Echo', offValue: false, tooltip: 'Echo of Hero' },
  { key: 'speedInfusion', label: 'SI', offValue: false, tooltip: 'Speed Infusion' },
  { key: 'mwLevel', label: 'MW', offValue: 0, tooltip: 'Maple Warrior' },
  { key: 'attackPotion', label: 'Pot', offValue: 0, tooltip: 'Attack Potion' },
  { key: 'bullseye', label: 'Bull', offValue: false, tooltip: 'Bullseye (Corsair)', classFilter: 'Corsair' },
];

export type { BuffOverrides };

interface BuffTogglesProps {
  visibleClassNames?: Set<string>;
}

export function BuffToggles({ visibleClassNames }: BuffTogglesProps) {
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

  const visibleBuffs = BUFFS.filter((b) => {
    if (!b.classFilter) return true;
    return !visibleClassNames || visibleClassNames.has(b.classFilter);
  });

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Buffs</span>
      <div className="flex gap-1">
        {visibleBuffs.map(({ key, label, offValue, tooltip }) => {
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
