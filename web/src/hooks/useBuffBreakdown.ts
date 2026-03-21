import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioResult } from '@engine/proposals/types.js';
import {
  discoveredData,
  gameData,
} from '../data/bundle.js';
import type { SimulationOptions } from './useSimulation.js';
import { buildScenarios } from '../utils/scenario-builder.js';

export interface BuffBreakdown {
  baseDps: number;
  seContribution: number;
  siContribution: number;
  echoContribution: number;
}

export type BuffBreakdownMap = Map<string, BuffBreakdown>;

export function breakdownKey(className: string, skillName: string, scenario: string): string {
  return `${className}|${skillName}|${scenario}`;
}

function runWithBuffOff(
  options: SimulationOptions,
  buffOff: Record<string, unknown>,
): ScenarioResult[] {
  const { classNames, classDataMap, builds } = discoveredData;

  const scenarios = buildScenarios(options, buffOff);
  const config: SimulationConfig = { classes: classNames, scenarios };
  return runSimulation(config, classDataMap, builds, gameData);
}

function resultKey(r: ScenarioResult): string {
  return breakdownKey(r.className, r.skillName, r.scenario);
}

export function useBuffBreakdown(
  options: SimulationOptions,
  fullResults: ScenarioResult[],
  enabled: boolean,
  capEnabled: boolean,
): BuffBreakdownMap {
  return useMemo(() => {
    const map: BuffBreakdownMap = new Map();
    if (!enabled || fullResults.length === 0) return map;

    const { buffOverrides } = options;
    const seAlreadyOff = buffOverrides && 'sharpEyes' in buffOverrides;
    const siAlreadyOff = buffOverrides && 'speedInfusion' in buffOverrides;
    const echoAlreadyOff = buffOverrides && 'echoActive' in buffOverrides;

    const withoutSe = seAlreadyOff ? null : runWithBuffOff(options, { sharpEyes: false });
    const withoutSi = siAlreadyOff ? null : runWithBuffOff(options, { speedInfusion: false });
    const withoutEcho = echoAlreadyOff ? null : runWithBuffOff(options, { echoActive: false });

    const getDps = (r: ScenarioResult) => capEnabled ? r.dps.dps : r.dps.uncappedDps;

    const withoutSeMap = new Map<string, number>();
    const withoutSiMap = new Map<string, number>();
    const withoutEchoMap = new Map<string, number>();

    if (withoutSe) for (const r of withoutSe) withoutSeMap.set(resultKey(r), getDps(r));
    if (withoutSi) for (const r of withoutSi) withoutSiMap.set(resultKey(r), getDps(r));
    if (withoutEcho) for (const r of withoutEcho) withoutEchoMap.set(resultKey(r), getDps(r));

    for (const r of fullResults) {
      const key = resultKey(r);
      const fullDps = getDps(r);

      const seContribution = withoutSe ? fullDps - (withoutSeMap.get(key) ?? fullDps) : 0;
      const siContribution = withoutSi ? fullDps - (withoutSiMap.get(key) ?? fullDps) : 0;
      const echoContribution = withoutEcho ? fullDps - (withoutEchoMap.get(key) ?? fullDps) : 0;
      const baseDps = fullDps - seContribution - siContribution - echoContribution;

      map.set(key, { baseDps, seContribution, siContribution, echoContribution });
    }

    return map;
  }, [options, fullResults, enabled, capEnabled]);
}
