import type { ScenarioResult } from '@engine/proposals/types.js';

/**
 * Resolve the active scenario name from simulation results.
 * When targetCount > 1, picks the Training scenario; otherwise the first result's scenario.
 */
export function resolveActiveScenario(
  results: ScenarioResult[],
  targetCount: number,
): string | undefined {
  if (targetCount > 1) {
    return results.find((r) => r.scenario.startsWith('Training'))?.scenario;
  }
  return results[0]?.scenario;
}
