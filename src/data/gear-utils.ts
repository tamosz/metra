import type { StatName } from '@metra/engine';

export interface GearTotals {
  gearStats: Record<StatName, number>;
  totalWeaponAttack: number;
}

const STAT_NAMES: readonly StatName[] = ['STR', 'DEX', 'INT', 'LUK'];
const ATTACK_KEYS = ['WATK', 'MATK'] as const;

export function computeGearTotals(
  gearBreakdown: Record<string, Record<string, number>>
): GearTotals {
  const gearStats: Record<StatName, number> = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  let totalWeaponAttack = 0;

  for (const [slot, values] of Object.entries(gearBreakdown)) {
    if (slot === 'comment') continue;

    for (const stat of STAT_NAMES) {
      gearStats[stat] += values[stat] ?? 0;
    }
    for (const key of ATTACK_KEYS) {
      totalWeaponAttack += values[key] ?? 0;
    }
  }

  return { gearStats, totalWeaponAttack };
}
