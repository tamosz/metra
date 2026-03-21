# Forum Feedback Thread

Community feedback from the simulator's public launch thread.

## Launch Thread

**Source:** [Royals Balance Simulator](https://royals.ms/forum/threads/royals-balance-simulator.255386/)
**Accessed:** 2026-03-04
**Used in:** project-wide (gear templates, engine, web)

### Gear Template Concerns (Sylafia, PinaColadaPirate, ssmage)

**Partially resolved:** The tier system was removed in PR #158 — there is now one build per class, computed from a shared gear budget. This resolves the tier naming/calibration concerns below. Mage-specific and per-item accuracy concerns may still apply.

- Mage gear templates needed manual review — Sylafia submitted PR with corrected mage gear breakdowns
- TMA is capped at 2000 in-game (mage gear templates should respect this)
- Perfect tier setups don't reflect realistic player equipment across several classes
- Specific callouts: Shadower helmet with 22 LUK, Corsair with 119 WA gun
- Multiple users advocate standardizing tiers by funding amount (e.g., 10b/30b/60b/100b) rather than abstract tier names, since "perfect" means very different costs per class (30b–140b range)
- ssmage requested same-gear comparisons rather than funding-based, noting cost disparities between classes

### Assassinate Formula (Donn1e, PinaColadaPirate)

- SE reportedly decreases Assassinate damage when hitting damage cap (GIF evidence provided)
- Current Assassinate formula based on 2019–2020 speculation, never officially confirmed
- First 3 hits of Assassinate shouldn't crit; the dash hit has 90% crit + 250% crit bonus
- Staff still investigating the SE/Assassinate interaction server-side — no public formula available
- Calculator DPS doesn't match in-game testing for Shadower

### DPS Accuracy (Donn1e)

- Bucc DPS lower than in-game testing (301k calc vs 331k tested)
- Night Lord showing inflated DPS relative to real results
- Hero > Dark Knight for 3–4 targets claimed impossible (needs investigation)
- General concern that formula inaccuracies undermine reliability

### Paladin Element Boost (Sylafia)

- Holy charge on holy-weak enemy should be 1.4×1.4× (charge × charge), not 1.4×1.5× as previously modeled
- Needs verification against in-game testing

### Feature Requests

- BStep + BoT (Band of Thieves) and DS (Drain Strike) + Snatch for multi-target Shadower comparisons
- In-game test dummy with `/dpm` command for empirical validation (server-side, not our scope)
- Mage controls: INT/TMA input fields with auto-suggestions in web app

### Tier/Funding Philosophy (PinaColadaPirate, Kamuna, ssmage)

**Resolved:** The tier system (low/mid/high/perfect) was removed entirely in PR #158. All classes now use a single build computed from a shared gear budget + per-class weapon base. This sidesteps the naming/calibration debate — there's one build per class, no tier ambiguity.

- Kamuna pointed to CGS optimization thread for pricing data to calibrate tier definitions
- Consensus: current tier names (low/mid/high/perfect) are ambiguous — funding-based tiers would be more useful and maintainable

### Weapon Formula Issues (PinaColadaPirate, Mar 8)

- Purple Surfboard should use spear formula, not 2H BW
- Crushed Skull should use 1H BW formula
- Request to display every weapon type in separate categories in rankings
- Attack speed reference source: ayumilovemaple.wordpress.com/2009/09/06/maplestory-attack-speed-reference/

### Bullseye Application (Sylafia, Mar 3)

- Bullseye 1.2× should apply as a post-calculation modifier (like Berserk/element), not baked into skill%
- Current approach: `skill_percent × 1.2` feeds into crit, which is incorrect
- Should be toggleable independently of skill damage

### Missing Skills (PinaColadaPirate, Mar 7)

- Piercing Arrow (Bowmaster)
- BStep + Band of Thieves (Shadower)
- Barrage + Dragon Strike (Buccaneer) — 1.6 sec per macro, 40 casts/min (confirmed by PandemicP)
- Torpedo (Corsair, no transformation)
- Flamethrower + Ice Splitter (mages)

### Party DPS (PinaColadaPirate, Mar 7)

- Requested party DPS comparison tab showing buff contributions (SE, SI)
- Tool to demonstrate SE value for unfunded archers specifically
- Would help archers argue for balance adjustments

### Graph Scaling (PinaColadaPirate, Mar 8)

- Graphs "very out of scale" due to custom tier assumptions on x-axis
- Suggested using exact damage range values on x-axis for more linear representation
- Referenced DPS Charts thread and official Damage Range Thread for methodology
- Tommy defended exponential scaling as intentional (stat × watk compound)
