import { describe, it, expect } from 'vitest';
import {
  findOptimalParty,
  type OptimizationConstraints,
  type CharacterBuild,
  type ClassSkillData,
  type WeaponData,
  type AttackSpeedData,
  type MWData,
} from '@metra/engine';

// ── Fixtures ───────────────────────────────────────────────────────────────────

function makeBuild(className: string, overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    className,
    baseStats: { STR: 999, DEX: 23, INT: 4, LUK: 4 },
    gearStats: { STR: 174, DEX: 102, INT: 0, LUK: 0 },
    totalWeaponAttack: 214,
    weaponType: '2H Sword',
    weaponSpeed: 6,
    attackPotion: 100,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
    ...overrides,
  };
}

function makeClassData(className: string, basePower = 260): ClassSkillData {
  return {
    className,
    mastery: 0.6,
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 0.15,
    skills: [
      {
        name: 'Main Skill',
        basePower,
        multiplier: 1,
        hitCount: 2,
        speedCategory: 'Brandish',
        weaponType: '2H Sword',
      },
    ],
  };
}

const weaponData: WeaponData = {
  types: [
    { name: '2H Sword', slashMultiplier: 4.6, stabMultiplier: 0 },
  ],
};

const attackSpeedData: AttackSpeedData = {
  categories: ['Brandish'],
  entries: [
    { speed: 2, times: { Brandish: 0.63 } },
  ],
};

const mwData: MWData = [
  { level: 0, multiplier: 1 },
  { level: 20, multiplier: 1.1 },
];

// Three classes: alpha (highest base power), beta, gamma (lowest)
function makeFixtures() {
  const classDataMap = new Map<string, ClassSkillData>([
    ['alpha', makeClassData('alpha', 400)],
    ['beta', makeClassData('beta', 260)],
    ['gamma', makeClassData('gamma', 100)],
  ]);
  const gearTemplates = new Map<string, CharacterBuild>([
    ['alpha-perfect', makeBuild('alpha')],
    ['beta-perfect', makeBuild('beta')],
    ['gamma-perfect', makeBuild('gamma')],
  ]);
  return { classDataMap, gearTemplates };
}

// ── findOptimalParty ───────────────────────────────────────────────────────────

describe('findOptimalParty', () => {
  it('finds the best party from available classes', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2);

    // Best 2-member party should prefer alpha (highest DPS)
    const optimalClasses = result.optimal.party.members.map((m) => m.className);
    expect(optimalClasses.every((c) => c === 'alpha')).toBe(true);
    expect(result.optimal.totalDps).toBeGreaterThan(0);
  });

  it('returns topParties sorted by descending total DPS', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2, undefined, 5);

    expect(result.topParties.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < result.topParties.length; i++) {
      expect(result.topParties[i - 1].totalDps).toBeGreaterThanOrEqual(result.topParties[i].totalDps);
    }
  });

  it('returns exactly topN parties when enough combinations exist', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    // With 3 classes and party size 2, combinations with repetition = C(3+2-1,2) = 6
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2, undefined, 3);
    expect(result.topParties).toHaveLength(3);
  });

  it('returns fewer than topN when not enough combinations exist', () => {
    const classDataMap = new Map<string, ClassSkillData>([
      ['alpha', makeClassData('alpha', 400)],
    ]);
    const gearTemplates = new Map<string, CharacterBuild>([
      ['alpha-perfect', makeBuild('alpha')],
    ]);
    // Only 1 combination with 1 class and party size 1
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 1, undefined, 10);
    expect(result.topParties).toHaveLength(1);
  });

  it('respects required constraint — required classes always appear in optimal', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const constraints: OptimizationConstraints = { required: ['gamma'] };
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2, constraints);

    // Every party must include 'gamma'
    for (const party of result.topParties) {
      const classNames = party.party.members.map((m) => m.className);
      expect(classNames).toContain('gamma');
    }
  });

  it('respects excluded constraint — excluded classes never appear', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const constraints: OptimizationConstraints = { excluded: ['alpha'] };
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2, constraints);

    for (const party of result.topParties) {
      const classNames = party.party.members.map((m) => m.className);
      expect(classNames).not.toContain('alpha');
    }
  });

  it('respects maxDuplicates constraint', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const constraints: OptimizationConstraints = { maxDuplicates: 1 };
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2, constraints, 10);

    for (const party of result.topParties) {
      const counts = new Map<string, number>();
      for (const m of party.party.members) {
        counts.set(m.className, (counts.get(m.className) ?? 0) + 1);
      }
      for (const count of counts.values()) {
        expect(count).toBeLessThanOrEqual(1);
      }
    }
  });

  it('optimal is always the first entry in topParties', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2);
    expect(result.optimal).toBe(result.topParties[0]);
  });

  it('throws when required classes exceed party size', () => {
    const { classDataMap, gearTemplates } = makeFixtures();
    const constraints: OptimizationConstraints = { required: ['alpha', 'beta', 'gamma'] };
    expect(() =>
      findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 2, constraints),
    ).toThrow();
  });

  it('skips classes that have no gear template', () => {
    const classDataMap = new Map<string, ClassSkillData>([
      ['alpha', makeClassData('alpha', 400)],
      ['no-gear', makeClassData('no-gear', 9999)], // no gear template — should be excluded
    ]);
    const gearTemplates = new Map<string, CharacterBuild>([
      ['alpha-perfect', makeBuild('alpha')],
      // no 'no-gear-perfect' entry
    ]);

    const result = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 1);
    const classNames = result.optimal.party.members.map((m) => m.className);
    expect(classNames).not.toContain('no-gear');
    expect(classNames).toContain('alpha');
  });
});
