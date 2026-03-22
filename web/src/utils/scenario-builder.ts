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

  // Build common config once — shared across all scenarios
  const common: Partial<ScenarioConfig> = {};
  if (mergedOverrides) common.overrides = mergedOverrides;
  if (hasElementMods) common.elementModifiers = { ...elementModifiers };
  if (kbConfig) {
    common.bossAttackInterval = kbConfig.bossAttackInterval;
    common.bossAccuracy = kbConfig.bossAccuracy;
  }
  if (hasEfficiencyOverrides) common.efficiencyOverrides = { ...efficiencyOverrides };

  const scenarios: ScenarioConfig[] = [{ name: 'Baseline', ...common }];
  if (targetCount != null && targetCount > 1) {
    scenarios.push({ name: `Training (${targetCount} mobs)`, targetCount, ...common });
  }

  return scenarios;
}
