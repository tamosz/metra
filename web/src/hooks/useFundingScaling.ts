import { useMemo } from 'react';
import { calculateSkillDps } from '@metra/engine';
import type { SkillEntry, ClassSkillData } from '@metra/engine';
import {
  allClassBases,
  computeBuildAtFunding,
  weaponData,
  attackSpeedData,
  mwData,
  discoveredData,
} from '../data/bundle.js';
import { CLASS_TO_GROUP, type SkillGroupId } from '../utils/skill-groups.js';
import { VARIANT_CLASSES } from '../utils/class-colors.js';

export interface FundingPoint {
  funding: number; // 0–100
  [classSkillKey: string]: number | string; // DPS values keyed by "ClassName — SkillName"
}

export interface FundingLine {
  key: string; // "ClassName — SkillName"
  className: string;
  skillName: string;
}

export interface FundingScalingData {
  points: FundingPoint[];
  lines: FundingLine[];
  yDomain: [number, number];
}

const FUNDING_LEVELS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const SEP = ' \u2014 ';

function isSkillVisible(
  skill: SkillEntry,
  className: string,
  activeGroups: Set<SkillGroupId>
): boolean {
  if (skill.hidden) return false;

  if (activeGroups.has('main') && skill.headline !== false && !VARIANT_CLASSES.has(className)) {
    return true;
  }

  const classGroup = CLASS_TO_GROUP[className];
  if (classGroup && activeGroups.has(classGroup)) {
    return true;
  }

  if (activeGroups.has('multi-target') && (skill.maxTargets ?? 1) > 1) {
    return true;
  }

  return false;
}

export function useFundingScaling(options: {
  activeGroups: Set<SkillGroupId>;
  capEnabled: boolean;
}): FundingScalingData {
  const { activeGroups, capEnabled } = options;

  return useMemo(() => {
    const allBases = allClassBases;
    const { classDataMap } = discoveredData;

    // Build className → ClassSkillData lookup (classDataMap is keyed by file slug)
    const classDataByName = new Map<string, ClassSkillData>();
    for (const data of classDataMap.values()) {
      classDataByName.set(data.className, data);
    }

    // Physical classes only (mages don't use the computed budget model)
    const physicalBases = Array.from(allBases.values()).filter(
      (base) => base.category === 'physical'
    );

    // Determine which lines appear by evaluating at 100% funding.
    // Element variant winner is determined at full funding — assumed stable across levels.
    const lineMap = new Map<string, FundingLine>();

    for (const base of physicalBases) {
      const className = base.className;
      const classData = classDataByName.get(className);
      if (!classData) continue;

      const fullBuild = computeBuildAtFunding(base, 1.0);

      const comboGroupSeen = new Set<string>();
      const variantBest = new Map<string, { key: string; dps: number; className: string; skillName: string }>();

      for (const skill of classData.skills) {
        if (!isSkillVisible(skill, className, activeGroups)) continue;

        if (skill.comboGroup) {
          if (comboGroupSeen.has(skill.comboGroup)) continue;
          comboGroupSeen.add(skill.comboGroup);
          const key = `${className}${SEP}${skill.comboGroup}`;
          lineMap.set(key, { key, className, skillName: skill.comboGroup });
          continue;
        }

        if (skill.elementVariantGroup) {
          const dpsResult = calculateSkillDps(
            fullBuild, classData, skill, weaponData, attackSpeedData, mwData
          );
          const dps = capEnabled ? dpsResult.dps : dpsResult.uncappedDps;
          const key = `${className}${SEP}${skill.name}`;
          const existing = variantBest.get(skill.elementVariantGroup);
          if (!existing || dps > existing.dps) {
            variantBest.set(skill.elementVariantGroup, { key, dps, className, skillName: skill.name });
          }
          continue;
        }

        const key = `${className}${SEP}${skill.name}`;
        lineMap.set(key, { key, className, skillName: skill.name });
      }

      for (const best of variantBest.values()) {
        lineMap.set(best.key, { key: best.key, className: best.className, skillName: best.skillName });
      }

      // Mixed rotations are always headline
      if (classData.mixedRotations && (activeGroups.has('main') && !VARIANT_CLASSES.has(className) || CLASS_TO_GROUP[className] && activeGroups.has(CLASS_TO_GROUP[className]!))) {
        for (const rotation of classData.mixedRotations) {
          const key = `${className}${SEP}${rotation.name}`;
          lineMap.set(key, { key, className, skillName: rotation.name });
        }
      }
    }

    const lines = Array.from(lineMap.values());

    // Compute DPS at each funding level
    const points: FundingPoint[] = FUNDING_LEVELS.map((level) => {
      const point: FundingPoint = { funding: level };

      for (const base of physicalBases) {
        const className = base.className;
        const classData = classDataByName.get(className);
        if (!classData) continue;

        const build = computeBuildAtFunding(base, level / 100);

        // Compute DPS for all skills (including non-visible ones needed by mixedRotations)
        const skillDpsByName = new Map<string, number>();
        const comboDps = new Map<string, number>();
        const variantBest = new Map<string, { key: string; dps: number }>();

        for (const skill of classData.skills) {
          const dpsResult = calculateSkillDps(
            build, classData, skill, weaponData, attackSpeedData, mwData
          );
          const dps = capEnabled ? dpsResult.dps : dpsResult.uncappedDps;
          skillDpsByName.set(skill.name, dps);

          if (!isSkillVisible(skill, className, activeGroups)) continue;

          if (skill.comboGroup) {
            const key = `${className}${SEP}${skill.comboGroup}`;
            comboDps.set(key, (comboDps.get(key) ?? 0) + dps);
            continue;
          }

          if (skill.elementVariantGroup) {
            const key = `${className}${SEP}${skill.name}`;
            const existing = variantBest.get(skill.elementVariantGroup);
            if (!existing || dps > existing.dps) {
              variantBest.set(skill.elementVariantGroup, { key, dps });
            }
            continue;
          }

          const key = `${className}${SEP}${skill.name}`;
          if (lineMap.has(key)) {
            point[key] = dps;
          }
        }

        for (const [key, totalDps] of comboDps.entries()) {
          if (lineMap.has(key)) {
            point[key] = totalDps;
          }
        }

        for (const best of variantBest.values()) {
          if (lineMap.has(best.key)) {
            point[best.key] = best.dps;
          }
        }

        // Mixed rotations: weight-averaged DPS from component skills
        if (classData.mixedRotations) {
          for (const rotation of classData.mixedRotations) {
            const key = `${className}${SEP}${rotation.name}`;
            if (!lineMap.has(key)) continue;

            let blendedDps = 0;
            let valid = true;
            for (const component of rotation.components) {
              const componentDps = skillDpsByName.get(component.skill);
              if (componentDps == null) { valid = false; break; }
              blendedDps += componentDps * component.weight;
            }
            if (valid) {
              point[key] = blendedDps;
            }
          }
        }
      }

      return point;
    });

    let yMin = Infinity;
    let yMax = -Infinity;
    for (const point of points) {
      for (const line of lines) {
        const val = point[line.key];
        if (typeof val === 'number') {
          if (val < yMin) yMin = val;
          if (val > yMax) yMax = val;
        }
      }
    }
    if (!isFinite(yMin) || !isFinite(yMax)) {
      yMin = 0;
      yMax = 1;
    }

    return { points, lines, yDomain: [yMin, yMax] };
  }, [activeGroups, capEnabled]);
}
