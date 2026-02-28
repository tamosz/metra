/** Weapon type multipliers for the v62 damage formula. */
export interface WeaponType {
  name: string;
  /** Multiplier applied to primary stat in the damage formula (slash/default). */
  slashMultiplier: number;
  /** Multiplier applied to primary stat for stab attacks (axes/BWs only). */
  stabMultiplier: number;
}

export interface WeaponData {
  types: WeaponType[];
}

/** Attack speed lookup table: effective speed → attack time in seconds. */
export interface AttackSpeedEntry {
  /** Effective weapon speed tier (2-6). */
  speed: number;
  /** Attack time in seconds for each skill category. */
  times: Record<string, number>;
}

export interface AttackSpeedData {
  /** Skill category names (e.g., "Brandish", "Strafe/Snipe"). */
  categories: string[];
  entries: AttackSpeedEntry[];
}

/** Maple Warrior buff multiplier by skill level. */
export interface MapleWarriorEntry {
  level: number;
  multiplier: number;
}

export type MapleWarriorData = MapleWarriorEntry[];

/** A single skill's damage properties. */
export interface SkillEntry {
  name: string;
  /** Base power before multiplier. */
  basePower: number;
  /** Damage multiplier applied to base power. */
  multiplier: number;
  /** Number of damage lines per attack. */
  hitCount: number;
  /** Attack speed category name (must match AttackSpeedData categories). */
  speedCategory: string;
  /** Weapon types this skill variant uses (e.g., "2H Sword"). */
  weaponType: string;
}

/** All skills for a single class. */
export interface ClassSkillData {
  className: string;
  /** Skill mastery value (0-1). Hero sword mastery = 0.6. */
  mastery: number;
  /** Primary stat name. */
  primaryStat: 'STR' | 'DEX' | 'INT' | 'LUK';
  /** Secondary stat name. */
  secondaryStat: 'STR' | 'DEX' | 'INT' | 'LUK';
  /** SE crit rate (fraction of attacks that crit with SE). */
  sharpEyesCritRate: number;
  /** SE critical damage bonus added to base power. */
  sharpEyesCritDamageBonus: number;
  /**
   * SE crit damage formula variant.
   * - "addBeforeMultiply" (default, Hero/DrK): seDmg% = (basePower + bonus) * multiplier
   * - "addAfterMultiply": seDmg% = basePower * multiplier + bonus  (Paladin G28 formula)
   */
  seCritFormula?: 'addBeforeMultiply' | 'addAfterMultiply';
  skills: SkillEntry[];
}

/** A character's gear and stat setup for simulation. */
export interface CharacterBuild {
  className: string;
  /** Base stats before any gear or buffs. */
  baseStats: {
    STR: number;
    DEX: number;
    INT: number;
    LUK: number;
  };
  /** Total stats from gear (added on top of MW-boosted base stats). */
  gearStats: {
    STR: number;
    DEX: number;
    INT: number;
    LUK: number;
  };
  /** Total weapon attack from all gear sources. */
  totalWeaponAttack: number;
  /** Weapon type name (must match WeaponData). */
  weaponType: string;
  /** Base weapon speed before booster/SI. */
  weaponSpeed: number;
  /** Attack potion WATK bonus. */
  attackPotion: number;
  /** Projectile WATK bonus (0 for melee). */
  projectile: number;
  /** Whether echo of hero is active (4% WATK bonus). */
  echoActive: boolean;
  /** Maple Warrior skill level (0-30). */
  mapleWarriorLevel: number;
  /** Whether Speed Infusion is active. */
  speedInfusion: boolean;
  /** Whether Sharp Eyes is active. */
  sharpEyes: boolean;
}
