# Vision

## Project Identity

**For staff**: a rigorous, transparent analysis tool. Every number is traceable to a formula, every proposal is reproducible.

**For community**: an accessible way to explore class balance, propose changes, and see their impact — without touching a spreadsheet.

## Phased Roadmap

### Phase 1: Foundation (COMPLETE)
- 10 physical classes with verified DPS
- Proposal pipeline (JSON → simulate → compare → report)
- CLI with baseline rankings + proposal comparison
- Web SPA: dashboard, proposal builder, URL sharing, BBCode export
- 4 scenarios (Buffed, Unbuffed, No-Echo, Bossing 50% PDR)
- ~500 tests, pre-commit hooks

### Phase 2: Public Launch
**Goal**: Deploy the existing tool publicly and make it approachable for non-technical users.

- **Deploy static site** on Vercel (free tier, auto-deploys from main)
- **Gear/build explorer**: hybrid approach — start from templates, let users override individual stats (STR, DEX, WATK, etc.) with sliders/inputs. Power users get full control, casual users get sensible defaults. Real-time DPS recalculation as stats change.
- **Class comparison view**: side-by-side build comparison ("is my NL better than my Hero at this funding level?"). Natural extension of the explorer.
- **Custom funding tiers**: mid-tier is where most players actually are, and the low→high jump is large. Let users save custom templates or add a mid tier.
- **UX polish**: mobile-friendly layout, tooltips explaining game mechanics, class icons, onboarding for first-time visitors
- **Shareable builds**: extend URL encoding to include custom gear overrides (not just proposals)

### Phase 3: Community Features
**Goal**: Turn the tool into a community hub for balance discussion.

- **Backend**: Supabase (hosted PostgreSQL + auth + REST API)
  - Discord OAuth for login (the community already uses Discord)
  - Row-level security — no custom auth code to maintain
  - Free tier covers expected usage; paid tier is ~$25/mo if needed
- **Proposal gallery**: browse, search, and filter community proposals
- **Proposal templates/presets**: curated starting-point proposals for recurring themes ("nerf NL", "buff warriors") that people can fork and tweak. Lowers the barrier to participation.
- **Diff visualization**: visual chart showing before/after rankings — bar chart overlay, bump chart for rank changes. Makes proposals digestible at a glance beyond tables of numbers.
- **Voting**: upvote/downvote proposals, sort by popularity
- **Comments**: threaded discussion on proposals (rendered as BBCode-compatible for cross-posting to forums)
- **Proposal versioning**: edit proposals without losing history

### Phase 4: Advanced Analysis
**Goal**: Deepen the simulator's analytical power.

- **Magic classes**: Arch Mage (I/L), Bishop — requires magic damage formula implementation (different from physical)
- **Party DPS modeling**: MapleRoyals endgame is party play. A Bishop's value isn't personal DPS — it's party buff contribution. Evaluating balance purely on solo DPS misses support/utility classes. Hard to model well, but the biggest analytical blind spot.
- **Accuracy/miss rate**: the simulator assumes 100% hit rate. Against high-level bosses, accuracy matters and varies by class. Silently inflates some classes' effective bossing DPS.
- **Buff uptime/sustain**: some skills have downtime (Berserk HP drain, Battleship HP, buff recasting). Sustained DPS over a 5-minute boss fight differs from theoretical peak.
- **Marginal gain calculator**: "what should I upgrade next?" — show DPS gain per WATK, per primary stat point, per scroll tier. Not a full gear optimizer, but answers the most common question users will have.
- **Training efficiency**: kills/hr and EXP/hr on reference mobs, comparing classes for grinding scenarios
- **Balance audit**: automated outlier detection — flag classes significantly over/under-performing across scenarios and tiers
- **Mob/boss modeling**: model specific bosses (HP thresholds, PDR, phases) for realistic bossing comparisons

## Architecture Evolution

```
Phase 1-2 (current → near-term):
  Static site (Vercel) ← Vite build ← React SPA
  Engine runs client-side (no server needed)

Phase 3 (community features):
  Static site (Vercel) ← React SPA
       ↕ Supabase client SDK
  Supabase (hosted):
    - PostgreSQL: proposals, votes, comments, user profiles
    - Auth: Discord OAuth
    - Row-level security policies
    - Edge Functions (if needed for notifications/webhooks)
```

The engine stays client-side — simulation is fast enough in the browser. Supabase is only for social data (proposals, votes, comments). This keeps the architecture simple and the hosting costs near zero.

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend hosting | Vercel | Free, auto-deploy from GitHub, good DX |
| Backend | Supabase | Hosted PostgreSQL + auth, Discord OAuth, minimal maintenance |
| Auth | Discord OAuth via Supabase | MapleRoyals community already on Discord |
| Simulation execution | Client-side | Fast enough in browser, no server costs |
| Build explorer state | URL-encoded | Shareable like proposals, no backend needed |
| Magic classes | Deferred | Different formula, lower priority than community features |

## Design Principles

- **Transparency over magic**: every DPS number should be explainable. Show the formula, cite the source.
- **Templates as starting points**: don't force users to configure everything from scratch. Offer presets, allow overrides.
- **Offline-capable core**: the engine and basic UI should work without a backend. Community features are additive.
- **Forum-native output**: BBCode export, Markdown reports — results should flow naturally into royals.ms discussions.
- **Small increments**: each phase delivers standalone value. Phase 2 is useful without Phase 3.

## Non-Goals

- **Not a game wiki**: don't try to document all MapleStory mechanics. Focus on balance-relevant DPS calculation.
- **Not a gear optimizer**: the build explorer shows DPS impact of stat changes, but doesn't solve for "best gear given a budget." The marginal gain calculator (Phase 4) is a deliberate compromise — it answers "what helps most?" without trying to solve the full optimization problem.
- **Not real-time multiplayer**: proposals are asynchronous. No live collaboration or WebSocket features.
- **Not a mobile app**: responsive web is sufficient. No native app.
