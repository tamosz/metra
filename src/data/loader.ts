import { readFileSync } from 'fs';
import { resolve } from 'path';
import type {
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
  ClassSkillData,
  CharacterBuild,
} from './types.js';

const DATA_DIR = resolve(import.meta.dirname, '../../data');

function loadJson<T>(relativePath: string): T {
  const fullPath = resolve(DATA_DIR, relativePath);
  return JSON.parse(readFileSync(fullPath, 'utf-8')) as T;
}

export function loadWeapons(): WeaponData {
  return loadJson<WeaponData>('weapons.json');
}

export function loadAttackSpeed(): AttackSpeedData {
  return loadJson<AttackSpeedData>('attack-speed.json');
}

export function loadMapleWarrior(): MapleWarriorData {
  const raw = loadJson<{ entries: MapleWarriorData }>('maple-warrior.json');
  return raw.entries;
}

export function loadClassSkills(className: string): ClassSkillData {
  const filename = className.toLowerCase().replace(/\s+/g, '-') + '.json';
  return loadJson<ClassSkillData>(`skills/${filename}`);
}

export function loadGearTemplate(templateName: string): CharacterBuild {
  const raw = loadJson<Record<string, unknown>>(
    `gear-templates/${templateName}.json`
  );
  return {
    className: raw.className as string,
    baseStats: raw.baseStats as CharacterBuild['baseStats'],
    gearStats: raw.gearStats as CharacterBuild['gearStats'],
    totalWeaponAttack: raw.totalWeaponAttack as number,
    weaponType: raw.weaponType as string,
    weaponSpeed: raw.weaponSpeed as number,
    attackPotion: raw.attackPotion as number,
    projectile: raw.projectile as number,
    echoActive: raw.echoActive as boolean,
    mapleWarriorLevel: raw.mapleWarriorLevel as number,
    speedInfusion: raw.speedInfusion as boolean,
    sharpEyes: raw.sharpEyes as boolean,
  };
}
