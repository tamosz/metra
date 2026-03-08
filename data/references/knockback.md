# Knockback Mechanics

Research for the knockback DPS model. Boss attacks interrupt attacking, and
recovery time varies by skill type and KB resistance.

## KB Recovery Times

**Source:** Community timing estimates, royals.ms forum guides, Ayumilove attack speed reference
**Accessed:** 2026-03-02
**Used in:** `src/engine/knockback.ts`

No exact server-side timings exist — KB recovery is driven by client animation.
Estimates based on gameplay observation:

| Skill Type | Recovery Time | Notes |
|------------|--------------|-------|
| Burst/normal skills | ~0.6s | Blink animation + minor reposition |
| Channeled (Hurricane) | ~1.0s | Landing + reposition + 300ms channel restart |
| Channeled (Rapid Fire) | ~0.5s | Can fire mid-air unlike Hurricane |
| I-frame skills (Demolition, Barrage) | 0s | Intangible during animation |

Hurricane has a ~300ms startup delay before the first arrow fires, and cannot
fire while airborne. Rapid Fire can fire mid-air.

**Source:** [Hurricane airborne behavior](https://royals.ms/forum/threads/hurricane-should-be-able-to-do-this.241994/)

## KB Resistance by Class

**Source:** [Comprehensive List of Changes](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/), [Class Skill Changes](https://royals.ms/forum/threads/class-skill-changes.196513/)
**Accessed:** 2026-03-02
**Used in:** `data/skills/*.json`

| Class | Defense | Rate | Source |
|-------|---------|------|--------|
| Hero / Dark Knight / Paladin | Power Stance | 90% | Standard v62, no Royals changes |
| Buccaneer | Energy Charge stance | 90% | Update #50 (30% → 90% at lv40) |
| Night Lord | Shadow Shifter | 30% | Settled at 30% (was 20%, briefly 40%) |
| Shadower | Shadow Shifter | 40% | Royals buff (base 20% → 40%) |
| Bowmaster / Marksman | None | 0% | — |
| Corsair | None | 0% | Battleship has no stance |
| Mages | None | 0% | — |

Power Stance and Shadow Shifter are independent checks: Stance prevents KB,
Shadow Shifter dodges the hit entirely.

**Source:** [Power Stance thread](https://royals.ms/forum/threads/make-power-stance-100.175343/)

## I-Frame Skills

**Source:** [I-frames thread](https://royals.ms/forum/threads/i-frames.158736/)
**Accessed:** 2026-03-02
**Used in:** `data/skills/bucc.json`

Buccaneer-only among implemented classes:
- **Demolition**: i-frames throughout animation
- **Barrage**: i-frames throughout animation
- **Barrage + Demolition combo**: continuous i-frames when skills chain without gap

Modeled as `knockbackRecovery: 0` on these skills.

## Boss Attack Intervals

**Accessed:** 2026-03-02
**Used in:** `src/scenarios.ts`

Boss AI uses cooldown-based skill systems, not fixed intervals. Average
attack frequency varies by boss:

| Boss | Estimated Interval | Notes |
|------|-------------------|-------|
| Zakum | ~1-2s | Multiple arms attack independently |
| Horntail | ~1.5-2s | Multiple body parts, touch damage |
| Auf Haven | ~1-2s | Frequent magic + physical attacks |

For modeling: **1.5s** as representative interval for endgame bossing.
"This boss probably hits you about 1000 times or even more" — forum
estimate for a full HT run on melee characters.

**Source:** [Common Big Bosses Info](https://royals.ms/forum/threads/common-big-bosses-info-how-much-hp-to-tank.129971/), [Power Stance thread](https://royals.ms/forum/threads/make-power-stance-100.175343/)

## Boss Accuracy

**Source:** MapleLegends monster library (v83 reference, closest available)
**Accessed:** 2026-03-02
**Used in:** `src/scenarios.ts`

| Boss | Level | Accuracy |
|------|-------|----------|
| Zakum (body) | 140 | 250 |
| HT (heads) | 160 | 250 |
| Auf Haven | 180 | 270 |

At accuracy 250, dodge chance from avoidability is negligible for all classes.

## Avoidability Formula (Monster → Player)

**Source:** [SouthPerry All Known Formulas](https://www.southperry.net/showthread.php?t=31480)
**Accessed:** 2026-03-02

```
dodgeRate = floor(sqrt(playerAvoid)) - floor(sqrt(monsterAccuracy))
if monsterLevel > playerLevel:
    dodgeRate -= 5 * (monsterLevel - playerLevel)
dodgeRate = max(dodgeRate, 0)
```

At boss accuracy 250: `sqrt(250) ≈ 15.8`, so `floor(sqrt(playerAvoid))`
would need to exceed 15 just to get 1% dodge. Most physical classes have
negligible avoidability at boss level → dodge ≈ 0%.

## Battleship KB Interaction

**Source:** [Corsairs' Battleship](https://royals.ms/forum/threads/corsairs-battleship.112382/), [Comprehensive Corsair Guide](https://royals.ms/forum/threads/a-comprehensive-corsair-guide.122934/)
**Accessed:** 2026-03-02

Battleship has NO stance/KB resistance. Corsair in Battleship mode gets
knocked back like any unprotected class. Additionally, the ship takes
damage from boss attacks and can be destroyed (90s cooldown to remount).

Not modeled: ship destruction downtime (would require additional mechanics).

## Model Constants

Based on the above research:

```
DEFAULT_KB_RECOVERY  = 0.6   // burst skill recovery (seconds)
CHANNEL_KB_RECOVERY  = 1.0   // channeled skill recovery (seconds)
BOSS_ATTACK_INTERVAL = 1.5   // representative endgame boss (seconds)
BOSS_ACCURACY        = 250   // representative endgame boss accuracy
```

### Expected DPS Loss (at default boss settings)

| Class | Defense | Burst Loss | Channel Loss |
|-------|---------|-----------|-------------|
| Warriors (90% stance) | ~4% | — |
| Bucc Demolition (i-frame) | ~0% | — |
| Shadower (40% shifter) | ~24% | — |
| Night Lord (30% shifter) | ~28% | — |
| Archers (no defense) | ~40% | ~67% |
| Corsair (no defense) | ~40% | ~67% |
| Mages (no defense) | ~40% | — |
