import { describe, it, expect } from 'vitest';
import {
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  DEFAULT_KB_RECOVERY,
  CHANNEL_KB_RECOVERY,
} from './knockback.js';
import type { SkillEntry } from '../data/types.js';

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
  it('returns 0 when avoidability is 0', () => {
    expect(calculateDodgeChance(0, 250)).toBe(0);
  });

  it('returns 0 when boss accuracy overwhelms avoidability', () => {
    // sqrt(100) = 10, sqrt(250) ≈ 15.8 → floor 10 - floor 15 = -5 → clamped to 0
    expect(calculateDodgeChance(100, 250)).toBe(0);
  });

  it('returns positive dodge when avoidability exceeds accuracy', () => {
    // sqrt(10000) = 100, sqrt(250) ≈ 15.8 → 100 - 15 = 85 → 0.85
    expect(calculateDodgeChance(10000, 250)).toBeCloseTo(0.85, 2);
  });

  it('caps dodge chance at 0.95', () => {
    // Very high avoidability → capped
    expect(calculateDodgeChance(1000000, 1)).toBe(0.95);
  });

  it('returns 0 for typical endgame scenario (low avoid vs boss accuracy)', () => {
    // Most physical classes have ~200 avoid, boss accuracy 250
    // sqrt(200) ≈ 14.1 → floor 14, sqrt(250) ≈ 15.8 → floor 15
    // 14 - 15 = -1 → 0
    expect(calculateDodgeChance(200, 250)).toBe(0);
  });
});

describe('calculateKnockbackProbability', () => {
  it('returns 1.0 with no defenses', () => {
    expect(calculateKnockbackProbability(0, 0, 0)).toBe(1.0);
  });

  it('returns 0.1 for warrior with 90% stance', () => {
    expect(calculateKnockbackProbability(0, 0.9, 0)).toBeCloseTo(0.1);
  });

  it('returns 0.7 for NL with 30% shadow shifter', () => {
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
    expect(calculateKnockbackUptime(0, 1.5, 0.6)).toBe(1.0);
  });

  it('warrior with 90% stance loses ~4% uptime', () => {
    // kbProb=0.1, interval=1.5, recovery=0.6
    // kbs/sec = 0.1/1.5 ≈ 0.0667, timeLost = 0.0667 * 0.6 = 0.04
    const uptime = calculateKnockbackUptime(0.1, 1.5, 0.6);
    expect(uptime).toBeCloseTo(0.96, 2);
  });

  it('NL with 30% shifter loses ~28% uptime on burst skills', () => {
    // kbProb=0.7, interval=1.5, recovery=0.6
    // kbs/sec = 0.467, timeLost = 0.28
    const uptime = calculateKnockbackUptime(0.7, 1.5, 0.6);
    expect(uptime).toBeCloseTo(0.72, 2);
  });

  it('Shadower with 40% shifter loses ~24% uptime on burst skills', () => {
    // kbProb=0.6, interval=1.5, recovery=0.6
    // kbs/sec = 0.4, timeLost = 0.24
    const uptime = calculateKnockbackUptime(0.6, 1.5, 0.6);
    expect(uptime).toBeCloseTo(0.76, 2);
  });

  it('no-defense class with channeled skill loses heavily', () => {
    // kbProb=1.0, interval=1.5, recovery=1.0
    // kbs/sec = 0.667, timeLost = 0.667
    const uptime = calculateKnockbackUptime(1.0, 1.5, 1.0);
    expect(uptime).toBeCloseTo(0.333, 2);
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
    expect(getKnockbackRecovery(skill, 0.12)).toBe(CHANNEL_KB_RECOVERY);
  });

  it('returns DEFAULT_KB_RECOVERY for normal skills', () => {
    const skill = makeSkill();
    expect(getKnockbackRecovery(skill, 0.69)).toBe(DEFAULT_KB_RECOVERY);
    expect(getKnockbackRecovery(skill, 0.60)).toBe(DEFAULT_KB_RECOVERY);
    expect(getKnockbackRecovery(skill, 2.34)).toBe(DEFAULT_KB_RECOVERY);
  });
});
