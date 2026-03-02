import { useState, useMemo, useCallback } from 'react';
import { calculateSkillDps } from '@engine/engine/dps.js';
import type { CharacterBuild, ClassSkillData, SkillEntry } from '@engine/data/types.js';
import type { DpsResult } from '@engine/engine/dps.js';
import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';

export interface BuildOverrides {
  baseSTR: number;
  baseDEX: number;
  baseINT: number;
  baseLUK: number;
  gearSTR: number;
  gearDEX: number;
  gearINT: number;
  gearLUK: number;
  totalWeaponAttack: number;
  attackPotion: number;
  projectile: number;
  echoActive: boolean;
  sharpEyes: boolean;
  speedInfusion: boolean;
  mwLevel: number;
}

export interface SkillDpsRow {
  skillName: string;
  dps: number;
  baselineDps: number;
  changePercent: number;
}

export interface BuildExplorerState {
  classNames: string[];
  tiers: string[];
  selectedClass: string;
  selectedTier: string;
  classData: ClassSkillData | null;
  template: CharacterBuild | null;
  overrides: Partial<BuildOverrides>;
  effectiveBuild: CharacterBuild | null;
  results: SkillDpsRow[];
  setClass: (className: string) => void;
  setTier: (tier: string) => void;
  setOverride: <K extends keyof BuildOverrides>(key: K, value: BuildOverrides[K]) => void;
  resetField: (key: keyof BuildOverrides) => void;
  resetOverrides: () => void;
  loadFromUrl: (className: string, tier: string, overrides: Partial<BuildOverrides>) => void;
}

function mergeOverrides(template: CharacterBuild, overrides: Partial<BuildOverrides>): CharacterBuild {
  return {
    ...template,
    baseStats: {
      STR: overrides.baseSTR ?? template.baseStats.STR,
      DEX: overrides.baseDEX ?? template.baseStats.DEX,
      INT: overrides.baseINT ?? template.baseStats.INT,
      LUK: overrides.baseLUK ?? template.baseStats.LUK,
    },
    gearStats: {
      STR: overrides.gearSTR ?? template.gearStats.STR,
      DEX: overrides.gearDEX ?? template.gearStats.DEX,
      INT: overrides.gearINT ?? template.gearStats.INT,
      LUK: overrides.gearLUK ?? template.gearStats.LUK,
    },
    totalWeaponAttack: overrides.totalWeaponAttack ?? template.totalWeaponAttack,
    attackPotion: overrides.attackPotion ?? template.attackPotion,
    projectile: overrides.projectile ?? template.projectile,
    echoActive: overrides.echoActive ?? template.echoActive,
    sharpEyes: overrides.sharpEyes ?? template.sharpEyes,
    speedInfusion: overrides.speedInfusion ?? template.speedInfusion,
    mwLevel: overrides.mwLevel ?? template.mwLevel,
  };
}

function computeSkillDps(
  build: CharacterBuild,
  classData: ClassSkillData
): { skillName: string; dps: number }[] {
  const skillResults: { skill: SkillEntry; dps: DpsResult }[] = [];
  for (const skill of classData.skills) {
    const result = calculateSkillDps(
      build, classData, skill, weaponData, attackSpeedData, mwData
    );
    skillResults.push({ skill, dps: result });
  }

  // Aggregate combo groups
  const output: { skillName: string; dps: number }[] = [];
  const comboMap = new Map<string, number>();

  for (const { skill, dps } of skillResults) {
    if (skill.comboGroup) {
      comboMap.set(skill.comboGroup, (comboMap.get(skill.comboGroup) ?? 0) + dps.dps);
    } else {
      output.push({ skillName: skill.name, dps: dps.dps });
    }
  }

  for (const [groupName, totalDps] of comboMap) {
    output.push({ skillName: groupName, dps: totalDps });
  }

  return output;
}

export function useBuildExplorer(): BuildExplorerState {
  const discovery = discoveredData;
  const { classNames, tiers, classDataMap, gearTemplates } = discovery;

  const [selectedClass, setSelectedClass] = useState(classNames[0] ?? '');
  const [selectedTier, setSelectedTier] = useState(tiers[0] ?? '');
  const [overrides, setOverrides] = useState<Partial<BuildOverrides>>({});

  const classData = classDataMap.get(selectedClass) ?? null;
  const templateKey = `${selectedClass}-${selectedTier}`;
  const template = gearTemplates.get(templateKey) ?? null;

  const effectiveBuild = useMemo(() => {
    if (!template) return null;
    return mergeOverrides(template, overrides);
  }, [template, overrides]);

  const baselineResults = useMemo(() => {
    if (!template || !classData) return [];
    return computeSkillDps(template, classData);
  }, [template, classData]);

  const currentResults = useMemo(() => {
    if (!effectiveBuild || !classData) return [];
    return computeSkillDps(effectiveBuild, classData);
  }, [effectiveBuild, classData]);

  const results: SkillDpsRow[] = useMemo(() => {
    return currentResults.map((r) => {
      const baseline = baselineResults.find((b) => b.skillName === r.skillName);
      const baselineDps = baseline?.dps ?? 0;
      const changePercent = baselineDps > 0 ? ((r.dps - baselineDps) / baselineDps) * 100 : 0;
      return {
        skillName: r.skillName,
        dps: r.dps,
        baselineDps,
        changePercent,
      };
    });
  }, [currentResults, baselineResults]);

  const setClass = useCallback((className: string) => {
    setSelectedClass(className);
    setOverrides({});
  }, []);

  const setTier = useCallback((tier: string) => {
    setSelectedTier(tier);
    setOverrides({});
  }, []);

  const setOverride = useCallback(<K extends keyof BuildOverrides>(key: K, value: BuildOverrides[K]) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetField = useCallback((key: keyof BuildOverrides) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const resetOverrides = useCallback(() => {
    setOverrides({});
  }, []);

  const loadFromUrl = useCallback((className: string, tier: string, urlOverrides: Partial<BuildOverrides>) => {
    setSelectedClass(className);
    setSelectedTier(tier);
    setOverrides(urlOverrides);
  }, []);

  return {
    classNames,
    tiers,
    selectedClass,
    selectedTier,
    classData,
    template,
    overrides,
    effectiveBuild,
    results,
    setClass,
    setTier,
    setOverride,
    resetField,
    resetOverrides,
    loadFromUrl,
  };
}
