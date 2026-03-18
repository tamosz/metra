import { calculateBuildDps, type SkillDpsRow } from './build-dps.js';
import type {
  CharacterBuild,
  ClassSkillData,
  WeaponData,
  AttackSpeedData,
  MWData,
} from './types.js';

export interface PartyMember {
  className: string;
}

export interface Party {
  name: string;
  members: PartyMember[];
}

export interface PartyBuffState {
  sharpEyes: boolean;
  speedInfusion: boolean;
}

export interface PartyMemberResult {
  className: string;
  skillName: string;
  dps: number;
  soloBaseline: number;
  buffContribution: number;
}

export interface PartySimulationResult {
  party: Party;
  totalDps: number;
  members: PartyMemberResult[];
  activeBuffs: PartyBuffState;
}

const SE_PROVIDERS = new Set(['bowmaster', 'marksman']);
const SI_PROVIDERS = new Set(['bucc']);

export function resolvePartyBuffs(members: PartyMember[]): PartyBuffState {
  let sharpEyes = false;
  let speedInfusion = false;

  for (const member of members) {
    if (SE_PROVIDERS.has(member.className)) sharpEyes = true;
    if (SI_PROVIDERS.has(member.className)) speedInfusion = true;
  }

  return { sharpEyes, speedInfusion };
}

const DEFAULT_TIER = 'perfect';

function getTopSkill(aggregated: SkillDpsRow[], classData: ClassSkillData): SkillDpsRow | null {
  if (aggregated.length === 0) return null;
  const hidden = new Set<string>();
  for (const skill of classData.skills) {
    if (skill.hidden) {
      hidden.add(skill.name);
      if (skill.comboGroup) hidden.add(skill.comboGroup);
    }
  }
  const visible = aggregated.filter((row) => !hidden.has(row.skillName));
  // Fall back to hidden skills if all skills are hidden (e.g., Dark Knight's
  // Crusher variants are hidden because the dashboard shows them as a mixed rotation)
  const candidates = visible.length > 0 ? visible : aggregated;
  return candidates.reduce((best, row) => (row.dps > best.dps ? row : best));
}

function applyPartyBuffs(build: CharacterBuild, buffs: PartyBuffState): CharacterBuild {
  return { ...build, sharpEyes: buffs.sharpEyes, speedInfusion: buffs.speedInfusion };
}

function simulateMember(
  className: string,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData,
  buffs: PartyBuffState,
): { skillName: string; dps: number } | null {
  const classData = classDataMap.get(className);
  const baseBuild = gearTemplates.get(`${className}-${DEFAULT_TIER}`);
  if (!classData || !baseBuild) return null;
  const build = applyPartyBuffs(baseBuild, buffs);
  const result = calculateBuildDps(build, classData, weaponData, attackSpeedData, mwData);
  const top = getTopSkill(result.aggregated, classData);
  if (!top) return null;
  return { skillName: top.skillName, dps: top.dps };
}

export function simulateParty(
  party: Party,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData,
): PartySimulationResult {
  const activeBuffs = resolvePartyBuffs(party.members);
  const members: PartyMemberResult[] = [];

  for (const member of party.members) {
    const sim = simulateMember(
      member.className,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData,
      activeBuffs,
    );
    members.push({
      className: member.className,
      skillName: sim?.skillName ?? 'Unknown',
      dps: sim?.dps ?? 0,
      soloBaseline: 0,
      buffContribution: 0,
    });
  }

  const totalDps = members.reduce((sum, m) => sum + m.dps, 0);
  return { party, totalDps, members, activeBuffs };
}

const NO_BUFFS: PartyBuffState = { sharpEyes: false, speedInfusion: false };

export function computeBuffAttribution(
  party: Party,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData,
): PartySimulationResult {
  const fullResult = simulateParty(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

  // Solo baseline: DPS with no party-derived buffs
  for (let i = 0; i < party.members.length; i++) {
    const sim = simulateMember(
      party.members[i].className,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData,
      NO_BUFFS,
    );
    fullResult.members[i].soloBaseline = sim?.dps ?? 0;
  }

  // Buff attribution: for each member, simulate without them and measure total DPS loss
  for (let i = 0; i < party.members.length; i++) {
    const withoutMembers = party.members.filter((_, j) => j !== i);
    const withoutResult = simulateParty(
      { name: party.name, members: withoutMembers },
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData,
    );
    const dpsLoss = fullResult.totalDps - withoutResult.totalDps;
    fullResult.members[i].buffContribution = Math.max(0, dpsLoss - fullResult.members[i].dps);
  }

  return fullResult;
}
