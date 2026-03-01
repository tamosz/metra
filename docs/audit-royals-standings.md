# Simulator Standings Audit vs Community Consensus

**Date:** 2026-03-01
**Simulator version:** Current baseline (10 physical classes + 2 mage classes)
**Community sources:** royals.ms forums (Krexel DPS comparison, class tier list, general DPS ranking threads, Update #68 patch notes, class guides, Shadower 2026 guide, Feedback Request thread, Dream.ms class selection guide, MapleLegends DPM charts)

---

## 1. Simulator Top-Tier DPS Summary (Buffed, High Tier)

Best skill per class, fully buffed (MW20, SE, SI, Echo, potion):
- Physical classes use Onyx Apple (100 WATK)
- Mages use Ssiws Cheese (220 MATK) — mage-specific endgame potion confirmed by community

| Rank | Class | Skill | DPS | % of #1 |
|-----:|-------|-------|----:|--------:|
| 1 | Corsair | Battleship Cannon | 350,586 | 100.0% |
| 2 | Shadower | BStep + Assassinate 30 | 326,734 | 93.2% |
| 3 | NL | Triple Throw 30 | 292,314 | 83.4% |
| 4 | Buccaneer | Barrage + Demolition | 260,373 | 74.3% |
| 5 | Hero (Axe) | Brandish | 257,772 | 73.5% |
| 6 | DrK | Spear Crusher | 251,906 | 71.9% |
| 7 | Hero (Sword) | Brandish | 247,314 | 70.5% |
| 8 | Corsair | Rapid Fire | 241,520 | 68.9% |
| 9 | Marksman | Snipe + Strafe | 234,586 | 66.9% |
| 10 | Bowmaster | Hurricane | 233,073 | 66.5% |
| 11 | Bowmaster | Strafe | 206,551 | 58.9% |
| 12 | Paladin | Blast (Holy, Sword) | 192,932 | 55.0% |
| 13 | Archmage F/P | Paralyze | 100,050 | 28.5% |
| 14 | Archmage I/L | Chain Lightning | 92,400 | 26.4% |
| 15 | Bishop | Angel Ray | 50,750 | 14.5% |

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

### INVESTIGATE-4: Mage DPS Gap vs Physical Classes — RESOLVED

**Severity: MEDIUM**
**Simulator (updated):** Archmage I/L Chain Lightning at 92k (26.4% of Corsair), Bishop Angel Ray at 51k (14.5% of Corsair).

**Verdict: Formula is correct. Gap is real and expected for v62. Mage potions were wrong — now fixed.**

**Investigation findings (March 2026):**

1. **Magic damage formula verified correct.** Manual trace of Archmage I/L High Chain Lightning reproduced the simulator output exactly (92,400 DPS). Formula matches the source spreadsheet range calculator E18/E19 cell-for-cell: `MaxDmg = floor(((TMA²/1000 + TMA)/30 + INT/200) * spellAmp * weaponAmp)`.

2. **Community benchmark match.** A royals.ms [forum thread](https://royals.ms/forum/threads/buff-chain-lightning-paralyze.150852/) cites ~94k DPS for Chain Lightning at 1850 TMA. Our formula at 1850 TMA produces ~92-99k depending on SE assumption — consistent.

3. **Mage potion fix applied.** The source spreadsheet's E8 formula shows mage-specific potions up to 220 MATK (Ssiws Cheese), confirmed by community: *"Mages use Ssiws Cheese or Subani's Mystic Cauldron (not stoppers/apples)"* ([DPS charts thread](https://royals.ms/forum/threads/dps-charts.124709/)). Updated mage high-tier potion from Apple (100 MATK) → Ssiws Cheese (220 MATK). Impact: Archmage I/L CL 82k → 92k (+12%), Bishop AR 45k → 51k (+13%).

4. **Root cause of the gap.** The magic damage formula produces raw ranges ~70× lower than physical (268 vs 18,831 max). Mage skill multipliers (210× raw) only partially compensate vs physical (4.94× effective, a ~42× ratio). Additionally, mages can't scroll non-weapon gear for MATK — physical classes get 64+ WATK from gloves/cape/shoes, while mages get MATK only from their staff.

5. **Bishop amplification confirmed.** Bishop lacks Element Amplification (1.4×) and Elemental Staff bonus (1.25×) that Archmage gets. This 1.75× disadvantage is the intended v62 mechanic — Bishop's value is Holy Symbol, Heal, Dispel, and Resurrection, not DPS.

6. **Community consensus aligns.** Forum posters describe mage single-target DPS as "complete garbage" at ~40% of attacker class DPS. Our ~26% (I/L vs Corsair) is even lower, but Corsair is the ceiling — vs the median physical class (~250k), I/L at 92k is ~37%, close to the community's 40% estimate.

### INVESTIGATE-5: Hero Axe vs Hero Sword Gap — RESOLVED

**Severity: LOW**
**Simulator:** Hero (Axe) Brandish at 258k vs Hero (Sword) Brandish at 247k (+4.2% for Axe).

**Verdict: Gap is real, well-explained, and correctly modeled.**

**Investigation findings (March 2026):**

1. **Buffed (with SI) — Axe wins by ~4.2% at all tiers.** With SI, both resolve to the same effective speed (speed 2). The gap is purely from the weapon multiplier: 4.8 / 4.6 = 4.35%. Consistent across low (133k vs 127k), mid (175k vs 168k), and high (258k vs 247k).

2. **Unbuffed (no SI) — Sword wins at high tier.** Stonetooth Sword (speed 5) without SI resolves to speed 3, while 2H Axe (speed 6) resolves to speed 4. The faster attack speed more than erases the multiplier advantage: Sword wins by ~4.1% at high tier. At mid/low (both weapons speed 6), Axe keeps its multiplier edge (+4.2%).

3. **Multiplier confirmed.** 2H Axe 4.8x is confirmed as standard GMS v62, unchanged on MapleRoyals (community member Zerato, multiple wiki sources, damage calculator thread). No speed-5 2H Axe exists in v62 — Stonetooth Sword is speed 5, all 2H Axes are speed 6.

4. **Community context.** Community overwhelmingly uses swords; axes are "underutilized" and cheaper. The trade-off (higher multiplier vs slower unbuffed speed) is the intended design.

---

## 5. Statistical Audit Summary

### Outliers (from automated audit, >1.5 sigma)

| Class | Skill | Direction | Strongest Scenario | Peak Deviation |
|-------|-------|-----------|--------------------|---------------|
| Shadower | BStep + Assassinate 30 | HIGH | Unbuffed (all tiers) | +2.9σ |
| Corsair | Battleship Cannon | HIGH | Buffed/Bossing/No-Echo (High) | +1.8σ |
| Bishop | Genesis | LOW | Buffed/Bossing/No-Echo (all tiers) | -1.8σ |
| Bishop | Angel Ray | LOW | All scenarios, High tier | -1.7σ |
| Archmage I/L | Blizzard | LOW | Bossing Undead (High) | -1.8σ |
| Archmage F/P | Meteor | LOW | Bossing Undead (High) | -1.8σ |

Note: Mage outlier severity decreased slightly after potion fix (previously -1.9σ to -2.1σ).

### Tier Sensitivity Outliers

| Class | Skill | High/Low Ratio | Median | Note |
|-------|-------|:--------------:|:------:|------|
| Marksman | Snipe + Strafe (Unbuffed) | 1.32x | 1.77x | Snipe's fixed 195k damage doesn't scale with gear |
| Corsair | All skills | 1.63x | 1.94x | Battleship Cannon's high base makes it less gear-dependent |
| Shadower | All skills | 1.65x | 1.94x | Likely related to LUK scaling + Dagger multiplier |

### DPS Spread by Tier (Buffed Scenario)

| Tier | Min DPS | Max DPS | Spread | Observation |
|------|--------:|--------:|:------:|-------------|
| Low | 18,299 | 180,049 | 9.8x | Huge gap driven by mages vs Corsair |
| Mid | 25,465 | 239,830 | 9.4x | Narrows slightly at mid funding |
| High | 40,308 | 350,586 | 8.7x | Slightly narrower after mage potion fix |

**Note:** If mages are excluded, the physical-only spread narrows to:
- Low: 85,447 to 180,049 (2.1x)
- Mid: 112,455 to 239,830 (2.1x)
- High: 165,838 to 350,586 (2.1x)

This ~2.1x spread among physical classes is reasonable. Corsair Battleship Cannon at the top and Paladin BW at the bottom define the physical range.

---

## 6. Investigation Task Summary

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| INVESTIGATE-4 | Mage DPS gap vs physical classes (magnitude verification) | MEDIUM | **Resolved** — formula correct, mage potions fixed (Apple → Ssiws Cheese) |
| INVESTIGATE-5 | Hero Axe vs Sword gap verification | LOW | **Resolved** — gap is real (4.2% buffed, from 4.8 vs 4.6 multiplier); unbuffed speed trade-off correctly modeled |

All investigation items resolved.

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
