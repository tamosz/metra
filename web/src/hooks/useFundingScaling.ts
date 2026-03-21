import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioResult } from '@engine/proposals/types.js';
import {
  allClassBases,
  computeBuildAtFunding,
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import { isResultVisible, type SkillGroupId } from '../utils/skill-groups.js';
import { buildScenarios } from '../utils/scenario-builder.js';
import { resolveActiveScenario } from '../utils/scenario.js';
import type { SimulationOptions } from './useSimulation.js';

export interface FundingPoint {
  funding: number; // 0–100
  [classSkillKey: string]: number | string;
}

export interface FundingLine {
  key: string; // "ClassName — SkillName"
  className: string;
  skillName: string;
}

export interface FundingScalingData {
  points: FundingPoint[];
  lines: FundingLine[];
  yDomain: [number, number];
}

const FUNDING_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const SEP = ' \u2014 ';

export function useFundingScaling(options: {
  activeGroups: Set<SkillGroupId>;
  capEnabled: boolean;
  simOptions: SimulationOptions;
}): FundingScalingData {
  const { activeGroups, capEnabled, simOptions } = options;
  const { targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides } = simOptions;

  return useMemo(() => {
    const { classNames, classDataMap, builds } = discoveredData;

    // Physical class display names (mages don't scale with funding)
    const physicalClassNames = new Set<string>();
    for (const base of allClassBases.values()) {
      if (base.category === 'physical') physicalClassNames.add(base.className);
    }

    const scenarios = buildScenarios(simOptions);
    const config: SimulationConfig = { classes: classNames, scenarios };

    // Run the full simulation at each funding level
    const allLevelResults: { level: number; results: ScenarioResult[] }[] = [];

    for (const level of FUNDING_LEVELS) {
      // Build gear templates: physical classes get scaled builds, mages keep their fixed build
      const scaledBuilds = new Map(builds);
      for (const [slug, base] of allClassBases.entries()) {
        if (base.category === 'physical') {
          scaledBuilds.set(slug, computeBuildAtFunding(base, level / 100));
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

    // Determine which results to show based on active scenario and visibility filters.
    // Use the 100% funding results to determine the set of lines.
    const fullResults = allLevelResults[allLevelResults.length - 1].results;
    const activeScenario = resolveActiveScenario(fullResults, targetCount ?? 1);

    const lineMap = new Map<string, FundingLine>();
    for (const r of fullResults) {
      if (r.scenario !== activeScenario) continue;
      if (!isResultVisible(r, activeGroups)) continue;
      // Exclude mages — they don't scale with funding
      if (!physicalClassNames.has(r.className)) continue;

      const key = `${r.className}${SEP}${r.skillName}`;
      lineMap.set(key, { key, className: r.className, skillName: r.skillName });
    }

    const lines = Array.from(lineMap.values());

    // Build chart data points
    const points: FundingPoint[] = allLevelResults.map(({ level, results }) => {
      const point: FundingPoint = { funding: level };

      for (const r of results) {
        if (r.scenario !== activeScenario) continue;
        const key = `${r.className}${SEP}${r.skillName}`;
        if (!lineMap.has(key)) continue;
        point[key] = capEnabled ? r.dps.dps : r.dps.uncappedDps;
      }

      return point;
    });

    // Compute tight yDomain
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
