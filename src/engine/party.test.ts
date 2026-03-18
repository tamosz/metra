import { describe, it, expect } from 'vitest';
import {
  resolvePartyBuffs,
  simulateParty,
  computeBuffAttribution,
  type CharacterBuild,
  type ClassSkillData,
  type WeaponData,
  type AttackSpeedData,
  type MWData,
  type Party,
} from '@metra/engine';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeBuild(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    className: 'hero',
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

function makeClassData(overrides: Partial<ClassSkillData> = {}): ClassSkillData {
  return {
    className: 'hero',
    mastery: 0.6,
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 0.15,
    skills: [
      {
        name: 'Brandish',
        basePower: 260,
        multiplier: 1,
        hitCount: 2,
        speedCategory: 'Brandish',
        weaponType: '2H Sword',
      },
    ],
    ...overrides,
  };
}

// Archer with SE and a single skill
function makeArcherClassData(): ClassSkillData {
  return {
    className: 'bowmaster',
    mastery: 0.6,
    primaryStat: 'DEX',
    secondaryStat: 'STR',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 0.15,
    skills: [
      {
        name: 'Hurricane',
        basePower: 140,
        multiplier: 1,
        hitCount: 1,
        speedCategory: 'Brandish',
        weaponType: '2H Sword',
      },
    ],
  };
}

function makeArcherBuild(): CharacterBuild {
  return makeBuild({ className: 'bowmaster', weaponType: '2H Sword', sharpEyes: false });
}

const weaponData: WeaponData = {
  types: [
    { name: '2H Sword', slashMultiplier: 4.6, stabMultiplier: 0 },
    { name: 'Claw', slashMultiplier: 0, stabMultiplier: 3.6 },
  ],
};

const attackSpeedData: AttackSpeedData = {
  categories: ['Brandish', 'Triple Throw'],
  entries: [
    { speed: 2, times: { Brandish: 0.63, 'Triple Throw': 0.60 } },
  ],
};

const mwData: MWData = [
  { level: 0, multiplier: 1 },
  { level: 20, multiplier: 1.1 },
];

// ── resolvePartyBuffs (already covered in prior tests; just a sanity check) ──

describe('resolvePartyBuffs', () => {
  it('returns all false for a party with no buff providers', () => {
    const members = [
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'dark-knight' },
      { className: 'shadower' },
      { className: 'archmage-il' },
      { className: 'bishop' },
    ];
    const buffs = resolvePartyBuffs(members);
    expect(buffs.sharpEyes).toBe(false);
    expect(buffs.speedInfusion).toBe(false);
  });

  it('enables SE when Bowmaster is present', () => {
    const members = [{ className: 'bowmaster' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).sharpEyes).toBe(true);
  });

  it('enables SE when Marksman is present', () => {
    const members = [{ className: 'marksman' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).sharpEyes).toBe(true);
  });

  it('enables SI when Buccaneer is present', () => {
    const members = [{ className: 'bucc' }, { className: 'night-lord' }];
    expect(resolvePartyBuffs(members).speedInfusion).toBe(true);
  });

  it('does not double-apply buffs with duplicate buff providers', () => {
    const members = [
      { className: 'bowmaster' },
      { className: 'marksman' },
      { className: 'bucc' },
      { className: 'night-lord' },
    ];
    const buffs = resolvePartyBuffs(members);
    expect(buffs.sharpEyes).toBe(true);
    expect(buffs.speedInfusion).toBe(true);
  });

  it('handles empty party', () => {
    const buffs = resolvePartyBuffs([]);
    expect(buffs.sharpEyes).toBe(false);
    expect(buffs.speedInfusion).toBe(false);
  });
});

// ── simulateParty ─────────────────────────────────────────────────────────────

describe('simulateParty', () => {
  it('returns a result for each member', () => {
    const party: Party = {
      name: 'test',
      members: [{ className: 'hero' }, { className: 'hero' }],
    };
    const classDataMap = new Map([['hero', makeClassData()]]);
    const gearTemplates = new Map([['hero-perfect', makeBuild()]]);

    const result = simulateParty(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    expect(result.members).toHaveLength(2);
    for (const member of result.members) {
      expect(member.className).toBe('hero');
      expect(member.dps).toBeGreaterThan(0);
      expect(member.skillName).toBeTruthy();
    }
  });

  it('total DPS equals sum of member DPS', () => {
    const party: Party = {
      name: 'test',
      members: [{ className: 'hero' }, { className: 'hero' }],
    };
    const classDataMap = new Map([['hero', makeClassData()]]);
    const gearTemplates = new Map([['hero-perfect', makeBuild()]]);

    const result = simulateParty(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
    const expectedTotal = result.members.reduce((sum, m) => sum + m.dps, 0);

    expect(result.totalDps).toBeCloseTo(expectedTotal, 5);
  });

  it('applies SE when an archer is in the party — hero DPS higher with SE', () => {
    // Party with SE provider
    const partyWithArcher: Party = {
      name: 'se party',
      members: [{ className: 'hero' }, { className: 'bowmaster' }],
    };
    // Party without SE provider
    const partyNoArcher: Party = {
      name: 'no se party',
      members: [{ className: 'hero' }, { className: 'hero' }],
    };

    const heroData = makeClassData();
    // Build with SE=false so the party-resolved buff is meaningful
    const heroBuildNoSE = makeBuild({ sharpEyes: false });
    const classDataMap = new Map([
      ['hero', heroData],
      ['bowmaster', makeArcherClassData()],
    ]);
    const gearTemplates = new Map([
      ['hero-perfect', heroBuildNoSE],
      ['bowmaster-perfect', makeArcherBuild()],
    ]);

    const withArcher = simulateParty(partyWithArcher, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
    const withoutArcher = simulateParty(partyNoArcher, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const heroDpsWithSE = withArcher.members.find((m) => m.className === 'hero')!.dps;
    const heroDpsWithoutSE = withoutArcher.members.find((m) => m.className === 'hero')!.dps;

    expect(heroDpsWithSE).toBeGreaterThan(heroDpsWithoutSE);
  });

  it('returns zero DPS for unknown class (no data available)', () => {
    const party: Party = {
      name: 'test',
      members: [{ className: 'unknown-class' }],
    };
    const classDataMap = new Map([['hero', makeClassData()]]);
    const gearTemplates = new Map([['hero-perfect', makeBuild()]]);

    const result = simulateParty(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    expect(result.members[0].dps).toBe(0);
    expect(result.members[0].skillName).toBe('Unknown');
  });

  it('skips hidden skills when picking top skill', () => {
    const classDataWithHidden = makeClassData({
      skills: [
        {
          name: 'Visible Skill',
          basePower: 100,
          multiplier: 1,
          hitCount: 1,
          speedCategory: 'Brandish',
          weaponType: '2H Sword',
        },
        {
          name: 'Hidden Skill',
          basePower: 9999,
          multiplier: 1,
          hitCount: 1,
          speedCategory: 'Brandish',
          weaponType: '2H Sword',
          hidden: true,
        },
      ],
    });

    const party: Party = {
      name: 'test',
      members: [{ className: 'hero' }],
    };
    const classDataMap = new Map([['hero', classDataWithHidden]]);
    const gearTemplates = new Map([['hero-perfect', makeBuild()]]);

    const result = simulateParty(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
    expect(result.members[0].skillName).toBe('Visible Skill');
  });
});

// ── computeBuffAttribution ────────────────────────────────────────────────────

describe('computeBuffAttribution', () => {
  it('non-buff class (two night-lords) has zero buffContribution', () => {
    // Two night-lords provide no party buffs, so buffContribution should be zero
    const nightLordData = makeClassData({ className: 'night-lord' });
    const nightLordBuild = makeBuild({ className: 'night-lord' });

    const party: Party = {
      name: 'test',
      members: [{ className: 'night-lord' }, { className: 'night-lord' }],
    };
    const classDataMap = new Map([['night-lord', nightLordData]]);
    const gearTemplates = new Map([['night-lord-perfect', nightLordBuild]]);

    const result = computeBuffAttribution(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    for (const member of result.members) {
      expect(member.buffContribution).toBe(0);
    }
  });

  it('archer has positive buffContribution from SE', () => {
    // Archer provides SE to the hero — removing the archer loses SE buff benefit
    const heroData = makeClassData({ skills: [{ name: 'Brandish', basePower: 260, multiplier: 1, hitCount: 2, speedCategory: 'Brandish', weaponType: '2H Sword' }] });
    const archerData = makeArcherClassData();
    const heroBuildNoSE = makeBuild({ sharpEyes: false });
    const archerBuild = makeArcherBuild();

    const party: Party = {
      name: 'test',
      members: [{ className: 'hero' }, { className: 'bowmaster' }],
    };
    const classDataMap = new Map([
      ['hero', heroData],
      ['bowmaster', archerData],
    ]);
    const gearTemplates = new Map([
      ['hero-perfect', heroBuildNoSE],
      ['bowmaster-perfect', archerBuild],
    ]);

    const result = computeBuffAttribution(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const archer = result.members.find((m) => m.className === 'bowmaster')!;
    expect(archer.buffContribution).toBeGreaterThan(0);
  });

  it('soloBaseline is DPS without any party buffs', () => {
    const party: Party = {
      name: 'test',
      members: [{ className: 'hero' }, { className: 'bowmaster' }],
    };
    // Build with SE=false so difference is meaningful
    const heroBuildNoSE = makeBuild({ sharpEyes: false });
    const archerBuild = makeArcherBuild();
    const classDataMap = new Map([
      ['hero', makeClassData()],
      ['bowmaster', makeArcherClassData()],
    ]);
    const gearTemplates = new Map([
      ['hero-perfect', heroBuildNoSE],
      ['bowmaster-perfect', archerBuild],
    ]);

    const result = computeBuffAttribution(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    for (const member of result.members) {
      // Solo baseline (no party buffs) should be <= party DPS
      expect(member.soloBaseline).toBeGreaterThan(0);
      expect(member.soloBaseline).toBeLessThanOrEqual(member.dps);
    }
  });

  it('soloBaseline equals party DPS when no buffs are provided', () => {
    // Two night-lords: no party buffs, so solo baseline = party DPS
    const nightLordData = makeClassData({ className: 'night-lord' });
    const nightLordBuild = makeBuild({ className: 'night-lord', sharpEyes: false, speedInfusion: false });

    const party: Party = {
      name: 'test',
      members: [{ className: 'night-lord' }, { className: 'night-lord' }],
    };
    const classDataMap = new Map([['night-lord', nightLordData]]);
    const gearTemplates = new Map([['night-lord-perfect', nightLordBuild]]);

    const result = computeBuffAttribution(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    for (const member of result.members) {
      expect(member.soloBaseline).toBeCloseTo(member.dps, 5);
    }
  });
});
