import type { SkillEntry } from './types.js';

/**
 * Default KB recovery time for burst/normal skills (seconds).
 * Blink animation + minor reposition.
 * Source: data/references/knockback.md
 */
export const DEFAULT_KB_RECOVERY = 0.6;

/**
 * KB recovery time for channeled skills like Hurricane (seconds).
 * Landing + reposition + channel restart (~300ms startup).
 * Source: data/references/knockback.md
 */
export const CHANNEL_KB_RECOVERY = 1.0;

/** Attack time threshold to detect channeled skills (Hurricane/Rapid Fire use 0.12s). */
const CHANNEL_ATTACK_TIME = 0.12;

/**
 * Calculate dodge chance from avoidability vs boss accuracy.
 *
 * Formula (pre-BB, monster → player):
 *   dodgeRate = floor(sqrt(playerAvoid)) - floor(sqrt(monsterAccuracy))
 * Clamped to [0, 0.95].
 *
 * Source: SouthPerry All Known Formulas, data/references/knockback.md
 */
export function calculateDodgeChance(avoidability: number, bossAccuracy: number): number {
  const dodgeRate = Math.floor(Math.sqrt(avoidability)) - Math.floor(Math.sqrt(bossAccuracy));
  return Math.max(0, Math.min(dodgeRate / 100, 0.95));
}

/**
 * Calculate the probability of being knocked back per boss attack.
 *
 * Three independent defenses checked in order:
 * 1. Dodge (from avoidability) — avoids the hit entirely
 * 2. Power Stance (warriors, Bucc) — prevents KB on hit
 * 3. Shadow Shifter (thieves) — dodges the hit entirely
 *
 * kbProbability = (1 - dodge) × (1 - stance) × (1 - shifter)
 */
export function calculateKnockbackProbability(
  dodgeChance: number,
  stanceRate: number,
  shadowShifterRate: number
): number {
  return (1 - dodgeChance) * (1 - stanceRate) * (1 - shadowShifterRate);
}

/**
 * Calculate the uptime multiplier after KB losses.
 *
 * kbsPerSecond = kbProbability / bossAttackInterval
 * timeLostPerSec = kbsPerSecond × recoveryTime
 * uptime = max(0.1, 1 - timeLostPerSec)
 *
 * Clamped to a minimum of 0.1 (10%) to avoid degenerate zero-DPS cases.
 */
export function calculateKnockbackUptime(
  kbProbability: number,
  bossAttackInterval: number,
  recoveryTime: number
): number {
  const kbsPerSecond = kbProbability / bossAttackInterval;
  const timeLostPerSecond = kbsPerSecond * recoveryTime;
  return Math.max(0.1, 1 - timeLostPerSecond);
}

/**
 * Get the KB recovery time for a skill.
 *
 * Priority:
 * 1. Explicit `knockbackRecovery` on the skill (i-frames = 0, custom overrides)
 * 2. Channeled skill heuristic: attackTime === 0.12s → CHANNEL_KB_RECOVERY
 * 3. Default: DEFAULT_KB_RECOVERY
 */
export function getKnockbackRecovery(skill: SkillEntry, attackTime: number): number {
  if (skill.knockbackRecovery != null) return skill.knockbackRecovery;
  if (attackTime === CHANNEL_ATTACK_TIME) return CHANNEL_KB_RECOVERY;
  return DEFAULT_KB_RECOVERY;
}
