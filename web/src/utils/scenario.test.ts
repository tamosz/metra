import { describe, it, expect } from 'vitest';
import { resolveActiveScenario } from './scenario.js';
import type { ScenarioResult } from '@engine/proposals/types.js';

function makeResult(scenario: string): ScenarioResult {
  return {
    className: 'Hero',
    skillName: 'Brandish',
    tier: 'high',
    scenario,
    headline: true,
    dps: { dps: 1000, uncappedDps: 1000, capLoss: 0 },
  } as unknown as ScenarioResult;
}

describe('resolveActiveScenario', () => {
  it('returns first scenario when targetCount is 1', () => {
    const results = [makeResult('Bossing'), makeResult('Training (6 mobs)')];
    expect(resolveActiveScenario(results, 1)).toBe('Bossing');
  });

  it('returns training scenario when targetCount > 1', () => {
    const results = [makeResult('Bossing'), makeResult('Training (6 mobs)')];
    expect(resolveActiveScenario(results, 6)).toBe('Training (6 mobs)');
  });

  it('returns undefined for empty results', () => {
    expect(resolveActiveScenario([], 1)).toBeUndefined();
  });

  it('returns undefined when targetCount > 1 but no training scenario exists', () => {
    const results = [makeResult('Bossing')];
    expect(resolveActiveScenario(results, 6)).toBeUndefined();
  });
});
