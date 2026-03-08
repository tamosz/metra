import type { CharacterBuild, StatName } from '@metra/engine';
import { computeGearTotals } from './gear-utils.js';

export interface TierDefaults {
  attackPotion: number;
  potionName: string;
  cgs: { cape: number; glove: number; shoe: number };
}

export interface ClassBase {
  className: string;
  weaponType: string;
  weaponSpeed: number;
  projectile: number;
  echoActive: boolean;
  mwLevel: number;
  speedInfusion: boolean;
  sharpEyes: boolean;
  shadowPartner?: boolean;
  cgsStatName?: string;
}

export interface TierOverride {
  extends: string;
  source?: string;
  baseStats: CharacterBuild['baseStats'];
  gearBreakdown: Record<string, Record<string, number>>;
  projectile?: number;
  attackPotion?: number;
  weaponSpeed?: number;
  [key: string]: unknown;
}

const CGS_SLOTS = ['cape', 'glove', 'shoe'] as const;

export function mergeGearTemplate(
  base: ClassBase,
  tier: TierOverride,
  defaults: TierDefaults
): CharacterBuild {
  const statName = base.cgsStatName ?? 'WATK';

  const breakdown = { ...tier.gearBreakdown };
  for (const slot of CGS_SLOTS) {
    if (breakdown[slot]) continue;
    breakdown[slot] = { [statName]: defaults.cgs[slot] };
  }

  const computed = computeGearTotals(breakdown);

  return {
    className: base.className,
    baseStats: tier.baseStats,
    gearStats: computed.gearStats,
    totalWeaponAttack: computed.totalWeaponAttack,
    weaponType: base.weaponType,
    weaponSpeed: tier.weaponSpeed ?? base.weaponSpeed,
    attackPotion: tier.attackPotion ?? defaults.attackPotion,
    projectile: tier.projectile ?? base.projectile,
    echoActive: base.echoActive,
    mwLevel: base.mwLevel,
    speedInfusion: base.speedInfusion,
    sharpEyes: base.sharpEyes,
    shadowPartner: base.shadowPartner,
  };
}
