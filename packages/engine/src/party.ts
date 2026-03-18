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
  rage: boolean;
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
const RAGE_PROVIDERS = new Set(['hero', 'hero-axe']);

export function resolvePartyBuffs(members: PartyMember[]): PartyBuffState {
  let sharpEyes = false;
  let speedInfusion = false;
  let rage = false;

  for (const member of members) {
    if (SE_PROVIDERS.has(member.className)) sharpEyes = true;
    if (SI_PROVIDERS.has(member.className)) speedInfusion = true;
    if (RAGE_PROVIDERS.has(member.className)) rage = true;
  }

  return { sharpEyes, speedInfusion, rage };
}
