# Simulator Standings Audit vs Community Consensus

**Date:** 2026-03-01
**Simulator version:** Current baseline (10 physical classes + 2 mage classes)
**Community sources:** royals.ms forums (Krexel DPS comparison, class tier list, general DPS ranking threads, Update #68 patch notes, class guides, Shadower 2026 guide, Feedback Request thread, Dream.ms class selection guide, MapleLegends DPM charts)

---

## 1. Simulator Top-Tier DPS Summary (Buffed, High Tier)

Best skill per class, fully buffed (MW20, SE, SI, Echo, Apple):

| Rank | Class | Skill | DPS | % of #1 |
|-----:|-------|-------|----:|--------:|
| 1 | Corsair | Battleship Cannon | 331,354 | 100.0% |
| 2 | Shadower | BStep + Assassinate 30 | 326,734 | 98.6% |
| 3 | NL | Triple Throw 30 | 292,314 | 88.2% |
| 4 | Hero (Axe) | Brandish | 257,772 | 77.8% |
| 5 | DrK | Spear Crusher / Fury | 251,906 | 76.0% |
| 6 | Hero (Sword) | Brandish | 247,314 | 74.6% |
| 7 | Buccaneer | Barrage + Demolition | 246,715 | 74.4% |
| 8 | Bowmaster | Hurricane | 233,073 | 70.3% |
| 9 | Corsair | Rapid Fire | 228,271 | 68.9% |
| 10 | Marksman | Snipe + Strafe | 222,521 | 67.1% |
| 11 | Bowmaster | Strafe | 206,551 | 62.3% |
| 12 | Paladin | Blast (Holy, Sword) | 192,932 | 58.2% |
| 13 | Archmage I/L | Chain Lightning | 82,189 | 24.8% |
| 14 | Bishop | Angel Ray | 45,111 | 13.6% |

---

## 2. Community Consensus Summary

### 2a. Krexel DPS Comparison (in-game testing, royals.ms forum)

The most empirical community data comes from the Krexel DPS comparison thread, where players submit timed DPS runs against Krexel:

| Rank | Class | DPS | Source |
|-----:|-------|----:|--------|
| 1 | Corsair (Sair) | 470,810 | Yanzi, range 6559-11838 |
| 2 | Night Lord (NL) | 428,082 | Xves, range 6821-12062 |

**Key insight:** Corsair > NL by ~10% in actual Krexel testing. Our simulator shows Corsair > NL by ~13.4%. Directionally consistent, though our gap is slightly wider.

**Krexel caveat:** Krexel rarely attacks, so Corsair's Battleship is almost never threatened — inflating Corsair's relative performance. At bosses like Horntail that attack heavily, Corsairs lose significant DPS when the ship breaks. Real-world DPS estimates suggest Corsair achieves ~55% of theoretical DPM at active bosses vs NL's ~80%.

### 2b. Community DPS Tier Consensus (composite from multiple forum threads)

| Tier | Classes | Community Notes |
|------|---------|----------------|
| **S-tier** | NL, Corsair, Shadower | NL = king with SE; Corsair = highest raw ceiling but ship-dependent; Shadower = "most meta job in recent years" (2026 guide by Donn1e) |
| **A-tier** | Hero, Bowmaster | Hero = best warrior cleave + versatile; BM = consistent Hurricane DPS + SE provider |
| **B-tier** | DrK, Marksman, Buccaneer | DrK = valued for HB; MM = Snipe true damage shines at low funding + vs PDR; Bucc = buffed but still mid |
| **C-tier** | Paladin | Lowest warrior DPS, compensated by survivability and elemental utility |
| **D-tier** | Archmage I/L, Bishop | "Relegated to leeching"; "no incentive to scroll endgame INT gear"; community has called for Arch Mage bossing buffs |

**Solo Bossing (no party buffs):**
1. Corsair (Battleship) - highest solo DPS *if ship stays up*
2. Bowmaster (Hurricane) / Night Lord (Triple Throw) - competitive
3. Shadower (BStep + Assassinate) - strong, with survivability advantage
4. Warriors (Hero > DrK > Paladin)

**Party Bossing (with SE + SI + Apple):**
1. Night Lord - benefits most from SE + Apple combo
2. Corsair - strong with or without party buffs (~5% gain from SI/SE)
3. Bowmaster - high DPS + provides SE
4. Shadower - strong DPS, tanky, meso utility; BStep+Assass combo + Shadow Partner
5. Warriors (Hero / DrK competitive, Paladin lower DPS but utility)
6. Mages - lowest DPS but essential utility (HS, Heal, Dispel)

### 2c. Royals-Specific Balance Changes (verified)

These server-specific changes affect our simulation:
- **DrK Berserk**: Buffed from 200% to 210% in Update #68 (Oct 2020). Our simulator uses 2.1x multiplier. **Correctly modeled.**
- **Shadower Assassinate**: Base power boosted from 600 to 950 (removed charge mechanic). Our simulator uses 950. **Correctly modeled.**
- **Shadower BStep**: Boosted from 500 to 600. Our simulator uses 600. **Correctly modeled.**
- **Bucc Barrage + Demolition**: Buffed to be "in line with 130k-250k DPS targets." Our simulator shows 247k at high tier. **Within target range.**
- **Marksman Snipe**: Can now ignore weapon cancel on bosses (Update #68). Not yet relevant to our DPS model (we don't model weapon cancel).

### 2d. Royals Balance Philosophy

Official staff position: most classes with equivalent funding should range between **130k DPS at level 140** and **250k DPS at level 200**. Our high-tier physical DPS ranges from 192k (Paladin) to 331k (Corsair), suggesting the top end may exceed their target or that the target has evolved since 2019.

---

## 3. Areas of Agreement

### Corsair #1 in Buffed DPS
**Verdict: MATCHES (with caveat)**

Our simulator places Corsair Battleship Cannon at #1 (331k). Community Krexel data also shows Corsair at #1 (471k). The relative ordering is consistent. Corsair's 4-hit Battleship Cannon at 0.60s attack time with 380 base power and 1.2x multiplier produces extremely high throughput.

**Caveat:** Our simulator models theoretical DPS (100% Battleship uptime). Community notes that real-world Corsair DPS drops significantly at bosses that attack the ship (Horntail, Zakum). A community thread proposes equalizing Rapid Fire and Battleship Cannon DPS to reduce ship-uptime dependency. At active bosses, NL likely overtakes Corsair. This is a known limitation of theoretical DPS models, not a simulator bug.

### NL in Top 3
**Verdict: MATCHES**

NL at #3 (292k) is consistent with community perception of NL being top-tier. The ~12% gap below Corsair matches the Krexel data (~10% gap). NL is widely recognized as the premier bossing class, especially when SE is active.

### Warrior Hierarchy (Hero ~ DrK > Paladin)
**Verdict: BROADLY MATCHES**

Our simulator shows Hero (Axe) > DrK > Hero (Sword) > Paladin. Community views Hero and DrK as roughly comparable. Some community members call DrK "an upgraded Hero in the current meta" (Von Leon tier list), while others note Hero has better versatility. The Axe vs Sword distinction is a nuance most community discussions don't address. Paladin is universally recognized as the lowest warrior DPS.

### Paladin Lowest Warrior DPS
**Verdict: MATCHES**

Paladin Blast (Holy, Sword) at 193k is 22% below Hero Sword (247k). Community consistently identifies Paladin as having the weakest warrior DPS, compensated by survivability and party utility (CWA removal, elemental advantage).

### DrK Competitive with Hero
**Verdict: MATCHES**

DrK at 252k vs Hero Sword at 247k (2% gap) reflects the community view that these classes are roughly equal in DPS, with DrK's Berserk compensating for lower weapon multipliers.

### Shadower #2 in Buffed DPS
**Verdict: MATCHES (recent meta shift)**

Our simulator places Shadower BStep+Assassinate at #2 (327k). A 2026 community guide explicitly calls Shadower "the most meta job in recent years." The Assassinate base power was boosted to 950 (from 600) on Royals, and BStep was boosted to 600 (from 500). Combined with Shadow Partner (1.5x), a 2.31s combo cycle, and Dagger 3.6x multiplier, Shadower's theoretical DPS is very high. Community DPS optimization discoveries (Aug 2024) have further validated Shadower's top-tier position.

### Buccaneer Mid-Pack After Buffs
**Verdict: MATCHES**

Bucc Barrage+DS at 244k sits between DrK and Corsair. Community noted Bucc was intentionally buffed to be competitive, and our number (244k) falls within the stated 130k-250k server target range. Community guides note animation cancel can add ~15% DPS, which our model doesn't capture (it uses fixed cycle times). This may mean real-world Bucc DPS is slightly higher than modeled.

---

## 4. Areas of Disagreement / Investigation Required

### INVESTIGATE-4: Mage DPS Gap vs Physical Classes

**Severity: MEDIUM**
**Simulator:** Archmage I/L Chain Lightning at 82k (24.8% of Corsair), Bishop Angel Ray at 45k (13.6% of Corsair).
**Audit flags:** Bishop Genesis and Angel Ray at -1.9σ to -2.1σ across all scenarios. Archmage Blizzard at -1.5σ to -1.9σ.

**Context:** Mage DPS is expected to be significantly lower than physical classes in v62 Royals. Community explicitly confirms this: "no incentive to scroll endgame INT gear," "relegated to leeching," and "no one will take them to bosses because they are only seen as leech slaves." Multiple community threads have called for Arch Mage bossing buffs. The 4:1 gap (I/L vs Corsair) and 7:1 gap (Bishop vs Corsair) may be accurate but still warrant formula verification.

**Possible causes:**
1. **Magic damage formula correctness**: Verify the magic damage formula matches Royals implementation. Magic damage in v62 is: `(INT * spellAmplification * weaponAmplification * magicAttack / 100) * skillPower`.
2. **Bishop has no amplification**: Spell amp 1.0 and weapon amp 1.0 (vs I/L's 1.4 and 1.25). This 1.75x disadvantage is huge. Verify this matches in-game.
3. **MATK values**: Bishop/I-L use Lollipop (45 MATK) at low/mid vs physical classes using Heartstopper (60 WATK). Verify mage MATK totals.
4. **Missing mechanics**: Are there mage-specific buffs or mechanics we're not modeling (e.g., Meditation, Spell Booster effects)?

**Self-contained investigation task:**
- Verify magic damage formula against Royals damage calculator and source spreadsheet
- Cross-check mage gear template MATK totals against community guides
- Verify Bishop's 1.0/1.0 amplification values (is there a skill that provides amplification we're missing?)
- Compare our mage DPS numbers against the "damage calculator - all classes" spreadsheet referenced on royals.ms
- Note: mage DPS being lower is expected — the question is whether the magnitude is correct

### INVESTIGATE-5: Hero Axe vs Hero Sword Gap

**Severity: LOW**
**Simulator:** Hero (Axe) Brandish at 258k vs Hero (Sword) Brandish at 247k (+4.2% for Axe).

**Analysis:** Both use the same base power (260), multiplier (1.9), and hit count (2). The difference comes from weapon multiplier: 2H Axe 4.8x vs 2H Sword 4.6x (+4.3%). With SI active, both resolve to the same effective speed (speed 2). The DPS difference is entirely from the weapon multiplier.

**Community view:** Most community discussions don't distinguish Axe vs Sword Hero. The gear assumptions doc confirms 4.8 for 2H Axe is the correct v62 baseline (verified against StrategyWiki, Ayumilove, Royals Wiki).

**Questions to resolve:**
1. Does the 4.2% Axe advantage match community/spreadsheet expectations?
2. Are there any trade-offs (weapon availability, scrolling options) that would narrow the real-world gap?
3. Is 4.8x for 2H Axe confirmed on Royals specifically (not just generic v62)?

**Self-contained investigation task:**
- Verify Hero Axe and Sword DPS match source spreadsheet values
- Check if the Axe advantage is consistent across tiers
- Confirm 2H Axe 4.8x multiplier is Royals-verified (the gear assumptions doc says it is, citing community member Zerato)

### INVESTIGATE-6: Marksman Snipe + Strafe Rotation Modeling — RESOLVED

**Severity: LOW-MEDIUM**
**Simulator:** MM Snipe+Strafe at 223k vs standalone Strafe at 218k (+1.9% gain from weaving Snipe at high tier).

**Verdict: Model is correct. The small gain at high tier is expected.**

The royals.ms [DPS charts thread](https://royals.ms/forum/threads/dps-charts.124709/) independently derives the same rotation our model uses:
- 7 Strafes per Snipe cycle at speed 2 (with SI)
- 1:7 Snipe:Strafe ratio
- `total_dps = snipe_dps * 1/8 + strafe_dps * 7/8`

Community quote: *"strafe and snipe takes 0.63 to animate, thus, it will take 7 strafes (0.63*7 = 4.41 seconds) before another snipe can be used"*

**Why the gain is small at high tier:** At high funding, Strafe averages ~131k per hit (0.60s). Weaving Snipe replaces ~1.33 Strafes with one 195k Snipe:
- Lost: 1.33 × 131k = ~174k damage
- Gained: 195k damage
- Net: +21k per 5s cycle = +4.1k DPS = **+1.9%**

At low funding, Strafe averages ~59k, so the trade is much more favorable:
- Lost: 1.33 × 59k = ~78k
- Gained: 195k
- Net: +117k per 5s cycle = +23.3k DPS = **+23.7%**

This tier sensitivity is already captured in the statistical audit (1.32x high/low ratio vs 1.77x median) — Snipe's fixed 195k doesn't scale with gear, so its relative contribution shrinks at higher funding.

**Minor note:** The community thread uses 0.63s Strafe animation vs our 0.60s (from the source spreadsheet). This ~0.8% difference in rotation DPS is negligible; we follow the spreadsheet.

---

## 5. Statistical Audit Summary

### Outliers (from automated audit, >1.5 sigma)

| Class | Skill | Direction | Strongest Scenario | Peak Deviation |
|-------|-------|-----------|--------------------|---------------|
| Shadower | BStep + Assassinate 30 | HIGH | Unbuffed (all tiers) | +2.6σ |
| Bishop | Genesis | LOW | Buffed/Bossing/No-Echo (all tiers) | -2.1σ |
| Corsair | Battleship Cannon | HIGH | Low tier (all scenarios) | +2.0σ |
| Bishop | Angel Ray | LOW | All scenarios, High tier | -2.0σ |
| Archmage I/L | Blizzard | LOW | All scenarios (all tiers) | -1.9σ |
| Archmage I/L | Chain Lightning | LOW | Buffed/No-Echo, High tier | -1.5σ |

### Tier Sensitivity Outliers

| Class | Skill | High/Low Ratio | Median | Note |
|-------|-------|:--------------:|:------:|------|
| Marksman | Snipe + Strafe (Unbuffed) | 1.32x | 1.77x | Snipe's fixed 195k damage doesn't scale with gear |
| Corsair | All skills | 1.63x | 1.94x | Battleship Cannon's high base makes it less gear-dependent |
| Shadower | All skills | 1.65x | 1.94x | Likely related to LUK scaling + Dagger multiplier |

### DPS Spread by Tier (Buffed Scenario)

| Tier | Min DPS | Max DPS | Spread | Observation |
|------|--------:|--------:|:------:|-------------|
| Low | 18,299 | 202,986 | 11.1x | Huge gap driven by mages vs Corsair |
| Mid | 25,465 | 243,215 | 9.6x | Narrows slightly at mid funding |
| High | 35,830 | 331,354 | 9.3x | Still very wide; mages are the floor |

**Note:** If mages are excluded, the physical-only spread narrows to:
- Low: 85,447 to 202,986 (2.4x)
- Mid: 112,455 to 243,215 (2.2x)
- High: 165,838 to 331,354 (2.0x)

This 2.0-2.4x spread among physical classes is more reasonable but still wider than the server's stated 130k-250k target range.

---

## 6. Investigation Task Summary

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| INVESTIGATE-4 | Mage DPS gap vs physical classes (magnitude verification) | MEDIUM | Open |
| INVESTIGATE-5 | Hero Axe vs Sword gap verification | LOW | Open |
| INVESTIGATE-6 | Marksman Snipe+Strafe rotation modeling | LOW-MEDIUM | **Resolved** — model correct, small gain expected at high tier |

### Prioritized Next Steps

1. **INVESTIGATE-4 (Mage DPS)** — Verify the magnitude is correct before drawing balance conclusions about mages.
2. **INVESTIGATE-6 (MM Snipe rotation)** — The small Snipe gain is counterintuitive and worth verifying.
3. **INVESTIGATE-5 (Hero Axe vs Sword)** — Lowest priority; the gap is small and well-explained by weapon multiplier.

---

## 7. Community Source References

- [Krex Class DPS comparison](https://royals.ms/forum/threads/krex-class-dps-comparison.224575/) — In-game DPS testing at Krexel
- [General consensus on DPS ranking](https://royals.ms/forum/threads/general-consensus-on-dps-ranking.146711/) — Community discussion on class rankings
- [2024 DPS class rankings](https://royals.ms/forum/threads/2024-dps-class-rankings.233570/) — Recent ranking discussion
- [Royals Class Tier List](https://royals.ms/forum/threads/mapleroyals-class-tier-list.151600/) — Community tier list (4 pages)
- [DPS charts](https://royals.ms/forum/threads/dps-charts.124709/) — Community-plotted DPS graphs with CSV data
- [Damage calculator - All classes](https://royals.ms/forum/threads/damage-calculator-all-classes.123479/) — Source spreadsheet for all-class DPS
- [Update #68 class buffs](https://royals.ms/forum/threads/update-68-class-buffs.176455/) — DrK Berserk 200% → 210%, MM Snipe ignores weapon cancel
- [Update #68 patch notes](https://mapleroyals.com/forum/threads/update-68-20-10-2020.176133/) — Official patch notes
- [Pirate King - Krexel DPS tests (Bucc and Sair)](https://royals.ms/forum/threads/pirate-king-krexels-2nd-eye-dps-tests-bucc-and-sair.145069/) — Pirate class DPS at Krexel
- [NL or Shadower? Bossing and DPS](https://royals.ms/forum/threads/nl-or-shadower-what%E2%80%99s-good-for-bossing-and-dps-wise.137287/) — NL vs Shadower community comparison
- [How good is Paladin post buff?](https://royals.ms/forum/threads/how-good-is-paladin-post-buff.116208/) — Paladin viability discussion
- [Feedback Request: Skill Changes and Balancing](https://royals.ms/forum/threads/feedback-request-skill-changes-and-balancing.205730/) — Official balance feedback thread
- [Comprehensive list of changes since new source](https://royals.ms/forum/threads/comprehensive-list-of-changes-since-the-new-source.183746/) — All Royals-specific changes
- [Dream.ms Class Selection Guide](https://forum.dream.ms/threads/class-selection-guide-i-e-which-class-should-i-play.4793/) — Detailed class comparison from a similar v62 server
- [Conspiracy's Corsair Guide (Dream.ms)](https://forum.dream.ms/threads/conspiracys-corsair-guide-2022.5065/) — Corsair ranked #2 single-target DPS
- [A Guide to Shadower 2026](https://royals.ms/forum/threads/a-guide-to-shadower-2026.252048/) — Donn1e's guide calling Shadower "the most meta job in recent years"
- [How to Maximize Shadower's Single Target DPS](https://royals.ms/forum/threads/how-to-maximize-shadowers-single-target-dps.236808/) — DPS optimization discoveries (Aug 2024)
- [Set Same DPS Between Rapid Fire and Battleship Cannon](https://royals.ms/forum/threads/set-same-dps-between-rapid-fire-and-battleship-cannon.238781/) — Community proposal to reduce Corsair ship dependency
- [Krexel's 2nd Eye DPS Thread](https://royals.ms/forum/threads/krexels-2nd-eye-dps-thread.177083/) — Normalized DPS data (Apple+Echo) by Geyforlife
- [Von Leon Class Tier List](https://royals.ms/forum/threads/von-leon-class-tier-list.216998/) — Boss-specific tier rankings
- [Make Archmages Viable in Bossing](https://mapleroyals.com/forum/threads/make-archmages-viable-in-bossing.157099/) — Community call for mage bossing buffs
- [Re-balance Arch Mages](https://mapleroyals.com/forum/threads/re-balance-arch-mages.188366/) — "No incentive to scroll endgame INT gear"
- [Arch Mage Content Buff](https://royals.ms/forum/threads/arch-mage-content-buff.226131/) — "Very limited uses outside of selling leech"
- [Buff Night Lords](https://royals.ms/forum/threads/buff-night-lords.153290/) — April Fools tongue-in-cheek thread, but reflects NL no longer being "unanimous best"
- [Donn1e's Buccaneer Guide (2025)](https://royals.ms/forum/threads/donn1es-buccaneer-guide-updated-for-2025.188641/) — Bucc DPS optimization
- [Optimal Buccaneer Damage Output](https://royals.ms/forum/threads/optimal-buccaneer-damage-output.161509/) — Animation cancel for 15% DPS gain
- [Comprehensive Paladin Guide](https://royals.ms/forum/threads/comprehensive-paladin-guide-haplopelma.161247/) — Paladin viability and Blast optimization
- [Possible Adjustments for Paladins](https://mapleroyals.com/forum/threads/possible-adjustments-for-paladins.153814/) — Community proposals for Paladin buffs
- [Paladin Blast](https://royals.ms/forum/threads/paladin-blast.188434/) — Blast damage cap and speed concerns
- [Hero vs Dark Knight DPS Calculations](https://royals.ms/forum/threads/hero-vs-dark-knight-dps-calculations.116318/) — Detailed warrior DPS math
- [When Is the Upcoming Skill/Class Balancing Patch Coming?](https://royals.ms/forum/threads/when-is-the-upcoming-skill-class-balancing-patch-coming.239715/) — Community awaiting next balance patch (Nov 2024)
- [Darko's Night Lord Guide 2024](https://royals.ms/forum/threads/darkos-night-lord-guide-2024.227431/) — Updated NL guide
- [Marksmen: A Detailed Analysis](https://mapleroyals.com/forum/threads/marksmen-a-detailed-analysis-and-theyre-somewhat-ok-now.116184/) — MM viability analysis
- [DPS Calculator (Lv. 200 Single-Target)](https://royals.ms/forum/threads/dps-calculator-lv-200-single-target.31606/) — Marty and Plenty's original calculator
- [MapleLegends DPM Chart](https://forum.maplelegends.com/index.php?threads/dpm-chart.16284/) — Cross-reference from comparable v62 server
- [Dream.ms Theoretical DPM Charts](https://forum.dream.ms/threads/theoretical-dpm-charts.9244/) — Another v62 server reference
