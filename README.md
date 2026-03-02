# Royals Balance Simulator

A tool for evaluating class balance in Royals. Express balance changes as structured proposals, simulate DPS across all classes and funding tiers, and get clear before/after comparison reports.

## Quick Start

Requires Node.js 18+.

```bash
git clone <repo-url> && cd metra
npm install
cd web && npm install && cd ..

# show current DPS rankings
npm run simulate

# run a balance proposal
npm run simulate -- proposals/brandish-buff-20.json

# start the web app
cd web && npm run dev
```

## What It Does

**CLI baseline mode** — run `npm run simulate` with no arguments to get ranked DPS tables with ASCII bar charts across all 12 classes, 3 funding tiers (low/mid/high), and 4 scenarios (buffed, unbuffed, no-echo, bossing).

**CLI proposal mode** — pass a proposal JSON file to see a before/after comparison with DPS deltas, rank changes, and percentage shifts.

**Web app** — interactive dashboard with DPS rankings, a proposal builder, and shareable URLs. Export comparison reports as BBCode for the royals.ms forum.

**Balance audit** — run `npm run simulate -- --audit` to flag statistical outliers and unusual tier sensitivity.

## Writing a Proposal

A proposal is a JSON file describing one or more balance changes:

```json
{
  "name": "Brandish +20 Base Power",
  "author": "ExampleUser",
  "description": "Increase Hero Brandish base power from 260 to 280.",
  "changes": [
    {
      "target": "hero.brandish-sword",
      "field": "basePower",
      "from": 260,
      "to": 280
    }
  ]
}
```

- **target**: `className.skill-slug` — class name matches the filename in `data/skills/`, skill slug is the skill name lowercased with spaces/punctuation replaced by hyphens
- **field**: any numeric property on a skill entry (`basePower`, `multiplier`, `hitCount`, etc.)
- **from**: optional, validates the current value hasn't changed since the proposal was written

Run it: `npm run simulate -- proposals/your-proposal.json`

See `proposals/` for more examples.

## Project Structure

- `data/` — game data as JSON (skills, gear templates, weapons, attack speeds)
- `src/engine/` — pure-function simulation engine (damage, buffs, attack speed, DPS)
- `src/proposals/` — proposal application, simulation runner, comparison logic
- `src/report/` — markdown, BBCode, and ASCII chart rendering
- `src/audit/` — statistical outlier detection
- `web/` — React + Vite SPA (separate package.json)

See [CLAUDE.md](CLAUDE.md) for detailed architecture docs and [ROADMAP.md](ROADMAP.md) for the roadmap.

## Contributing

```bash
# run all engine tests
npx vitest run

# run web tests
cd web && npm test

# type-check everything
npm run type-check:all

# set up pre-commit hooks (runs tests + type-check on commit)
npm run setup
```

## Tech Stack

- TypeScript (strict), Node.js, Vitest
- React + Vite (web app)
- Playwright (e2e tests)
- No build step for engine/CLI — runs directly via tsx

## Acknowledgments

The simulation engine was translated from a spreadsheet calculator by Tim, Shiyui, and Geyforlife. Game mechanics data sourced from the [royals.ms forum](https://royals.ms/forum).

## License

[MIT](LICENSE)
