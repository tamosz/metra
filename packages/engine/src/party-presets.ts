import type { Party } from './party.js';

export type PresetParty = Party & {
  description: string;
  autoComputed?: boolean;
};

export const PARTY_PRESETS: PresetParty[] = [
  {
    name: 'Meta',
    description: 'Highest total party DPS (auto-computed)',
    members: [],
    autoComputed: true,
  },
  {
    name: 'No Support',
    description: 'Pure DPS — no SE, SI, or Rage',
    members: [],
    autoComputed: true,
  },
  {
    name: 'Warriors + SI',
    description: 'Full warrior lineup with Buccaneer for Speed Infusion',
    members: [
      { className: 'hero' },
      { className: 'hero-axe' },
      { className: 'dark-knight' },
      { className: 'dark-knight' },
      { className: 'paladin' },
      { className: 'bucc' },
    ],
  },
  {
    name: 'Rainbow',
    description: 'One of each archetype',
    members: [
      { className: 'hero' },
      { className: 'dark-knight' },
      { className: 'night-lord' },
      { className: 'bowmaster' },
      { className: 'bucc' },
      { className: 'archmage-il' },
    ],
  },
  {
    name: 'Thief Gang',
    description: 'Crit-stacking thieves with SE support',
    members: [
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'shadower' },
      { className: 'shadower' },
      { className: 'bowmaster' },
    ],
  },
  {
    name: 'Pirate Crew',
    description: 'Buccaneers and Corsairs with SE and Rage',
    members: [
      { className: 'bucc' },
      { className: 'bucc' },
      { className: 'sair' },
      { className: 'sair' },
      { className: 'bowmaster' },
      { className: 'hero' },
    ],
  },
  {
    name: 'Mage Council',
    description: 'All three mage classes with SE and Rage',
    members: [
      { className: 'archmage-il' },
      { className: 'archmage-fp' },
      { className: 'bishop' },
      { className: 'bishop' },
      { className: 'bowmaster' },
      { className: 'hero' },
    ],
  },
  {
    name: 'Archer Stack',
    description: 'Maximum ranged DPS with SI and Rage',
    members: [
      { className: 'bowmaster' },
      { className: 'bowmaster' },
      { className: 'marksman' },
      { className: 'marksman' },
      { className: 'hero' },
      { className: 'bucc' },
    ],
  },
  {
    name: 'Glass Cannon',
    description: 'Maximum single-target DPS, no defensive utility',
    members: [
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'night-lord' },
      { className: 'bowmaster' },
      { className: 'bucc' },
    ],
  },
  {
    name: 'One of Each',
    description: 'No duplicates — every slot is different',
    members: [
      { className: 'night-lord' },
      { className: 'bowmaster' },
      { className: 'hero' },
      { className: 'bucc' },
      { className: 'dark-knight' },
      { className: 'shadower' },
    ],
  },
  {
    name: 'Paladin Party',
    description: 'Paladins lead the charge',
    members: [
      { className: 'paladin' },
      { className: 'paladin' },
      { className: 'paladin-bw' },
      { className: 'bowmaster' },
      { className: 'bucc' },
      { className: 'hero' },
    ],
  },
  {
    name: 'Corsair Fleet',
    description: 'Battleships with full support',
    members: [
      { className: 'sair' },
      { className: 'sair' },
      { className: 'sair' },
      { className: 'sair' },
      { className: 'bowmaster' },
      { className: 'bucc' },
    ],
  },
];
