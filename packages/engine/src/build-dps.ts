import type {
  CharacterBuild,
  ClassSkillData,
  GameData,
} from './types.js';
import { calculateSkillDps, type DpsResult } from './dps.js';

export interface SkillDpsRow {
  skillName: string;
  dps: number;
  result: DpsResult;
  comboGroup?: string;
}

export interface BuildDpsResult {
  skills: SkillDpsRow[];
  aggregated: SkillDpsRow[];
}

export function calculateBuildDps(
  build: CharacterBuild,
  classData: ClassSkillData,
  gameData: GameData,
  elementModifier?: number,
): BuildDpsResult {
  const skills: SkillDpsRow[] = [];

  for (const skill of classData.skills) {
    const result = calculateSkillDps(
      build, classData, skill, gameData, elementModifier,
    );
    skills.push({
      skillName: skill.name,
      dps: result.dps,
      result,
      comboGroup: skill.comboGroup,
    });
  }

  // Aggregate combo groups
  const aggregated: SkillDpsRow[] = [];
  const comboMap = new Map<string, { totalDps: number; firstResult: DpsResult }>();

  for (const row of skills) {
    if (row.comboGroup) {
      const existing = comboMap.get(row.comboGroup);
      if (existing) {
        existing.totalDps += row.dps;
      } else {
        comboMap.set(row.comboGroup, { totalDps: row.dps, firstResult: row.result });
      }
    } else {
      aggregated.push(row);
    }
  }

  for (const [groupName, { totalDps, firstResult }] of comboMap) {
    aggregated.push({
      skillName: groupName,
      dps: totalDps,
      result: { ...firstResult, dps: totalDps, skillName: groupName },
      comboGroup: groupName,
    });
  }

  return { skills, aggregated };
}
