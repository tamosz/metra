import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioResult } from '@engine/proposals/types.js';
import {
  allClassBases,
  computeBuildAtPowerLevel,
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import { isResultVisible, type SkillGroupId } from '../utils/skill-groups.js';
import { buildScenarios } from '../utils/scenario-builder.js';
import { resolveActiveScenario } from '../utils/scenario.js';
import type { SimulationOptions } from './useSimulation.js';

export interface ScalingPoint {
  power: number; // 0–100
  [classSkillKey: string]: number | string;
}

export interface ScalingLine {
  key: string; // "ClassName — SkillName"
  className: string;
  skillName: string;
}

export interface PowerScalingData {
  points: ScalingPoint[];
  lines: ScalingLine[];
  yDomain: [number, number];
}

const POWER_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const SEP = ' \u2014 ';

export function usePowerScaling(options: {
  activeGroups: Set<SkillGroupId>;
  capEnabled: boolean;
  simOptions: SimulationOptions;
}): PowerScalingData {
  const { activeGroups, capEnabled, simOptions } = options;
  const { targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides } = simOptions;

  return useMemo(() => {
    const { classNames, classDataMap, builds } = discoveredData;

    const physicalClassNames = new Set<string>();
    for (const base of allClassBases.values()) {
      if (base.category === 'physical') physicalClassNames.add(base.className);
    }

    const scenarios = buildScenarios(simOptions);
    const config: SimulationConfig = { classes: classNames, scenarios };

    const allLevelResults: { level: number; results: ScenarioResult[] }[] = [];

    for (const level of POWER_LEVELS) {
      const scaledBuilds = new Map(builds);
      for (const [slug, base] of allClassBases.entries()) {
        if (base.category === 'physical') {
          scaledBuilds.set(slug, computeBuildAtPowerLevel(base, level / 100));
        }
      }

      const results = runSimulation(
        config,
        classDataMap,
        scaledBuilds,
        weaponData,
        attackSpeedData,
        mwData,
      );

      allLevelResults.push({ level, results });
    }

    const fullResults = allLevelResults[allLevelResults.length - 1].results;
    const activeScenario = resolveActiveScenario(fullResults, targetCount ?? 1);

    const lineMap = new Map<string, ScalingLine>();
    for (const r of fullResults) {
      if (r.scenario !== activeScenario) continue;
      if (!isResultVisible(r, activeGroups)) continue;
      if (!physicalClassNames.has(r.className)) continue;

      const key = `${r.className}${SEP}${r.skillName}`;
      lineMap.set(key, { key, className: r.className, skillName: r.skillName });
    }

    const lines = Array.from(lineMap.values());

    const points: ScalingPoint[] = allLevelResults.map(({ level, results }) => {
      const point: ScalingPoint = { power: level };

      for (const r of results) {
        if (r.scenario !== activeScenario) continue;
        const key = `${r.className}${SEP}${r.skillName}`;
        if (!lineMap.has(key)) continue;
        point[key] = capEnabled ? r.dps.dps : r.dps.uncappedDps;
      }

      return point;
    });

    let yMin = Infinity;
    let yMax = -Infinity;
    for (const point of points) {
      for (const line of lines) {
        const val = point[line.key];
        if (typeof val === 'number') {
          if (val < yMin) yMin = val;
          if (val > yMax) yMax = val;
        }
      }
    }
    if (!isFinite(yMin) || !isFinite(yMax)) {
      yMin = 0;
      yMax = 1;
    }

    return { points, lines, yDomain: [yMin, yMax] };
  }, [activeGroups, capEnabled, targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides]);
}
