import type { CharacterBuild } from '@engine/data/types.js';
import type { BuildExplorerState, BuildOverrides } from '../hooks/useBuildExplorer.js';
import { Tooltip } from './Tooltip.js';
import { BUFF_DESCRIPTIONS } from '../utils/game-terms.js';

interface BuildBuffTogglesProps {
  state: BuildExplorerState;
}

const MW_LEVELS = [0, 10, 15, 20, 30];

export function BuildBuffToggles({ state }: BuildBuffTogglesProps) {
  const { template, overrides, setOverride, resetField, classData } = state;
  if (!template || !classData) return null;

  const isMage = classData.damageFormula === 'magic';
  const mwOverridden = 'mwLevel' in overrides;

  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-dim">
        Buffs
      </div>

      <div className="flex flex-col gap-1.5">
        <BuffCheckbox
          label="Echo of Hero"
          overrideKey="echoActive"
          template={template}
          overrides={overrides}
          setOverride={setOverride}
          resetField={resetField}
        />
        <BuffCheckbox
          label="Sharp Eyes"
          overrideKey="sharpEyes"
          template={template}
          overrides={overrides}
          setOverride={setOverride}
          resetField={resetField}
        />
        {!isMage && (
          <BuffCheckbox
            label="Speed Infusion"
            overrideKey="speedInfusion"
            template={template}
            overrides={overrides}
            setOverride={setOverride}
            resetField={resetField}
          />
        )}
        {/* MW Level */}
        <div className={`flex items-center gap-2 py-0.5 pl-2 ${mwOverridden ? 'border-l-2 border-accent' : 'border-l-2 border-transparent'}`}>
          <span className="flex w-[120px] items-center text-xs text-text-secondary">
            MW Level
            <Tooltip text={BUFF_DESCRIPTIONS['MW Level']} />
          </span>
          <select
            value={overrides.mwLevel ?? template.mwLevel}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v === template.mwLevel) {
                resetField('mwLevel');
              } else {
                setOverride('mwLevel', v);
              }
            }}
            className={`cursor-pointer rounded border border-border-default bg-bg-raised px-1.5 py-0.5 text-sm focus:border-border-active transition-colors ${
              mwOverridden ? 'text-accent' : 'text-text-primary'
            }`}
          >
            {MW_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {mwOverridden && (
            <span
              onClick={() => resetField('mwLevel')}
              className="cursor-pointer select-none text-[11px] text-accent"
              title="Click to reset"
            >
              ({template.mwLevel})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type BooleanOverrideKey = 'echoActive' | 'sharpEyes' | 'speedInfusion';

function BuffCheckbox({
  label,
  overrideKey,
  template,
  overrides,
  setOverride,
  resetField,
}: {
  label: string;
  overrideKey: BooleanOverrideKey;
  template: CharacterBuild;
  overrides: Partial<BuildOverrides>;
  setOverride: <K extends keyof BuildOverrides>(key: K, value: BuildOverrides[K]) => void;
  resetField: (key: keyof BuildOverrides) => void;
}) {
  const templateValue = (template as unknown as Record<string, boolean>)[overrideKey] ?? false;
  const isOverridden = overrideKey in overrides;
  const currentValue = (overrides[overrideKey] as boolean | undefined) ?? templateValue;

  return (
    <label className={`flex cursor-pointer items-center gap-2 py-0.5 pl-2 ${isOverridden ? 'border-l-2 border-accent' : 'border-l-2 border-transparent'}`}>
      <input
        type="checkbox"
        checked={currentValue}
        onChange={(e) => {
          const newValue = e.target.checked;
          if (newValue === templateValue) {
            resetField(overrideKey);
          } else {
            setOverride(overrideKey, newValue);
          }
        }}
        className="accent-accent"
      />
      <span className={`text-xs ${isOverridden ? 'text-accent' : 'text-text-secondary'}`}>
        {label}
      </span>
      {BUFF_DESCRIPTIONS[label] && <Tooltip text={BUFF_DESCRIPTIONS[label]} />}
    </label>
  );
}
