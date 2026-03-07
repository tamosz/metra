import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** The four primary stats in Royals. */
export const statNameSchema = z.enum(['STR', 'DEX', 'INT', 'LUK']);

const statBlockSchema = z.object({
  STR: z.number(),
  DEX: z.number(),
  INT: z.number(),
  LUK: z.number(),
});

const seCritFormulaSchema = z.enum([
  'addBeforeMultiply',
  'multiplicative',
  'scaleOnBase',
]);

const damageFormulaSchema = z.enum(['standard', 'throwingStar', 'magic']);

// ---------------------------------------------------------------------------
// Weapon data  (data/weapons.json)
// ---------------------------------------------------------------------------

export const weaponTypeSchema = z.object({
  name: z.string(),
  /** Multiplier applied to primary stat in the damage formula (slash/default). */
  slashMultiplier: z.number(),
  /** Multiplier applied to primary stat for stab attacks (axes/BWs only). */
  stabMultiplier: z.number(),
});

export const weaponDataSchema = z.object({
  types: z.array(weaponTypeSchema),
});

// ---------------------------------------------------------------------------
// Attack speed data  (data/attack-speed.json)
// ---------------------------------------------------------------------------

export const attackSpeedEntrySchema = z.object({
  /** Effective weapon speed tier (2-6). */
  speed: z.number().int(),
  /** Attack time in seconds for each skill category. */
  times: z.record(z.string(), z.number()),
});

export const attackSpeedDataSchema = z.object({
  /** Skill category names (e.g., "Brandish", "Strafe/Snipe"). */
  categories: z.array(z.string()),
  entries: z.array(attackSpeedEntrySchema),
});

// ---------------------------------------------------------------------------
// MW data  (data/mw.json)
// ---------------------------------------------------------------------------

export const mwEntrySchema = z.object({
  level: z.number().int(),
  multiplier: z.number(),
});

export const mwDataSchema = z.array(mwEntrySchema);

// ---------------------------------------------------------------------------
// Skill entry  (data/skills/*.json → skills[])
// ---------------------------------------------------------------------------

export const skillEntrySchema = z.object({
  name: z.string(),
  /** Citation for where this skill's data comes from (spreadsheet cell, forum thread, etc.). */
  source: z.string().optional(),
  /** Base power before multiplier. */
  basePower: z.number(),
  /** Damage multiplier applied to base power. */
  multiplier: z.number(),
  /** Number of damage lines per attack. */
  hitCount: z.number().int(),
  /** Attack speed category name (must match AttackSpeedData categories). */
  speedCategory: z.string(),
  /** Weapon types this skill variant uses (e.g., "2H Sword"). */
  weaponType: z.string(),
  /** Attack type: 'slash' (default) or 'stab'. Determines which weapon multiplier is used. */
  attackType: z.enum(['slash', 'stab']).optional(),
  /** Swing/stab ratio for skills that alternate between slash and stab attacks. */
  attackRatio: z.object({ slash: z.number(), stab: z.number() }).optional(),
  /** Built-in crit rate (e.g., TT has 0.50). Additive with SE crit rate. */
  builtInCritRate: z.number().optional(),
  /** Built-in crit damage bonus added to basePower on crit. */
  builtInCritDamageBonus: z.number().optional(),
  /** Per-skill SE crit formula override. */
  seCritFormula: seCritFormulaSchema.optional(),
  /** Group name for skills that combine into a single rotation. */
  comboGroup: z.string().optional(),
  /** Fixed average damage per attack, bypassing the normal damage formula. */
  fixedDamage: z.number().optional(),
  /** Elemental tag for damage advantage scenarios. */
  element: z.string().optional(),
  /** List of elements the skill can adapt to. Mutually exclusive with `element`. */
  elementOptions: z.array(z.string()).optional(),
  /** Maximum number of targets this skill can hit per attack. Default 1. */
  maxTargets: z.number().int().optional(),
  /** If true, skill is excluded from simulation output. */
  hidden: z.boolean().optional(),
  /** If false, skill is shown only when "show all skills" is toggled on. Default true. */
  headline: z.boolean().optional(),
  /** Tooltip text shown next to the skill name in rankings. */
  description: z.string().optional(),
  /** Group name for element variant competition. */
  elementVariantGroup: z.string().optional(),
  /** Name template with {element} placeholder. */
  nameTemplate: z.string().optional(),
  /** KB recovery time override (seconds). 0 for i-frame skills. */
  knockbackRecovery: z.number().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Mixed rotations
// ---------------------------------------------------------------------------

export const mixedRotationComponentSchema = z.object({
  /** Skill name (must match a SkillEntry.name in the same class). */
  skill: z.string(),
  /** Fraction of time spent on this skill (0-1). */
  weight: z.number(),
});

export const mixedRotationSchema = z.object({
  /** Display name for the rotation. */
  name: z.string(),
  /** Tooltip text explaining the rotation assumptions. */
  description: z.string(),
  /** Component skills and their time weights. */
  components: z.array(mixedRotationComponentSchema),
  /** If false, rotation is shown only when "show all skills" is toggled on. Default true. */
  headline: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Class skill data  (data/skills/*.json)
// ---------------------------------------------------------------------------

export const classSkillDataSchema = z.object({
  className: z.string(),
  /** Citation for where this class's data comes from. */
  source: z.string().optional(),
  /** Skill mastery value (0-1). */
  mastery: z.number(),
  /** Primary stat name. */
  primaryStat: statNameSchema,
  /** Secondary stat name(s). Array when multiple stats contribute. */
  secondaryStat: z.union([statNameSchema, z.array(statNameSchema)]),
  /** SE crit rate (fraction of attacks that crit with SE). */
  sharpEyesCritRate: z.number(),
  /** SE critical damage bonus added to base power. */
  sharpEyesCritDamageBonus: z.number(),
  /** SE crit damage formula variant. */
  seCritFormula: seCritFormulaSchema.optional(),
  /** Which damage formula to use. */
  damageFormula: damageFormulaSchema.optional(),
  /** Element Amplification multiplier for mages (1.4 for Archmage, 1.0 for Bishop). */
  spellAmplification: z.number().optional(),
  /** Elemental Staff/Wand bonus multiplier for mages. */
  weaponAmplification: z.number().optional(),
  /** Power Stance rate (0-1). */
  stanceRate: z.number().optional(),
  /** Shadow Shifter dodge rate (0-1). */
  shadowShifterRate: z.number().optional(),
  skills: z.array(skillEntrySchema),
  /** Optional mixed rotation estimates. */
  mixedRotations: z.array(mixedRotationSchema).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Character build  (constructed from gear templates)
// ---------------------------------------------------------------------------

export const characterBuildSchema = z.object({
  className: z.string(),
  /** Base stats before any gear or buffs. */
  baseStats: statBlockSchema,
  /** Total stats from gear (added on top of MW-boosted base stats). */
  gearStats: statBlockSchema,
  /** Total weapon attack from all gear sources. */
  totalWeaponAttack: z.number(),
  /** Weapon type name (must match WeaponData). */
  weaponType: z.string(),
  /** Base weapon speed before booster/SI. */
  weaponSpeed: z.number().int(),
  /** Attack potion WATK bonus. */
  attackPotion: z.number(),
  /** Projectile WATK bonus (0 for melee). */
  projectile: z.number(),
  /** Whether echo of hero is active (4% WATK bonus). */
  echoActive: z.boolean(),
  /** MW skill level (0-30). */
  mwLevel: z.number().int(),
  /** Whether Speed Infusion is active. */
  speedInfusion: z.boolean(),
  /** Whether Sharp Eyes is active. */
  sharpEyes: z.boolean(),
  /** Whether Shadow Partner is active (1.5x damage multiplier). */
  shadowPartner: z.boolean().optional(),
  /** Character avoidability stat. Default 0 (negligible at boss level). */
  avoidability: z.number().optional(),
});
