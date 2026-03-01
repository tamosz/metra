import { useCallback, useRef } from 'react';
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

  const primary = classData.primaryStat;
  const secondary = classData.secondaryStat;
  const secondaryStats: StatKey[] = Array.isArray(secondary) ? secondary : [secondary];
  const relevantStats: StatKey[] = [primary, ...secondaryStats.filter((s) => s !== primary)];

  return (
    <div>
      <SectionLabel>Stats</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
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

      <div className="mt-3">
        <SectionLabel>Attack</SectionLabel>
        <div className="flex flex-col gap-1">
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

function useSpinner(callback: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    callback();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, 80);
    }, 400);
  }, [callback]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchEnd: stop,
  };
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

  const decrement = useCallback(() => {
    onChange(Math.max(0, displayValue - 1));
  }, [displayValue, onChange]);

  const increment = useCallback(() => {
    onChange(displayValue + 1);
  }, [displayValue, onChange]);

  const decSpinner = useSpinner(decrement);
  const incSpinner = useSpinner(increment);

  return (
    <div className={`flex items-center gap-2 py-0.5 pl-2 ${isOverridden ? 'border-l-2 border-blue-400' : 'border-l-2 border-transparent'}`}>
      <span className="w-20 shrink-0 text-xs text-text-muted">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded border border-border-default">
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...decSpinner}
        >
          &minus;
        </button>
        <input
          type="number"
          value={displayValue}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(v);
          }}
          className={`w-[48px] border-x border-border-default bg-bg-raised px-1 py-1 text-center text-sm tabular-nums focus:border-border-active transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            isOverridden ? 'text-blue-400' : 'text-text-primary'
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex h-6 w-5 items-center justify-center bg-bg-raised text-xs text-text-faint hover:bg-bg-active hover:text-text-muted"
          {...incSpinner}
        >
          +
        </button>
      </div>
      <span
        onClick={isOverridden ? onReset : undefined}
        className={`text-[11px] tabular-nums select-none ${
          isOverridden ? 'cursor-pointer text-blue-400' : 'cursor-default text-text-faint'
        }`}
        title={isOverridden ? 'Click to reset' : 'Template value'}
      >
        ({templateValue.toLocaleString()})
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-dim">
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[11px] text-text-faint">
      {children}
    </div>
  );
}
