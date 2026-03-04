import { loadWeapons, loadAttackSpeed, loadMW, loadClassSkills, loadGearTemplate, discoverClassesAndTiers } from './src/data/loader.js';
import { calculateSkillDps } from './src/engine/dps.js';
import { runSimulation } from './src/proposals/simulate.js';
import { compareProposal } from './src/proposals/compare.js';
import { readFileSync } from 'fs';

const weaponData = loadWeapons();
const attackSpeedData = loadAttackSpeed();
const mwData = loadMW();

function computeDps(className, tier, skillName) {
  const classData = loadClassSkills(className);
  const build = loadGearTemplate(`${className}-${tier}`);
  const skill = classData.skills.find(s => s.name === skillName);
  if (!skill) throw new Error(`Skill "${skillName}" not found for ${className}`);
  return calculateSkillDps(build, classData, skill, weaponData, attackSpeedData, mwData);
}

// Get all values needed for dps.test.ts
const classes = [
  ['hero', 'high', 'Brandish (Sword)'],
  ['hero', 'low', 'Brandish (Sword)'],
  ['drk', 'high', 'Spear Crusher'],
  ['drk', 'low', 'Spear Crusher'],
  ['paladin', 'high', 'Blast (Holy, Sword)'],
  ['paladin', 'low', 'Blast (Holy, Sword)'],
  ['nl', 'high', 'Triple Throw'],
  ['nl', 'low', 'Triple Throw'],
  ['shadower', 'high', 'Boomerang Step'],
  ['shadower', 'high', 'Assassinate'],
  ['shadower', 'high', 'Savage Blow'],
  ['shadower', 'low', 'Boomerang Step'],
  ['shadower', 'low', 'Assassinate'],
  ['shadower', 'low', 'Savage Blow'],
  ['marksman', 'high', 'Strafe (MM)'],
  ['marksman', 'low', 'Strafe (MM)'],
  ['marksman', 'high', 'Strafe (in Snipe Rotation)'],
  ['archmage-il', 'high', 'Chain Lightning'],
  ['archmage-il', 'low', 'Chain Lightning'],
  ['archmage-il', 'high', 'Blizzard'],
  ['bishop', 'high', 'Angel Ray'],
  ['bishop', 'high', 'Genesis'],
  ['archmage-fp', 'high', 'Paralyze'],
  ['archmage-fp', 'low', 'Paralyze'],
  ['archmage-fp', 'high', 'Meteor'],
  ['archmage-fp', 'low', 'Meteor'],
  ['bowmaster', 'high', 'Hurricane'],
  ['bowmaster', 'low', 'Hurricane'],
  ['hero-axe', 'high', 'Brandish'],
  ['hero-axe', 'low', 'Brandish'],
  ['sair', 'high', 'Battleship Cannon'],
  ['sair', 'low', 'Battleship Cannon'],
  ['sair', 'high', 'Rapid Fire'],
  ['sair', 'low', 'Rapid Fire'],
  ['bucc', 'high', 'Demolition'],
  ['bucc', 'low', 'Demolition'],
];

console.log("=== PER-SKILL DPS VALUES ===");
for (const [cls, tier, skill] of classes) {
  const r = computeDps(cls, tier, skill);
  console.log(`${cls}|${tier}|${skill}|max=${r.damageRange.max}|min=${r.damageRange.min}|avg=${r.damageRange.average}|dps=${r.dps}|uncapped=${r.uncappedDps}|adjNorm=${r.adjustedRangeNormal}`);
}

// Integration test values
const disc = discoverClassesAndTiers();
const config = { classes: disc.classNames, tiers: disc.tiers, scenarios: [{ name: 'Buffed' }] };
const results = runSimulation(config, disc.classDataMap, disc.gearTemplates, weaponData, attackSpeedData, mwData);

const find = (cn, sn, tier) => results.find(r => r.className === cn && r.skillName === sn && r.tier === tier);

console.log("\n=== INTEGRATION HIGH ===");
for (const [cn, sn] of [
  ['Hero', 'Brandish (Sword)'], ['Hero (Axe)', 'Brandish'], ['DrK', 'Spear Crusher'],
  ['Paladin', 'Blast (Holy, Sword)'], ['NL', 'Triple Throw'], ['Bowmaster', 'Hurricane'],
  ['Marksman', 'Strafe (MM)'], ['Marksman', 'Snipe + Strafe'],
  ['Corsair', 'Battleship Cannon'], ['Corsair', 'Rapid Fire'],
  ['Shadower', 'BStep + Assassinate']
]) {
  const r = find(cn, sn, 'high');
  console.log(`${cn}|${sn}|${Math.round(r.dps.dps)}`);
}

console.log("\n=== INTEGRATION MID ===");
for (const [cn, sn] of [
  ['Hero', 'Brandish (Sword)'], ['Hero (Axe)', 'Brandish'], ['DrK', 'Spear Crusher'],
  ['Paladin', 'Blast (Holy, Sword)'], ['NL', 'Triple Throw'], ['Bowmaster', 'Hurricane'],
  ['Marksman', 'Strafe (MM)'], ['Marksman', 'Snipe + Strafe'],
  ['Corsair', 'Battleship Cannon'], ['Corsair', 'Rapid Fire'],
  ['Shadower', 'BStep + Assassinate']
]) {
  const r = find(cn, sn, 'mid');
  console.log(`${cn}|${sn}|${Math.round(r.dps.dps)}`);
}

console.log("\n=== INTEGRATION LOW ===");
for (const [cn, sn] of [
  ['Hero', 'Brandish (Sword)'], ['DrK', 'Spear Crusher'],
  ['Paladin', 'Blast (Holy, Sword)'], ['Bowmaster', 'Hurricane'],
  ['Marksman', 'Strafe (MM)'], ['Marksman', 'Snipe + Strafe'],
  ['Corsair', 'Battleship Cannon'], ['Corsair', 'Rapid Fire'],
  ['Shadower', 'BStep + Assassinate']
]) {
  const r = find(cn, sn, 'low');
  console.log(`${cn}|${sn}|${Math.round(r.dps.dps)}`);
}

// Proposal
const proposalJson = JSON.parse(readFileSync('proposals/brandish-buff-20.json', 'utf-8'));
const comparison = compareProposal(proposalJson, config, disc.classDataMap, disc.gearTemplates, weaponData, attackSpeedData, mwData);
const hbh = comparison.deltas.find(d => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'high');
const hbl = comparison.deltas.find(d => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'low');
console.log(`\n=== PROPOSAL ===`);
console.log(`high_after=${hbh.after}`);
console.log(`low_after=${hbl.after}`);

// PDR
const pdrConfig = {
  classes: disc.classNames, tiers: ['high'],
  scenarios: [{ name: 'Buffed' }, { name: 'Bossing (50% PDR)', pdr: 0.5 }]
};
const pdrResults = runSimulation(pdrConfig, disc.classDataMap, disc.gearTemplates, weaponData, attackSpeedData, mwData);
const snipeB = pdrResults.find(r => r.skillName === 'Snipe + Strafe' && r.scenario === 'Buffed');
const snipeP = pdrResults.find(r => r.skillName === 'Snipe + Strafe' && r.scenario === 'Bossing (50% PDR)');
console.log(`snipe_buffed=${Math.round(snipeB.dps.dps)}`);
console.log(`snipe_pdr=${Math.round(snipeP.dps.dps)}`);
