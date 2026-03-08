// Re-export all data types from @metra/engine.
// This file exists for backward compatibility — new code should import from '@metra/engine' directly.
export {
  TIER_ORDER,
  compareTiers,
  type StatName,
  type WeaponType,
  type WeaponData,
  type AttackSpeedEntry,
  type AttackSpeedData,
  type MWEntry,
  type MWData,
  type SkillEntry,
  type MixedRotationComponent,
  type MixedRotation,
  type ClassSkillData,
  type CharacterBuild,
} from '@metra/engine';
