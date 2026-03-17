import type { CharacterBuild } from '@metra/engine';

/**
 * Frozen CharacterBuild fixtures for unit tests.
 * Generated from gear templates — decouples unit tests from gear data changes.
 * Regenerate with: npx tsx scripts/dump-test-builds.ts > src/engine/test-builds.ts
 */
export const TEST_BUILDS: Record<string, CharacterBuild> = {
  'hero-high': {
      "className": "Hero",
      "baseStats": {
          "STR": 999,
          "DEX": 23,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 175,
          "DEX": 102,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 198,
      "weaponType": "2H Sword",
      "weaponSpeed": 5,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'hero-low': {
      "className": "Hero",
      "baseStats": {
          "STR": 700,
          "DEX": 22,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 95,
          "DEX": 77,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 163,
      "weaponType": "2H Sword",
      "weaponSpeed": 5,
      "attackPotion": 60,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'hero-axe-high': {
      "className": "Hero (Axe)",
      "baseStats": {
          "STR": 999,
          "DEX": 23,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 175,
          "DEX": 102,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 208,
      "weaponType": "2H Axe",
      "weaponSpeed": 6,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'hero-axe-low': {
      "className": "Hero (Axe)",
      "baseStats": {
          "STR": 700,
          "DEX": 22,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 95,
          "DEX": 77,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 163,
      "weaponType": "2H Axe",
      "weaponSpeed": 6,
      "attackPotion": 60,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'dark-knight-high': {
      "className": "Dark Knight",
      "baseStats": {
          "STR": 999,
          "DEX": 23,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 175,
          "DEX": 102,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 192,
      "weaponType": "Spear",
      "weaponSpeed": 6,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'dark-knight-low': {
      "className": "Dark Knight",
      "baseStats": {
          "STR": 700,
          "DEX": 22,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 95,
          "DEX": 77,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 160,
      "weaponType": "Spear",
      "weaponSpeed": 6,
      "attackPotion": 60,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'paladin-high': {
      "className": "Paladin",
      "baseStats": {
          "STR": 999,
          "DEX": 23,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 175,
          "DEX": 102,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 198,
      "weaponType": "2H Sword",
      "weaponSpeed": 6,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'paladin-low': {
      "className": "Paladin",
      "baseStats": {
          "STR": 700,
          "DEX": 22,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 95,
          "DEX": 77,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 163,
      "weaponType": "2H Sword",
      "weaponSpeed": 6,
      "attackPotion": 60,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'paladin-bw-high': {
      "className": "Paladin (BW)",
      "baseStats": {
          "STR": 999,
          "DEX": 23,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 175,
          "DEX": 102,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 214,
      "weaponType": "2H BW",
      "weaponSpeed": 7,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'night-lord-high': {
      "className": "Night Lord",
      "baseStats": {
          "STR": 4,
          "DEX": 25,
          "INT": 4,
          "LUK": 999
      },
      "gearStats": {
          "STR": 0,
          "DEX": 125,
          "INT": 0,
          "LUK": 100
      },
      "totalWeaponAttack": 149,
      "weaponType": "Claw",
      "weaponSpeed": 4,
      "attackPotion": 100,
      "projectile": 30,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": true
  },
  'night-lord-low': {
      "className": "Night Lord",
      "baseStats": {
          "STR": 4,
          "DEX": 25,
          "INT": 4,
          "LUK": 700
      },
      "gearStats": {
          "STR": 0,
          "DEX": 77,
          "INT": 0,
          "LUK": 53
      },
      "totalWeaponAttack": 111,
      "weaponType": "Claw",
      "weaponSpeed": 4,
      "attackPotion": 60,
      "projectile": 27,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": true
  },
  'shadower-high': {
      "className": "Shadower",
      "baseStats": {
          "STR": 4,
          "DEX": 14,
          "INT": 4,
          "LUK": 933
      },
      "gearStats": {
          "STR": 83,
          "DEX": 128,
          "INT": 0,
          "LUK": 140
      },
      "totalWeaponAttack": 238,
      "weaponType": "Dagger",
      "weaponSpeed": 4,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": false
  },
  'shadower-low': {
      "className": "Shadower",
      "baseStats": {
          "STR": 26,
          "DEX": 46,
          "INT": 4,
          "LUK": 765
      },
      "gearStats": {
          "STR": 55,
          "DEX": 100,
          "INT": 0,
          "LUK": 87
      },
      "totalWeaponAttack": 189,
      "weaponType": "Dagger",
      "weaponSpeed": 4,
      "attackPotion": 60,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": false
  },
  'marksman-high': {
      "className": "Marksman",
      "baseStats": {
          "STR": 4,
          "DEX": 999,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 79,
          "DEX": 177,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 203,
      "weaponType": "Crossbow",
      "weaponSpeed": 6,
      "attackPotion": 100,
      "projectile": 10,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'marksman-low': {
      "className": "Marksman",
      "baseStats": {
          "STR": 4,
          "DEX": 700,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 59,
          "DEX": 95,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 153,
      "weaponType": "Crossbow",
      "weaponSpeed": 6,
      "attackPotion": 60,
      "projectile": 10,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'archmage-il-high': {
      "className": "Archmage I/L",
      "baseStats": {
          "STR": 4,
          "DEX": 4,
          "INT": 999,
          "LUK": 23
      },
      "gearStats": {
          "STR": 0,
          "DEX": 0,
          "INT": 250,
          "LUK": 0
      },
      "totalWeaponAttack": 145,
      "weaponType": "Staff",
      "weaponSpeed": 6,
      "attackPotion": 220,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": false,
      "sharpEyes": true
  },
  'archmage-il-low': {
      "className": "Archmage I/L",
      "baseStats": {
          "STR": 4,
          "DEX": 4,
          "INT": 700,
          "LUK": 23
      },
      "gearStats": {
          "STR": 0,
          "DEX": 0,
          "INT": 135,
          "LUK": 0
      },
      "totalWeaponAttack": 100,
      "weaponType": "Staff",
      "weaponSpeed": 6,
      "attackPotion": 45,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": false,
      "sharpEyes": true
  },
  'archmage-fp-high': {
      "className": "Archmage F/P",
      "baseStats": {
          "STR": 4,
          "DEX": 4,
          "INT": 999,
          "LUK": 23
      },
      "gearStats": {
          "STR": 0,
          "DEX": 0,
          "INT": 250,
          "LUK": 0
      },
      "totalWeaponAttack": 145,
      "weaponType": "Staff",
      "weaponSpeed": 6,
      "attackPotion": 220,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": false,
      "sharpEyes": true
  },
  'archmage-fp-low': {
      "className": "Archmage F/P",
      "baseStats": {
          "STR": 4,
          "DEX": 4,
          "INT": 700,
          "LUK": 23
      },
      "gearStats": {
          "STR": 0,
          "DEX": 0,
          "INT": 135,
          "LUK": 0
      },
      "totalWeaponAttack": 100,
      "weaponType": "Staff",
      "weaponSpeed": 6,
      "attackPotion": 45,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": false,
      "sharpEyes": true
  },
  'bishop-high': {
      "className": "Bishop",
      "baseStats": {
          "STR": 4,
          "DEX": 4,
          "INT": 999,
          "LUK": 23
      },
      "gearStats": {
          "STR": 0,
          "DEX": 0,
          "INT": 250,
          "LUK": 0
      },
      "totalWeaponAttack": 145,
      "weaponType": "Staff",
      "weaponSpeed": 6,
      "attackPotion": 220,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": false,
      "sharpEyes": true
  },
  'bishop-low': {
      "className": "Bishop",
      "baseStats": {
          "STR": 4,
          "DEX": 4,
          "INT": 700,
          "LUK": 23
      },
      "gearStats": {
          "STR": 0,
          "DEX": 0,
          "INT": 135,
          "LUK": 0
      },
      "totalWeaponAttack": 100,
      "weaponType": "Staff",
      "weaponSpeed": 6,
      "attackPotion": 45,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": false,
      "sharpEyes": true
  },
  'bowmaster-high': {
      "className": "Bowmaster",
      "baseStats": {
          "STR": 4,
          "DEX": 999,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 79,
          "DEX": 177,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 198,
      "weaponType": "Bow",
      "weaponSpeed": 6,
      "attackPotion": 100,
      "projectile": 10,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'bowmaster-low': {
      "className": "Bowmaster",
      "baseStats": {
          "STR": 4,
          "DEX": 700,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 59,
          "DEX": 95,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 148,
      "weaponType": "Bow",
      "weaponSpeed": 6,
      "attackPotion": 60,
      "projectile": 10,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true
  },
  'sair-high': {
      "className": "Corsair",
      "baseStats": {
          "STR": 4,
          "DEX": 999,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 72,
          "DEX": 184,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 172,
      "weaponType": "Gun",
      "weaponSpeed": 5,
      "attackPotion": 100,
      "projectile": 20,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": false
  },
  'sair-low': {
      "className": "Corsair",
      "baseStats": {
          "STR": 4,
          "DEX": 700,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 68,
          "DEX": 99,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 140,
      "weaponType": "Gun",
      "weaponSpeed": 5,
      "attackPotion": 60,
      "projectile": 20,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": false
  },
  'bucc-high': {
      "className": "Buccaneer",
      "baseStats": {
          "STR": 999,
          "DEX": 23,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 152,
          "DEX": 116,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 176,
      "weaponType": "Knuckle",
      "weaponSpeed": 6,
      "attackPotion": 100,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": false
  },
  'bucc-low': {
      "className": "Buccaneer",
      "baseStats": {
          "STR": 700,
          "DEX": 22,
          "INT": 4,
          "LUK": 4
      },
      "gearStats": {
          "STR": 96,
          "DEX": 77,
          "INT": 0,
          "LUK": 0
      },
      "totalWeaponAttack": 137,
      "weaponType": "Knuckle",
      "weaponSpeed": 6,
      "attackPotion": 60,
      "projectile": 0,
      "echoActive": true,
      "mwLevel": 20,
      "speedInfusion": true,
      "sharpEyes": true,
      "shadowPartner": false
  },
};
