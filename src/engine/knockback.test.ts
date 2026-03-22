import { describe, it, expect } from 'vitest';
import {
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  DEFAULT_KB_RECOVERY,
  CHANNEL_WIND_UP,
  type SkillEntry,
} from '@metra/engine';

function makeSkill(overrides: Partial<SkillEntry> = {}): SkillEntry {
  return {
    name: 'Test Skill',
    basePower: 100,
    multiplier: 1,
    hitCount: 1,
    speedCategory: 'Test',
    weaponType: '2H Sword',
    ...overrides,
  };
}

describe('calculateDodgeChance', () => {
  it('returns minDodge when avoidability is 0 (non-thief)', () => {
    // 0 / (4.5 * 250) = 0, clamped to non-thief floor 0.02
    expect(calculateDodgeChance(0, 250)).toBeCloseTo(0.02);
  });

  it('returns minDodge when avoidability is 0 (thief)', () => {
    expect(calculateDodgeChance(0, 250, { minDodge: 0.05, maxDodge: 0.95 })).toBeCloseTo(0.05);
  });

  it('computes linear dodge for moderate avoidability', () => {
    // 300 / (4.5 * 250) = 0.2667
    expect(calculateDodgeChance(300, 250)).toBeCloseTo(0.2667, 3);
  });

  it('caps at maxDodge for non-thieves (80%)', () => {
    // 1000 / (4.5 * 250) = 0.889, capped to 0.80
    expect(calculateDodgeChance(1000, 250)).toBeCloseTo(0.80);
  });

  it('caps at maxDodge for thieves (95%)', () => {
    // 1000 / (4.5 * 100) = 2.22, capped to 0.95
    expect(calculateDodgeChance(1000, 100, { minDodge: 0.05, maxDodge: 0.95 })).toBeCloseTo(0.95);
  });

  it('spot-check: Voodoos (acc ~210), 756 avoid = 80% cap', () => {
    // 756 / (4.5 * 210) = 0.80, exactly at non-thief cap
    expect(calculateDodgeChance(756, 210)).toBeCloseTo(0.80);
  });

  it('spot-check: NL 300 avoid vs boss acc 250', () => {
    // 300 / (4.5 * 250) = 0.2667
    expect(calculateDodgeChance(300, 250, { minDodge: 0.05, maxDodge: 0.95 })).toBeCloseTo(0.2667, 3);
  });

  it('spot-check: warrior 10 avoid vs boss acc 250 hits floor', () => {
    // 10 / (4.5 * 250) = 0.0089, clamped to 0.02
    expect(calculateDodgeChance(10, 250)).toBeCloseTo(0.02);
  });

  it('applies level penalty to avoidability', () => {
    // effectiveAvoid = 300 - 20/2 = 290
    // 290 / (4.5 * 250) = 0.2578
    expect(calculateDodgeChance(300, 250, { levelDifference: 20 })).toBeCloseTo(0.2578, 3);
  });

  it('level penalty does not reduce avoidability below 0', () => {
    // effectiveAvoid = 10 - 200/2 = -90 → clamped to 0
    // 0 / (4.5 * 250) = 0, clamped to minDodge 0.02
    expect(calculateDodgeChance(10, 250, { levelDifference: 200 })).toBeCloseTo(0.02);
  });

  it('handles 0 accuracy gracefully (returns maxDodge)', () => {
    // Division by 0 → Infinity, capped to maxDodge
    expect(calculateDodgeChance(100, 0)).toBeCloseTo(0.80);
  });

  it('negative level difference is ignored', () => {
    // Player higher level than monster → no penalty
    // effectiveAvoid = 300 - max(0, -10)/2 = 300
    expect(calculateDodgeChance(300, 250, { levelDifference: -10 })).toBeCloseTo(0.2667, 3);
  });
});

describe('calculateKnockbackProbability', () => {
  it('returns 1.0 with no defenses', () => {
    expect(calculateKnockbackProbability(0, 0, 0)).toBe(1.0);
  });

  it('returns 0.1 for warrior with 90% stance', () => {
    expect(calculateKnockbackProbability(0, 0.9, 0)).toBeCloseTo(0.1);
  });

  it('returns 0.7 for Night Lord with 30% shadow shifter', () => {
    expect(calculateKnockbackProbability(0, 0, 0.3)).toBeCloseTo(0.7);
  });

  it('returns 0.6 for Shadower with 40% shadow shifter', () => {
    expect(calculateKnockbackProbability(0, 0, 0.4)).toBeCloseTo(0.6);
  });

  it('combines dodge and stance multiplicatively', () => {
    // 20% dodge, 90% stance: (1-0.2) × (1-0.9) × (1-0) = 0.08
    expect(calculateKnockbackProbability(0.2, 0.9, 0)).toBeCloseTo(0.08);
  });

  it('combines all three defenses', () => {
    // 10% dodge, 50% stance, 30% shifter: 0.9 × 0.5 × 0.7 = 0.315
    expect(calculateKnockbackProbability(0.1, 0.5, 0.3)).toBeCloseTo(0.315);
  });

  it('returns 0 when any defense is 100%', () => {
    expect(calculateKnockbackProbability(0, 1.0, 0)).toBe(0);
    expect(calculateKnockbackProbability(0, 0, 1.0)).toBe(0);
  });
});

describe('calculateKnockbackUptime', () => {
  it('returns 1.0 when KB probability is 0 (full stance)', () => {
    expect(calculateKnockbackUptime(0, 1.5, 0.5)).toBe(1.0);
  });

  it('warrior with 90% stance loses ~3% uptime', () => {
    // kbProb=0.1, interval=1.5, recovery=0.5
    // kbs/sec = 0.1/1.5 ≈ 0.0667, timeLost = 0.0667 * 0.5 = 0.0333
    const uptime = calculateKnockbackUptime(0.1, 1.5, 0.5);
    expect(uptime).toBeCloseTo(0.97, 2);
  });

  it('Night Lord with 30% shifter loses ~23% uptime on burst skills', () => {
    // kbProb=0.7, interval=1.5, recovery=0.5
    // kbs/sec = 0.467, timeLost = 0.467 * 0.5 = 0.2333
    const uptime = calculateKnockbackUptime(0.7, 1.5, 0.5);
    expect(uptime).toBeCloseTo(0.77, 2);
  });

  it('Shadower with 40% shifter loses ~20% uptime on burst skills', () => {
    // kbProb=0.6, interval=1.5, recovery=0.5
    // kbs/sec = 0.4, timeLost = 0.4 * 0.5 = 0.20
    const uptime = calculateKnockbackUptime(0.6, 1.5, 0.5);
    expect(uptime).toBeCloseTo(0.80, 2);
  });

  it('no-defense class with channeled skill loses heavily', () => {
    // kbProb=1.0, interval=1.5, recovery=0.7
    // kbs/sec = 0.667, timeLost = 0.667 * 0.7 = 0.4667
    const uptime = calculateKnockbackUptime(1.0, 1.5, 0.7);
    expect(uptime).toBeCloseTo(0.533, 2);
  });

  it('clamps to minimum 0.1', () => {
    // Extreme case: very frequent attacks, long recovery
    const uptime = calculateKnockbackUptime(1.0, 0.5, 2.0);
    expect(uptime).toBe(0.1);
  });

  it('i-frame skill (recovery=0) has no uptime loss', () => {
    const uptime = calculateKnockbackUptime(1.0, 1.5, 0);
    expect(uptime).toBe(1.0);
  });
});

describe('getKnockbackRecovery', () => {
  it('returns explicit knockbackRecovery when set', () => {
    const skill = makeSkill({ knockbackRecovery: 0 });
    expect(getKnockbackRecovery(skill, 0.69)).toBe(0);
  });

  it('returns explicit knockbackRecovery even for channeled attack time', () => {
    const skill = makeSkill({ knockbackRecovery: 0.5 });
    expect(getKnockbackRecovery(skill, 0.12)).toBe(0.5);
  });

  it('detects channeled skills by 0.12s attack time', () => {
    const skill = makeSkill();
    expect(getKnockbackRecovery(skill, 0.12)).toBe(DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP);
  });

  it('returns DEFAULT_KB_RECOVERY for normal skills', () => {
    const skill = makeSkill();
    expect(getKnockbackRecovery(skill, 0.69)).toBe(DEFAULT_KB_RECOVERY);
    expect(getKnockbackRecovery(skill, 0.60)).toBe(DEFAULT_KB_RECOVERY);
    expect(getKnockbackRecovery(skill, 2.34)).toBe(DEFAULT_KB_RECOVERY);
  });
});
