<!-- from https://ayumilovemaple.wordpress.com/2009/09/06/maplestory-formula-compilation/ -->

General Formula
MAX = (Primary Stat + Secondary Stat) _ Weapon Attack / 100
MIN = (Primary Stat _ 0.9 _ Skill Mastery + Secondary Stat) _ Weapon Attack / 100

Stats and Multipliers:

One Handed Sword
Primary: STR \* 4.0
Secondary: DEX

One Handed Axe/BW/Wand/Staff (Swinging)
Primary: STR \* 4.4
Secondary: DEX

One Handed Axe/BW/Wand/Staff (Stabbing)
Primary: STR \* 3.2
Secondary: DEX

Two Handed Sword
Primary: STR \* 4.6
Secondary: DEX

Two Handed Axe/BW (Swinging)
Primary: STR \* 4.8
Secondary: DEX

Two Handed Axe/BW (Stabbing)
Primary: STR \* 3.4
Secondary: DEX

Spear (Swinging)
Primary: STR \* 3.0
Secondary: DEX

Spear (Stabbing)
Primary: STR \* 5.0
Secondary: DEX

Polearm (Swinging)
Primary: STR \* 5.0
Secondary: DEX

Polearm (Stabbing)
Primary: STR \* 3.0
Secondary: DEX

Dagger (Non-Thieves)
Primary: STR \* 4.0
Secondary: DEX

Dagger/Throwing Stars (Thieves)
Primary: LUK \* 3.6
Secondary: STR + DEX

Bow
Primary: DEX \* 3.4
Secondary: STR

Crossbow
Primary: DEX \* 3.6
Secondary: STR

Knuckle
Primary: STR \* 4.8
Secondary: DEX

Gun
Primary: DEX \* 3.6
Secondary: STR



<!-- most of the below is probably not relevant -->
Spell Damage:
MAX = ((Magic²/1000 + Magic)/30 + INT/200) * Spell Attack
MIN = ((Magic²/1000 + Magic * Mastery * 0.9)/30 + INT/200) * Spell Attack
 
Lucky Seven/Triple Throw (credit to HS.net / LazyBui for recent verification):
MAX = (LUK * 5.0) * Weapon Attack / 100
MIN = (LUK * 2.5) * Weapon Attack / 100
 
Venom (damage per second, credit to Joe Tang):
MAX = (18.5 * [STR + LUK] + DEX * 2) / 100 * Basic Attack
MIN = (8.0 * [STR + LUK] + DEX * 2) / 100 * Basic Attack
 
Ninja Ambush (credit to Fiel):
Damage per second tick = 2 * [STR + LUK] * Skill Damage Percentage
 
Shadow Web (credit to LazyBui):
Damage per 3-sec tick = Monster HP / (50 - Skill Level)
 
Shadow Meso:
Damage = 10 * Number of mesos thrown (in skill description)
Normal critical does not apply, instead it has its own built-in critical listed in skill description
 
Assaulter ignores defense if at or above the monster’s level
 
Dragon Roar (credit to Stereo):
MAX = (STR * 4.0 + DEX) * Weapon Attack / 100
MIN = (STR * 4.0 * Skill Mastery * 0.9 + DEX) * Weapon Attack / 100
 
Power Knock Back (both weapons, credit to AGF/Fiel):
MAX = (DEX * 3.4 + STR) * Weapon Attack / 150
MIN = (DEX * 3.4 * Mastery * 0.9 + STR) * Weapon Attack / 150
Mastery is 0.1 at all levels
 
Claw (punching):
MAX = (LUK * 1.0 + STR + DEX) * Weapon Attack / 150
MIN = (LUK * 0.1 + STR + DEX) * Weapon Attack / 150
 
Blank Shot:
Speculated to be calculated without bullet attack or Gun Mastery
 
Bare Hands:
MAX = (STR * J + DEX) * Weapon Attack / 100
MIN = (STR * J * 0.1 * 0.9 + DEX) * Weapon Attack / 100
ATT equals floor((2*level+31)/3) and is capped at 31.
J equals 3.0 for Pirates and 4.2 for all 2nd+ job Pirates.
 
Flamethrower (credit to blitzkrieg):
Damage per second tick: Damage of initial hit * (5% + Amp Bullet Damage %)
 
Heal Damage (credit to Russt//Devil's Sunrise for Target Multiplier function):
MAX = (INT * 1.2 + LUK) * Magic / 1000 * Target Multiplier
MIN = (INT * 0.3 + LUK) * Magic / 1000 * Target Multiplier
The % listed in the skill description (300% at max) acts as the skill percent (see Order of Operations above).
 
Heal Recovery
MAX = something * Magic * Heal Level * Target Multiplier
MIN = something * Magic * Heal Level * Target Multiplier
 
old formula (credit to Nekonecat):
MAX = (1.132682429*10^-7*luk^2 + 3.368846366*10^-6*luk + 1.97124794*10^-3) * magic * int * healSkillLevel * multiplier
MIN = MAX*0.8
 
Heal Target Multiplier: 1.5 + 5/(number of targets including yourself)
For reference-
1 - 6.5
2 - 4.0
3 - 3.166
4 - 2.75
5 - 2.5
6 - 2.333
 
Poison Brace/Poison Mist/Fire Demon/Ice Demon:
Damage per second tick = Monster HP / (70 - Skill Level)
 
Phoenix/Frostprey/Octopus/Gaviota (credit to Sybaris/KaidaTan):
MAX = (DEX * 2.5 + STR) * Attack Rate / 100
MIN = (DEX * 2.5 * 0.7 + STR) * Attack Rate / 100
Ignores defense