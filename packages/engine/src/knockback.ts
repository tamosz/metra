import type { CharacterBuild, MWData, SkillEntry } from './types.js';
import { getMWMultiplier } from './buffs.js';

/**
 * Default KB recovery time for burst/normal skills (seconds).
 * Blink animation + minor reposition.
 * Source: data/references/knockback.md
 */
export const DEFAULT_KB_RECOVERY = 0.5;

/**
 * Extra wind-up time for channeled skills to restart the channel (seconds).
 * Hurricane and Rapid Fire both have this overhead on top of the base recovery.
 */
export const CHANNEL_WIND_UP = 0.2;

/** Attack time threshold to detect channeled skills (Hurricane/Rapid Fire use 0.12s). */
const CHANNEL_ATTACK_TIME = 0.12;

/**
 * Calculate dodge chance from avoidability vs boss accuracy.
 *
 * Formula (pre-BB, monster → player, physical touch damage):
 *   effectiveAvoid = avoid - max(0, levelDifference) / 2
 *   dodgeRate = effectiveAvoid / (4.5 * monsterAccuracy)
 *
 * Clamped to class-specific range:
 *   Non-thieves: [2%, 80%]
 *   Thieves (NL, Shadower): [5%, 95%]
 *
 * Source: client code extraction (iPippy, MapleLegends forum),
 *         in-game testing on Royals (jamin, royals.ms/forum/threads/avoidability-question.174715/)
 */
export function calculateDodgeChance(
  avoidability: number,
  bossAccuracy: number,
  options?: { minDodge?: number; maxDodge?: number; levelDifference?: number }
): number {
  const { minDodge = 0.02, maxDodge = 0.80, levelDifference = 0 } = options ?? {};
  const levelPenalty = Math.max(0, levelDifference) / 2;
  const effectiveAvoid = Math.max(0, avoidability - levelPenalty);
  const dodgeRate = bossAccuracy > 0 ? effectiveAvoid / (4.5 * bossAccuracy) : maxDodge;
  return Math.max(minDodge, Math.min(dodgeRate, maxDodge));
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
 * Compute character avoidability from MW-boosted stats and equipment avoid.
 *
 * Formula (pre-BB, all classes):
 *   avoid = 0.5 × totalLUK + 0.25 × totalDEX + equipmentAvoid
 *
 * where totalStat = floor(baseStat × mwMultiplier) + gearStat.
 *
 * Source: client code extraction (AyumiLove formula page),
 *         MapleLegends avoidability analysis (iPippy)
 */
export function computeAvoidability(
  build: CharacterBuild,
  mwData: MWData,
  equipmentAvoid: number = 0
): number {
  const mwMult = getMWMultiplier(mwData, build.mwLevel);
  const totalLUK = Math.floor(build.baseStats.LUK * mwMult) + build.gearStats.LUK;
  const totalDEX = Math.floor(build.baseStats.DEX * mwMult) + build.gearStats.DEX;
  return Math.round(0.5 * totalLUK + 0.25 * totalDEX + equipmentAvoid);
}

/**
 * Get the KB recovery time for a skill.
 *
 * Priority:
 * 1. Explicit `knockbackRecovery` on the skill (i-frames = 0, custom overrides)
 * 2. Channeled skill heuristic: attackTime === 0.12s → DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP
 * 3. Default: DEFAULT_KB_RECOVERY
 */
export function getKnockbackRecovery(skill: SkillEntry, attackTime: number): number {
  if (skill.knockbackRecovery != null) return skill.knockbackRecovery;
  if (attackTime === CHANNEL_ATTACK_TIME) return DEFAULT_KB_RECOVERY + CHANNEL_WIND_UP;
  return DEFAULT_KB_RECOVERY;
}
