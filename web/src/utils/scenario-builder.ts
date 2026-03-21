import type { ScenarioConfig } from '@engine/proposals/types.js';
import type { SimulationOptions } from '../hooks/useSimulation.js';

/**
 * Build ScenarioConfig[] from simulation control state.
 * Accepts optional extra overrides (e.g. buffOff for breakdown runs).
 */
export function buildScenarios(
  options: SimulationOptions,
  extraOverrides?: Record<string, unknown>,
): ScenarioConfig[] {
  const { targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides } = options;
  const hasElementMods = elementModifiers && Object.keys(elementModifiers).length > 0;
  const hasEfficiencyOverrides = efficiencyOverrides && Object.keys(efficiencyOverrides).length > 0;

  const mergedOverrides = extraOverrides
    ? { ...buffOverrides, ...extraOverrides }
    : buffOverrides && Object.keys(buffOverrides).length > 0
      ? { ...buffOverrides }
      : undefined;

  const scenario: ScenarioConfig = { name: 'Baseline' };
  if (mergedOverrides) scenario.overrides = mergedOverrides;
  if (hasElementMods) scenario.elementModifiers = { ...elementModifiers };
  if (kbConfig) {
    scenario.bossAttackInterval = kbConfig.bossAttackInterval;
    scenario.bossAccuracy = kbConfig.bossAccuracy;
  }
  if (hasEfficiencyOverrides) scenario.efficiencyOverrides = { ...efficiencyOverrides };

  const scenarios: ScenarioConfig[] = [scenario];
  if (targetCount != null && targetCount > 1) {
    const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
    if (mergedOverrides) training.overrides = mergedOverrides;
    if (hasElementMods) training.elementModifiers = { ...elementModifiers };
    if (kbConfig) {
      training.bossAttackInterval = kbConfig.bossAttackInterval;
      training.bossAccuracy = kbConfig.bossAccuracy;
    }
    if (hasEfficiencyOverrides) training.efficiencyOverrides = { ...efficiencyOverrides };
    scenarios.push(training);
  }

  return scenarios;
}
