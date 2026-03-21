/**
 * Validates all JSON data files in data/ against expected schemas.
 * Catches structural issues (missing fields, wrong types, invalid values)
 * that TypeScript can't catch because data files are loaded at runtime.
 *
 * Run: npm run validate-data
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, '../data');

const errors: string[] = [];

function fail(file: string, message: string) {
  errors.push(`${file}: ${message}`);
}

function loadJson(relativePath: string): unknown {
  const fullPath = resolve(DATA_DIR, relativePath);
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch (err) {
    fail(relativePath, `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// --- Validate weapons.json ---
function validateWeapons() {
  const data = loadJson('weapons.json') as { types?: unknown[] } | null;
  if (!data) return;
  if (!Array.isArray(data.types)) {
    fail('weapons.json', 'Missing "types" array');
    return;
  }
  for (let i = 0; i < data.types.length; i++) {
    const w = data.types[i] as Record<string, unknown>;
    if (typeof w.name !== 'string') fail('weapons.json', `types[${i}]: missing "name" string`);
    if (typeof w.slashMultiplier !== 'number') fail('weapons.json', `types[${i}]: missing "slashMultiplier" number`);
    if (typeof w.stabMultiplier !== 'number') fail('weapons.json', `types[${i}]: missing "stabMultiplier" number`);
  }
}

// --- Validate attack-speed.json ---
function validateAttackSpeed() {
  const data = loadJson('attack-speed.json') as { categories?: string[]; entries?: unknown[] } | null;
  if (!data) return;
  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    fail('attack-speed.json', 'Missing or empty "categories" array');
    return;
  }
  if (!Array.isArray(data.entries) || data.entries.length === 0) {
    fail('attack-speed.json', 'Missing or empty "entries" array');
    return;
  }
  for (let i = 0; i < data.entries.length; i++) {
    const entry = data.entries[i] as Record<string, unknown>;
    if (typeof entry.speed !== 'number') fail('attack-speed.json', `entries[${i}]: missing "speed" number`);
    if (typeof entry.times !== 'object' || entry.times === null) {
      fail('attack-speed.json', `entries[${i}]: missing "times" object`);
    } else {
      for (const cat of data.categories) {
        if (typeof (entry.times as Record<string, unknown>)[cat] !== 'number') {
          fail('attack-speed.json', `entries[${i}]: missing time for category "${cat}"`);
        }
      }
    }
  }
}

// --- Validate skill files ---
const VALID_DAMAGE_FORMULAS = new Set(['standard', 'throwingStar', 'magic']);
const VALID_CRIT_FORMULAS = new Set(['addBeforeMultiply', 'multiplicative', 'scaleOnBase']);
const VALID_STATS = new Set(['STR', 'DEX', 'INT', 'LUK']);

function validateSkillFile(filename: string) {
  const data = loadJson(`skills/${filename}`) as Record<string, unknown> | null;
  if (!data) return;
  const file = `skills/${filename}`;

  if (typeof data.className !== 'string' || data.className.trim() === '') {
    fail(file, 'Missing "className" string');
  }
  if (typeof data.mastery !== 'number' || data.mastery <= 0 || data.mastery > 1) {
    fail(file, `"mastery" must be > 0 and <= 1, got ${data.mastery}`);
  }
  if (typeof data.primaryStat !== 'string' || !VALID_STATS.has(data.primaryStat)) {
    fail(file, `"primaryStat" must be one of ${[...VALID_STATS].join('/')}, got "${data.primaryStat}"`);
  }
  if (data.secondaryStat !== undefined) {
    const sec = data.secondaryStat;
    if (typeof sec === 'string') {
      if (!VALID_STATS.has(sec)) fail(file, `"secondaryStat" invalid: "${sec}"`);
    } else if (Array.isArray(sec)) {
      for (const s of sec) {
        if (!VALID_STATS.has(s as string)) fail(file, `"secondaryStat" array contains invalid stat: "${s}"`);
      }
    } else {
      fail(file, '"secondaryStat" must be a string or array of strings');
    }
  }
  if (data.damageFormula !== undefined && !VALID_DAMAGE_FORMULAS.has(data.damageFormula as string)) {
    fail(file, `Invalid "damageFormula": "${data.damageFormula}"`);
  }
  if (data.seCritFormula !== undefined && !VALID_CRIT_FORMULAS.has(data.seCritFormula as string)) {
    fail(file, `Invalid "seCritFormula": "${data.seCritFormula}"`);
  }

  if (!Array.isArray(data.skills) || data.skills.length === 0) {
    fail(file, 'Missing or empty "skills" array');
    return;
  }

  const skillNames = new Set<string>();
  for (let i = 0; i < data.skills.length; i++) {
    const skill = data.skills[i] as Record<string, unknown>;
    const prefix = `skills[${i}]`;
    if (typeof skill.name !== 'string' || skill.name.trim() === '') {
      fail(file, `${prefix}: missing "name" string`);
    } else {
      if (skillNames.has(skill.name)) {
        fail(file, `${prefix}: duplicate skill name "${skill.name}"`);
      }
      skillNames.add(skill.name);
    }
    if (skill.fixedDamage === undefined) {
      if (typeof skill.basePower !== 'number' || skill.basePower <= 0) {
        fail(file, `${prefix} "${skill.name}": "basePower" must be > 0`);
      }
      if (typeof skill.multiplier !== 'number' || skill.multiplier <= 0) {
        fail(file, `${prefix} "${skill.name}": "multiplier" must be > 0`);
      }
      if (typeof skill.hitCount !== 'number' || skill.hitCount <= 0 || !Number.isInteger(skill.hitCount)) {
        fail(file, `${prefix} "${skill.name}": "hitCount" must be a positive integer`);
      }
    }
    if (typeof skill.speedCategory !== 'string' || skill.speedCategory.trim() === '') {
      fail(file, `${prefix} "${skill.name}": missing "speedCategory" string`);
    }
    if (typeof skill.weaponType !== 'string' || skill.weaponType.trim() === '') {
      fail(file, `${prefix} "${skill.name}": missing "weaponType" string`);
    }
    if (skill.maxTargets !== undefined && (typeof skill.maxTargets !== 'number' || skill.maxTargets < 1)) {
      fail(file, `${prefix} "${skill.name}": "maxTargets" must be >= 1`);
    }
    if (skill.seCritFormula !== undefined && !VALID_CRIT_FORMULAS.has(skill.seCritFormula as string)) {
      fail(file, `${prefix} "${skill.name}": invalid "seCritFormula": "${skill.seCritFormula}"`);
    }
  }
}

// --- Validate gear templates ---
function validateGearTemplate(filename: string) {
  const data = loadJson(`gear-templates/${filename}`) as Record<string, unknown> | null;
  if (!data) return;
  const file = `gear-templates/${filename}`;

  // Inherited templates have "extends" — they get validated at load time via mergeGearTemplate
  if (data.extends !== undefined) return;

  if (typeof data.className !== 'string') fail(file, 'Missing "className" string');
  if (typeof data.weaponType !== 'string') fail(file, 'Missing "weaponType" string');
  if (typeof data.weaponSpeed !== 'number') fail(file, 'Missing "weaponSpeed" number');
  if (typeof data.totalWeaponAttack !== 'number' || (data.totalWeaponAttack as number) <= 0) {
    fail(file, '"totalWeaponAttack" must be a positive number');
  }
  if (typeof data.mwLevel !== 'number') fail(file, 'Missing "mwLevel" number');

  // Validate stat blocks
  for (const block of ['baseStats', 'gearStats']) {
    const stats = data[block] as Record<string, unknown> | undefined;
    if (!stats || typeof stats !== 'object') {
      fail(file, `Missing "${block}" object`);
    } else {
      for (const stat of ['STR', 'DEX', 'INT', 'LUK']) {
        if (typeof stats[stat] !== 'number') {
          fail(file, `${block}.${stat} must be a number`);
        }
      }
    }
  }
}

// --- Run all validations ---
console.log('Validating data files...\n');

validateWeapons();
validateAttackSpeed();

const skillFiles = readdirSync(resolve(DATA_DIR, 'skills')).filter(f => f.endsWith('.json'));
for (const f of skillFiles) validateSkillFile(f);

const templateFiles = readdirSync(resolve(DATA_DIR, 'gear-templates')).filter(f => f.endsWith('.json') && !f.includes('.base.') && !f.startsWith('mage-shared-'));
for (const f of templateFiles) validateGearTemplate(f);

if (errors.length > 0) {
  console.error(`Found ${errors.length} data validation error(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log(`Validated ${skillFiles.length} skill files and ${templateFiles.length} gear templates. All OK.`);
}
