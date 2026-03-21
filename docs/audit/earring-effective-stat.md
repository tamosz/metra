# Earring Effective Stat Audit

Audit of earring stats across all 56 gear templates (14 classes x 4 tiers).

**Methodology:** effective stat = primary x 4 + secondary, using the standard damage formula weight. MATK tracked separately since it acts as a multiplier (like WATK), not an additive stat.

## Low Tier

| Class | Earring Stats | Raw Total | Effective (4x pri + sec) |
|-------|--------------|-----------|--------------------------|
| Dark Knight | DEX 5 | 5 | **5** |
| Hero / Paladin / Bucc | DEX 12 | 12 | **12** |
| Shadower | LUK 3, DEX 10, STR 4 | 17 | **26** |
| Bowmaster / Marksman | DEX 9, STR 5 | 14 | **41** |
| Corsair | DEX 10, STR 3 | 13 | **43** |
| Night Lord | LUK 10, DEX 10 | 20 | **50** |
| Mages (all 3) | INT 12, LUK 6, MATK 3 | 21 | **54** + 3 MATK |

Spread: 5 to 54 (10.8x range across classes at the same funding tier).

## Mid Tier

| Class | Earring Stats | Raw Total | Effective |
|-------|--------------|-----------|-----------|
| Warriors (all) | STR 3, DEX 2 | 5 | **14** |
| Shadower | LUK 1, DEX 12, STR 1 | 14 | **17** |
| Bucc | STR 5, DEX 5 | 10 | **25** |
| Night Lord | LUK 7, DEX 11 | 18 | **39** |
| Corsair | DEX 12, STR 2 | 14 | **50** |
| Bowmaster / Marksman | DEX 12, STR 3 | 15 | **51** |
| Mages (all 3) | INT 16, LUK 6, MATK 4 | 26 | **70** + 4 MATK |

Spread: 14 to 70 (5x range).

## High Tier

| Class | Earring Stats | Raw Total | Effective |
|-------|--------------|-----------|-----------|
| Shadower | LUK 2, DEX 15, STR 2 | 19 | **25** |
| Warriors (all) | STR 8 | 8 | **32** |
| Night Lord | LUK 9, DEX 12 | 21 | **48** |
| Corsair / Bowmaster / Marksman | DEX 12, STR 4 | 16 | **52** |
| Bucc | STR 15 | 15 | **60** |
| Mages (all 3) | INT 20, LUK 6, MATK 5 | 31 | **86** + 5 MATK |

Spread: 25 to 86 (3.4x range).

## Perfect Tier

| Class | Earring Stats | Raw Total | Effective |
|-------|--------------|-----------|-----------|
| Mages (all 3) | INT 28, MATK 43 | 71 | **112** + **43 MATK** |
| All physical | pri 28, sec 7 | 35 | **119** |

Physical classes converge to 119. Mages get 112 effective stat plus 43 MATK.

## Flagged Issues

### 1. Mage earrings are overbudgeted at every tier

Mages consistently get the highest effective stat earring at every tier, and on top of that they get MATK (3/4/5/43) which no physical class gets as WATK. At perfect tier the earring provides 43 MATK — roughly equivalent to a second weapon's worth of attack.

### 2. Warrior earrings are underbudgeted at low/mid

- DK low (5 effective) is the worst earring in the dataset. Other warriors get 12.
- All warriors at mid (14 effective) are the lowest of any class. The mid earring has fewer raw stat points (5) than the low earring (12).

### 3. Night Lord low earring is 4x warrior earring

LUK 10 + DEX 10 = 50 effective, vs hero's DEX 12 = 12 effective at the same tier. 20 raw stat points in two useful stats vs 12 in secondary-only.

### 4. Bucc high earring is nearly double warrior high

STR 15 = 60 effective, vs warrior STR 8 = 32 effective. Same primary/secondary stat mapping, so this directly inflates Bucc's relative position.

### 5. Shadower earrings are underbudgeted vs Night Lord

Both thieves, but Shadower earrings give dramatically less effective stat: 26 vs 50 at low, 17 vs 39 at mid, 25 vs 48 at high. Shadower LUK (primary) is consistently very low (1-3) while DEX (secondary) is high — the ratio is inverted.

### 6. Warrior mid earring has fewer raw stats than low

The mid earring (STR 3 + DEX 2 = 5 raw) has less total stat than the low earring (DEX 12). This is the only class where mid-tier earring is strictly worse in raw terms than low-tier.
