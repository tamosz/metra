import type {
  CharacterBuild,
  ClassSkillData,
  SkillEntry,
  GameData,
  StatName,
} from './types.js';
import { calculateSkillDps } from './dps.js';

export interface MarginalGain {
  /** Display name: "WATK", "STR", "DEX", etc. */
  stat: string;
  /** Current value of this stat in the build. */
  currentValue: number;
  /** Absolute DPS increase from +1 to this stat. */
  dpsGain: number;
  /** Percentage DPS increase from +1 to this stat. */
  percentGain: number;
}

/**
 * Compute the DPS gain from +1 to each stat axis for a given skill.
 *
 * Stat axes:
 * - WATK (+1 totalWeaponAttack)
 * - Primary stat (+1 gearStats[primaryStat])
 * - Each secondary stat (+1 gearStats[secondaryStat] — separate entries for arrays)
 *
 * Returns results sorted by dpsGain descending.
 */
export function calculateMarginalGains(
  build: CharacterBuild,
  classData: ClassSkillData,
  skill: SkillEntry,
  gameData: GameData,
): MarginalGain[] {
  const baseDps = calculateSkillDps(build, classData, skill, gameData).dps;

  const gains: MarginalGain[] = [];

  // WATK (displayed as "WATK" for all classes — mages store MATK in totalWeaponAttack)
  const watkBuild: CharacterBuild = { ...build, totalWeaponAttack: build.totalWeaponAttack + 1 };
  const watkDps = calculateSkillDps(watkBuild, classData, skill, gameData).dps;
  gains.push({
    stat: 'WATK',
    currentValue: build.totalWeaponAttack,
    dpsGain: watkDps - baseDps,
    percentGain: baseDps > 0 ? ((watkDps - baseDps) / baseDps) * 100 : 0,
  });

  // Collect stat keys: primary + each secondary (deduplicated)
  const secondaryKeys: StatName[] = Array.isArray(classData.secondaryStat)
    ? classData.secondaryStat
    : [classData.secondaryStat];
  const allStatKeys: StatName[] = [classData.primaryStat, ...secondaryKeys.filter(k => k !== classData.primaryStat)];

  for (const statKey of allStatKeys) {
    const perturbedBuild: CharacterBuild = {
      ...build,
      gearStats: { ...build.gearStats, [statKey]: build.gearStats[statKey] + 1 },
    };
    const newDps = calculateSkillDps(perturbedBuild, classData, skill, gameData).dps;
    gains.push({
      stat: statKey,
      currentValue: build.gearStats[statKey],
      dpsGain: newDps - baseDps,
      percentGain: baseDps > 0 ? ((newDps - baseDps) / baseDps) * 100 : 0,
    });
  }

  gains.sort((a, b) => b.dpsGain - a.dpsGain);
  return gains;
}
