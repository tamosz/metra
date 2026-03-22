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
| Burst/normal skills | ~0.5s | KB animation + reposition |
| Channeled (Hurricane, Rapid Fire) | ~0.7s | Base recovery (0.5s) + channel restart wind-up (0.2s) |
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

## Avoidability Formula (Monster → Player)

**Source:** Client code extraction (iPippy, MapleLegends forum), confirmed on Royals by jamin
**Accessed:** 2026-03-22
**Forum threads:**
- [MapleLegends avoidability formula](https://forum.maplelegends.com/index.php?threads/maplelegends-avoidability-formula.26694/)
- [Royals avoidability question](https://royals.ms/forum/threads/avoidability-question.174715/)
- [HTP vs Avoidability Analysis](https://forum.maplelegends.com/index.php?threads/htp-vs-mon-avoidability-analysis.27333/)

### Dodge formula

Pre-BB formula for physical (touch) damage:

```
effectiveAvoid = avoid - max(0, monsterLevel - charLevel) / 2
dodgeRate = effectiveAvoid / (4.5 * monsterAccuracy)
```

Class-specific caps:
- Non-thieves: [2%, 80%]
- Thieves (NL, Shadower): [5%, 95%]

### Avoidability calculation

The `avoid` input to the dodge formula is computed from stats, not the character
window display stat:

```
avoid = 0.5 × totalLUK + 0.25 × totalDEX + equipmentAvoid
```

Where `totalStat = floor(baseStat × mwMultiplier) + gearStat`.

**Used in:** `packages/engine/src/knockback.ts` (`computeAvoidability`)

### Per-class avoidability (default endgame builds)

Computed at MW20 with standard gear budget. Equipment avoid ~30 for all classes
(Zhelm innate, shoes/cape/earring).

| Class | Avoid | Dodge @ ACC 250 | Key stat |
|-------|------:|----------------:|----------|
| Night Lord | ~785 | ~70% | LUK primary |
| Shadower | ~789 | ~70% | LUK primary |
| Bowmaster / Marksman | ~386 | ~34% | DEX primary |
| Warriors | ~80 | ~7% | Low LUK/DEX |
| Bucc / Corsair | ~80 | ~7% | Low LUK/DEX |
| Mages | ~117 | ~10% | Gear LUK from secondary |

Thief classes benefit most — their LUK primary gives 700+ avoid. Archers also
gain significantly from high DEX. Warriors and pirates see minimal impact.

**Previous incorrect formula:** The codebase previously used
`floor(sqrt(avoid)) - floor(sqrt(accuracy))` from SouthPerry's "[BB] All Known
Formulas" thread — this is a post-Big Bang formula, not applicable to
MapleRoyals (v62/pre-BB).

**Not yet modeled:** Magic attack dodge uses a different formula:
`magicDodge = 10/9 - accuracy / (0.9 * avoid)`.

**Possible refinement:** Pirate classes may use a different avoid formula
(Bucc: `0.225×STR + 0.25×DEX`, Corsair: `0.5×LUK + 0.125×DEX` per
MapleLegends analysis). Currently using the standard formula for all classes.
Impact is small since pirates have low relevant stats either way.

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
DEFAULT_KB_RECOVERY  = 0.5   // burst skill recovery (seconds)
CHANNEL_WIND_UP      = 0.2   // extra wind-up for channeled skills (seconds)
BOSS_ATTACK_INTERVAL = 1.5   // representative endgame boss (seconds)
BOSS_ACCURACY        = 250   // representative endgame boss accuracy
```

### Expected DPS Loss (at default boss settings)

Includes avoidability-based dodge. Dodge reduces the effective KB rate for
all classes, with the largest impact on thieves (70% dodge) and archers (34%).

| Class | Defense | Dodge | Burst Loss | Channel Loss |
|-------|---------|------:|-----------|-------------|
| Warriors (90% stance) | Power Stance | ~7% | ~3% | — |
| Bucc Barrage+Demo (i-frame) | i-frame + Stance | ~7% | ~0% | — |
| Shadower (40% shifter) | Shifter + dodge | ~70% | ~6% | — |
| Night Lord (30% shifter) | Shifter + dodge | ~70% | ~7% | — |
| Archers (no defense) | Dodge only | ~34% | ~22% | ~31% |
| Corsair (no defense) | Dodge only | ~7% | ~22% | ~22% |
| Mages (no defense) | Dodge only | ~10% | ~33% | — |
