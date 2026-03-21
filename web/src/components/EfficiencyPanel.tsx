import { useState } from 'react';
import { discoveredData } from '../data/bundle.js';
import { useSimulationFilters } from '../context/SimulationFiltersContext.js';

interface RotationConfig {
  key: string;
  className: string;
  rotationName: string;
  components: { skill: string; weight: number }[];
  description: string;
}

const CONFIGURABLE_ROTATIONS: RotationConfig[] = [];
for (const [, classData] of discoveredData.classDataMap) {
  if (classData.mixedRotations) {
    for (const rotation of classData.mixedRotations) {
      // Only 2-component rotations are supported by the slider UI
      if (rotation.components.length === 2) {
        CONFIGURABLE_ROTATIONS.push({
          key: `${classData.className}.${rotation.name}`,
          className: classData.className,
          rotationName: rotation.name,
          components: rotation.components,
          description: rotation.description,
        });
      }
    }
  }
}

export function EfficiencyPanel() {
  const { efficiencyOverrides, setEfficiencyOverrides } = useSimulationFilters();
  const [expanded, setExpanded] = useState(false);

  if (CONFIGURABLE_ROTATIONS.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-dim">
        Skill Efficiency
      </span>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 text-xs font-medium transition-colors border border-border-default bg-bg-raised text-text-muted"
      >
        Adjust
        <svg
          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="flex flex-col gap-2.5 rounded border border-border-default bg-bg-raised p-2.5 mt-1">
          {CONFIGURABLE_ROTATIONS.map((rotation) => (
            <EfficiencySlider
              key={rotation.key}
              rotation={rotation}
              value={efficiencyOverrides[rotation.key]}
              onChange={(weights) => {
                const next = { ...efficiencyOverrides };
                if (weights) {
                  next[rotation.key] = weights;
                } else {
                  delete next[rotation.key];
                }
                setEfficiencyOverrides(next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EfficiencySlider({
  rotation,
  value,
  onChange,
}: {
  rotation: RotationConfig;
  value: number[] | undefined;
  onChange: (weights: number[] | null) => void;
}) {
  const firstWeight = value ? value[0] : rotation.components[0].weight;
  const pct = Math.round(firstWeight * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPct = parseInt(e.target.value, 10);
    const w1 = newPct / 100;
    const w2 = 1 - w1;
    const defaultW1 = rotation.components[0].weight;
    if (Math.abs(w1 - defaultW1) < 0.005) {
      onChange(null);
    } else {
      onChange([w1, w2]);
    }
  };

  let label: string;
  if (rotation.components.length === 2) {
    const name1 = rotation.components[0].skill;
    const name2 = rotation.components[1].skill;
    const base1 = name1.replace(/\s*\(.*\)/, '');
    const base2 = name2.replace(/\s*\(.*\)/, '');
    if (base1 === base2) {
      const match = name1.match(/\((.+)\)/);
      label = match ? `${pct}% ${match[1]}` : `${pct}%`;
    } else {
      label = `${pct}% ${base1} / ${100 - pct}% ${base2}`;
    }
  } else {
    label = `${pct}%`;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-dim whitespace-nowrap w-16 shrink-0" title={rotation.description}>
        {rotation.className}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        onChange={handleChange}
        className="h-1 w-28 cursor-pointer accent-emerald-500"
        title={rotation.description}
      />
      <span className="text-[11px] tabular-nums text-text-muted whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
