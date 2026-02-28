import type { BuildExplorerState, BuildOverrides } from '../hooks/useBuildExplorer.js';

interface BuildStatEditorProps {
  state: BuildExplorerState;
}

type StatKey = 'STR' | 'DEX' | 'INT' | 'LUK';

const baseStatKeys: Record<StatKey, keyof BuildOverrides> = {
  STR: 'baseSTR',
  DEX: 'baseDEX',
  INT: 'baseINT',
  LUK: 'baseLUK',
};

const gearStatKeys: Record<StatKey, keyof BuildOverrides> = {
  STR: 'gearSTR',
  DEX: 'gearDEX',
  INT: 'gearINT',
  LUK: 'gearLUK',
};

export function BuildStatEditor({ state }: BuildStatEditorProps) {
  const { classData, template, overrides, setOverride, resetField } = state;
  if (!classData || !template) return null;

  // Determine which stats to show based on class
  const primary = classData.primaryStat;
  const secondary = classData.secondaryStat;
  const secondaryStats: StatKey[] = Array.isArray(secondary) ? secondary : [secondary];
  const relevantStats: StatKey[] = [primary, ...secondaryStats.filter((s) => s !== primary)];

  return (
    <div>
      <SectionLabel>Stats</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Base Stats */}
        <div>
          <SubLabel>Base Stats</SubLabel>
          {relevantStats.map((stat) => {
            const overrideKey = baseStatKeys[stat];
            return (
              <StatInput
                key={`base-${stat}`}
                label={stat}
                value={overrides[overrideKey] as number | undefined}
                templateValue={template.baseStats[stat]}
                isOverridden={overrideKey in overrides}
                onChange={(v) => setOverride(overrideKey, v)}
                onReset={() => resetField(overrideKey)}
              />
            );
          })}
        </div>

        {/* Gear Stats */}
        <div>
          <SubLabel>Gear Stats</SubLabel>
          {relevantStats.map((stat) => {
            const overrideKey = gearStatKeys[stat];
            return (
              <StatInput
                key={`gear-${stat}`}
                label={stat}
                value={overrides[overrideKey] as number | undefined}
                templateValue={template.gearStats[stat]}
                isOverridden={overrideKey in overrides}
                onChange={(v) => setOverride(overrideKey, v)}
                onReset={() => resetField(overrideKey)}
              />
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <SectionLabel>Attack</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StatInput
            label="Weapon ATK"
            value={overrides.totalWeaponAttack}
            templateValue={template.totalWeaponAttack}
            isOverridden={'totalWeaponAttack' in overrides}
            onChange={(v) => setOverride('totalWeaponAttack', v)}
            onReset={() => resetField('totalWeaponAttack')}
          />
          <StatInput
            label="Atk Potion"
            value={overrides.attackPotion}
            templateValue={template.attackPotion}
            isOverridden={'attackPotion' in overrides}
            onChange={(v) => setOverride('attackPotion', v)}
            onReset={() => resetField('attackPotion')}
          />
          {template.projectile > 0 && (
            <StatInput
              label="Projectile"
              value={overrides.projectile}
              templateValue={template.projectile}
              isOverridden={'projectile' in overrides}
              onChange={(v) => setOverride('projectile', v)}
              onReset={() => resetField('projectile')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatInput({
  label,
  value,
  templateValue,
  isOverridden,
  onChange,
  onReset,
}: {
  label: string;
  value: number | undefined;
  templateValue: number;
  isOverridden: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  const displayValue = value ?? templateValue;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '3px 0',
      borderLeft: isOverridden ? '2px solid #60a5fa' : '2px solid transparent',
      paddingLeft: 8,
    }}>
      <span style={{ fontSize: 12, color: '#888', width: 80, flexShrink: 0 }}>{label}</span>
      <input
        type="number"
        value={displayValue}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v)) onChange(v);
        }}
        style={{
          background: '#12121a',
          color: isOverridden ? '#60a5fa' : '#e0e0e8',
          border: '1px solid #2a2a3e',
          padding: '4px 8px',
          borderRadius: 3,
          fontSize: 13,
          width: 72,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#3a3a5e'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3e'; }}
      />
      <span
        onClick={isOverridden ? onReset : undefined}
        style={{
          fontSize: 11,
          color: isOverridden ? '#60a5fa' : '#555',
          cursor: isOverridden ? 'pointer' : 'default',
          fontVariantNumeric: 'tabular-nums',
          userSelect: 'none',
        }}
        title={isOverridden ? 'Click to reset' : 'Template value'}
      >
        ({templateValue.toLocaleString()})
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 8,
      fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
      {children}
    </div>
  );
}
