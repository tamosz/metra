# Forum Feedback Thread

Community feedback from the simulator's public launch thread.

## Launch Thread

**Source:** [Royals Balance Simulator](https://royals.ms/forum/threads/royals-balance-simulator.255386/)
**Accessed:** 2026-03-04
**Used in:** project-wide (gear templates, engine, web)

### Gear Template Concerns (Sylafia, PinaColadaPirate, ssmage)

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

- Kamuna pointed to CGS optimization thread for pricing data to calibrate tier definitions
- Consensus: current tier names (low/mid/high/perfect) are ambiguous — funding-based tiers would be more useful and maintainable
