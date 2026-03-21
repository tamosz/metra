# metra

DPS calculator for Royals.

Punch in a class, toggle buffs, and see where things land. Useful for balance discussions or just figuring out what to upgrade next.

**Live site:** [tomeblog.com/metra](https://tomeblog.com/metra)

## What You Can Do

- DPS rankings across all classes at standardized gear
- Toggle stuff on and off. SE, Echo, SI, knockback, multi-target, element modifiers.
- Build explorer. Tweak gear and stats, see DPS update live, figure out what to upgrade next.
- Propose balance changes and get before/after comparisons with rank shifts.
- BBCode export for forum posts.
- Shareable URLs for builds and comparisons.

## Development

Node.js 18+.

```bash
git clone <repo-url> && cd metra
npm install
cd web && npm install && cd ..

# dps rankings
npm run simulate

# more cli options
npm run simulate -- --kb --targets 6 --audit

# web app
cd web && npm run dev

# pre-commit hooks
npm run setup
```

### Project Structure

- `data/` - game data as JSON. Skills, gear templates, weapons, attack speeds. One file per class.
- `src/engine/` - the math. Damage formulas, crit, attack speed, DPS, knockback.
- `src/proposals/` - apply changes, run simulations, compare before/after.
- `src/report/` - markdown, BBCode, ASCII charts.
- `src/audit/` - outlier detection.
- `web/` - React + Vite SPA, separate package.json.

### Tests

```bash
npx vitest run        # engine
cd web && npm test    # web
```

Pre-commit hooks handle this automatically.

### Stack

TypeScript, Vitest, React + Vite, Playwright. Engine runs via tsx, no build step.

## Acknowledgments

Engine translated from a spreadsheet by Tim, Shiyui, and Geyforlife. Game data from the [Skill Library](https://royals.ms/forum/threads/mapleroyals-skill-library.209540/) and [royals.ms forum](https://royals.ms/forum).

Thanks to Sylafia, PinaColadaPirate, Donn1e, PandemicP, and Kamuna for feedback and corrections.

## License

[MIT](LICENSE)
