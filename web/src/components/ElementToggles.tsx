import { useSimulationFilters } from '../context/SimulationFiltersContext.js';

const ELEMENTS = ['Holy', 'Fire', 'Ice', 'Lightning', 'Poison'] as const;

const SHORT_LABELS: Record<string, string> = {
  Holy: 'Ho',
  Fire: 'Fi',
  Ice: 'Ic',
  Lightning: 'Li',
  Poison: 'Po',
};

type ElementState = 'neutral' | 'weak' | 'strong';

function getState(modifiers: Record<string, number>, element: string): ElementState {
  const mod = modifiers[element];
  if (mod === 1.5) return 'weak';
  if (mod === 0.5) return 'strong';
  return 'neutral';
}

function nextState(current: ElementState): ElementState {
  if (current === 'neutral') return 'weak';
  if (current === 'weak') return 'strong';
  return 'neutral';
}

const MULTIPLIERS: Record<ElementState, number | undefined> = {
  neutral: undefined,
  weak: 1.5,
  strong: 0.5,
};

const STATE_STYLES: Record<ElementState, string> = {
  neutral: 'border border-transparent bg-transparent text-text-dim hover:text-text-muted',
  weak: 'border border-emerald-700/50 bg-emerald-950/40 text-emerald-400',
  strong: 'border border-red-700/50 bg-red-950/40 text-red-400',
};

function getTooltip(element: string, state: ElementState): string {
  if (state === 'neutral') return `${element}: neutral (click to set weak)`;
  if (state === 'weak') return `${element}: weak (1.5\u00d7) \u2014 click to set strong`;
  return `${element}: strong (0.5\u00d7) \u2014 click to reset`;
}

export function ElementToggles() {
  const { elementModifiers: modifiers, setElementModifiers: onChange } = useSimulationFilters();

  const handleClick = (element: string) => {
    const current = getState(modifiers, element);
    const next = nextState(current);
    const multiplier = MULTIPLIERS[next];
    const updated = { ...modifiers };
    if (multiplier === undefined) {
      delete updated[element];
    } else {
      updated[element] = multiplier;
    }
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">Elements</span>
      <div className="flex gap-1">
        {ELEMENTS.map((element) => {
          const state = getState(modifiers, element);
          return (
            <button
              key={element}
              type="button"
              title={getTooltip(element, state)}
              onClick={() => handleClick(element)}
              className={`cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${STATE_STYLES[state]}`}
            >
              {SHORT_LABELS[element]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
