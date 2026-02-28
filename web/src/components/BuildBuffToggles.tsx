import type { CharacterBuild } from '@engine/data/types.js';
import type { BuildExplorerState, BuildOverrides } from '../hooks/useBuildExplorer.js';

interface BuildBuffTogglesProps {
  state: BuildExplorerState;
}

const MW_LEVELS = [0, 10, 15, 20, 30];

export function BuildBuffToggles({ state }: BuildBuffTogglesProps) {
  const { template, overrides, setOverride, resetField, classData } = state;
  if (!template || !classData) return null;

  const showShadowPartner = template.shadowPartner !== undefined;

  return (
    <div>
      <div style={{
        fontSize: 11,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 8,
        fontWeight: 500,
      }}>
        Buffs
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        <BuffCheckbox
          label="Speed Infusion"
          overrideKey="speedInfusion"
          template={template}
          overrides={overrides}
          setOverride={setOverride}
          resetField={resetField}
        />
        {showShadowPartner && (
          <BuffCheckbox
            label="Shadow Partner"
            overrideKey="shadowPartner"
            template={template}
            overrides={overrides}
            setOverride={setOverride}
            resetField={resetField}
          />
        )}

        {/* MW Level */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderLeft: 'mapleWarriorLevel' in overrides ? '2px solid #60a5fa' : '2px solid transparent',
          paddingLeft: 8,
          padding: '3px 0 3px 8px',
        }}>
          <span style={{ fontSize: 12, color: '#ccc', width: 120 }}>MW Level</span>
          <select
            value={overrides.mapleWarriorLevel ?? template.mapleWarriorLevel}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v === template.mapleWarriorLevel) {
                resetField('mapleWarriorLevel');
              } else {
                setOverride('mapleWarriorLevel', v);
              }
            }}
            style={{
              background: '#12121a',
              color: 'mapleWarriorLevel' in overrides ? '#60a5fa' : '#e0e0e8',
              border: '1px solid #2a2a3e',
              padding: '3px 6px',
              borderRadius: 3,
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {MW_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {'mapleWarriorLevel' in overrides && (
            <span
              onClick={() => resetField('mapleWarriorLevel')}
              style={{ fontSize: 11, color: '#60a5fa', cursor: 'pointer', userSelect: 'none' }}
              title="Click to reset"
            >
              ({template.mapleWarriorLevel})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type BooleanOverrideKey = 'echoActive' | 'sharpEyes' | 'speedInfusion' | 'shadowPartner';

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
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      borderLeft: isOverridden ? '2px solid #60a5fa' : '2px solid transparent',
      paddingLeft: 8,
      padding: '3px 0 3px 8px',
    }}>
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
        style={{ accentColor: '#60a5fa' }}
      />
      <span style={{ fontSize: 12, color: isOverridden ? '#60a5fa' : '#ccc' }}>
        {label}
      </span>
    </label>
  );
}
