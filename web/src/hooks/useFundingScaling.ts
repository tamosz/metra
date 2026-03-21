import { useMemo } from 'react';
import { calculateSkillDps } from '@metra/engine';
import type { SkillEntry } from '@metra/engine';
import {
  getAllClassBases,
  computeBuildAtFunding,
  weaponData,
  attackSpeedData,
  mwData,
  discoveredData,
} from '../data/bundle.js';
import { type SkillGroupId } from '../utils/skill-groups.js';
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

const CLASS_TO_GROUP: Record<string, SkillGroupId> = {
  'Hero': 'warriors',
  'Hero (Axe)': 'warriors',
  'Hero (ST)': 'warriors',
  'Dark Knight': 'warriors',
  'Paladin': 'warriors',
  'Paladin (BW)': 'warriors',
  'Bishop': 'mages',
  'Archmage I/L': 'mages',
  'Archmage F/P': 'mages',
  'Bowmaster': 'archers',
  'Marksman': 'archers',
  'Night Lord': 'thieves',
  'Shadower': 'thieves',
  'Corsair': 'pirates',
  'Buccaneer': 'pirates',
};

/**
 * Check if a skill is visible given active groups and the class name.
 */
function isSkillVisible(
  skill: SkillEntry,
  className: string,
  activeGroups: Set<SkillGroupId>
): boolean {
  if (skill.hidden) return false;

  // "main" group: headline skills for non-variant classes
  if (activeGroups.has('main') && skill.headline !== false && !VARIANT_CLASSES.has(className)) {
    return true;
  }

  // Class archetype groups: all non-hidden skills for those classes
  const classGroup = CLASS_TO_GROUP[className];
  if (classGroup && activeGroups.has(classGroup)) {
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
    const allBases = getAllClassBases();
    const { classDataMap } = discoveredData;

    // Collect visible physical class bases (mages excluded)
    const physicalBases = Array.from(allBases.values()).filter(
      (base) => base.category === 'physical'
    );

    // Build a map of all lines (class + skill combinations) that will appear in the chart.
    // We determine lines by looking at the full-funding build.
    const lineMap = new Map<string, FundingLine>();

    for (const base of physicalBases) {
      const className = base.className;

      // Find the skill data by matching className
      let classData = null;
      for (const [, data] of classDataMap.entries()) {
        if (data.className === className) {
          classData = data;
          break;
        }
      }
      if (!classData) continue;

      // Group skills by comboGroup and elementVariantGroup to determine final line names.
      // We use a representative funding level (100%) to determine which elementVariant wins.
      const fullBuild = computeBuildAtFunding(base, 1.0);

      // Track combo groups: comboGroup → combined line key
      const comboGroupSeen = new Set<string>();
      // Track element variant groups: variantGroup → best skill so far
      const elementVariantBest = new Map<string, { key: string; dps: number; className: string; skillName: string }>();

      for (const skill of classData.skills) {
        if (!isSkillVisible(skill, className, activeGroups)) continue;

        if (skill.comboGroup) {
          if (comboGroupSeen.has(skill.comboGroup)) continue;
          comboGroupSeen.add(skill.comboGroup);
          const key = `${className} \u2014 ${skill.comboGroup}`;
          lineMap.set(key, { key, className, skillName: skill.comboGroup });
          continue;
        }

        if (skill.elementVariantGroup) {
          const dpsResult = calculateSkillDps(
            fullBuild, classData, skill, weaponData, attackSpeedData, mwData
          );
          const dps = capEnabled ? dpsResult.dps : dpsResult.uncappedDps;
          const key = `${className} \u2014 ${skill.name}`;
          const existing = elementVariantBest.get(skill.elementVariantGroup);
          if (!existing || dps > existing.dps) {
            elementVariantBest.set(skill.elementVariantGroup, { key, dps, className, skillName: skill.name });
          }
          continue;
        }

        const key = `${className} \u2014 ${skill.name}`;
        lineMap.set(key, { key, className, skillName: skill.name });
      }

      // Add winning elementVariant lines
      for (const best of elementVariantBest.values()) {
        lineMap.set(best.key, { key: best.key, className: best.className, skillName: best.skillName });
      }
    }

    const lines = Array.from(lineMap.values());

    // Compute DPS at each funding level
    const points: FundingPoint[] = FUNDING_LEVELS.map((level) => {
      const point: FundingPoint = { funding: level };

      for (const base of physicalBases) {
        const className = base.className;

        let classData = null;
        for (const [, data] of classDataMap.entries()) {
          if (data.className === className) {
            classData = data;
            break;
          }
        }
        if (!classData) continue;

        const build = computeBuildAtFunding(base, level / 100);

        // Accumulate combo groups
        const comboDps = new Map<string, number>();
        // Track element variant best per group
        const elementVariantBest = new Map<string, { key: string; dps: number }>();

        for (const skill of classData.skills) {
          if (!isSkillVisible(skill, className, activeGroups)) continue;

          const dpsResult = calculateSkillDps(
            build, classData, skill, weaponData, attackSpeedData, mwData
          );
          const dps = capEnabled ? dpsResult.dps : dpsResult.uncappedDps;

          if (skill.comboGroup) {
            const key = `${className} \u2014 ${skill.comboGroup}`;
            comboDps.set(key, (comboDps.get(key) ?? 0) + dps);
            continue;
          }

          if (skill.elementVariantGroup) {
            const key = `${className} \u2014 ${skill.name}`;
            const existing = elementVariantBest.get(skill.elementVariantGroup);
            if (!existing || dps > existing.dps) {
              elementVariantBest.set(skill.elementVariantGroup, { key, dps });
            }
            continue;
          }

          const key = `${className} \u2014 ${skill.name}`;
          if (lineMap.has(key)) {
            point[key] = dps;
          }
        }

        // Write combo group totals
        for (const [key, totalDps] of comboDps.entries()) {
          if (lineMap.has(key)) {
            point[key] = totalDps;
          }
        }

        // Write winning element variant DPS values
        for (const best of elementVariantBest.values()) {
          if (lineMap.has(best.key)) {
            point[best.key] = best.dps;
          }
        }
      }

      return point;
    });

    // Compute tight yDomain from all DPS values across all points
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
    // Fall back to [0, 1] if no data
    if (!isFinite(yMin) || !isFinite(yMax)) {
      yMin = 0;
      yMax = 1;
    }

    return { points, lines, yDomain: [yMin, yMax] };
  }, [activeGroups, capEnabled]);
}
