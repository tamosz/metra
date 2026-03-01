import { describe, it, expect } from 'vitest';
import { getScenarioDescription } from './game-terms.js';

describe('getScenarioDescription', () => {
  it('returns static description for known scenarios', () => {
    expect(getScenarioDescription('Buffed')).toContain('All party buffs');
    expect(getScenarioDescription('Unbuffed')).toContain('No party buffs');
    expect(getScenarioDescription('No-Echo')).toContain('Echo of Hero');
    expect(getScenarioDescription('Bossing (50% PDR)')).toContain('50%');
    expect(getScenarioDescription('Bossing (Undead, 50% PDR)')).toContain('undead');
  });

  it('returns dynamic description for Training (N mobs)', () => {
    const desc = getScenarioDescription('Training (6 mobs)');
    expect(desc).toContain('6 mobs');
    expect(desc).toContain('AoE');
  });

  it('returns dynamic description for Training (1 mob) singular', () => {
    const desc = getScenarioDescription('Training (1 mob)');
    expect(desc).toContain('1 mob');
  });

  it('returns undefined for unknown scenario names', () => {
    expect(getScenarioDescription('FooBar')).toBeUndefined();
  });

  it('returns undefined for near-miss patterns', () => {
    expect(getScenarioDescription('Training 6 mobs')).toBeUndefined();
    expect(getScenarioDescription('training (6 mobs)')).toBeUndefined();
  });
});
