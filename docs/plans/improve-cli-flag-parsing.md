# Improve CLI flag parsing

**Priority:** Medium
**Issue:** Manual `process.argv.indexOf()` parsing is fragile and has no help text

## Problem

`src/cli.ts` uses manual `process.argv.indexOf()` calls to parse flags (lines 32-76). Issues:

- No `--help` flag or usage text
- Unknown flags are silently ignored (e.g., `--taargets 6` does nothing)
- Positional arg extraction filters flags by `startsWith('--')` then removes known flag values from a skip-set — works but is brittle
- Doubled flags (e.g., `--targets 4 --targets 6`) use whichever `indexOf` finds first

The flag set is small (7 flags: `--audit`, `--uncapped`, `--no-bullseye`, `--targets`, `--kb`, `--kb-interval`, `--kb-accuracy`) so a lightweight solution is fine.

## Approach

Replace manual parsing with `parseArgs` from `node:util` (built-in since Node 18.3, no dependency needed). Define the flags declaratively:

```typescript
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    audit: { type: 'boolean', default: false },
    uncapped: { type: 'boolean', default: false },
    'no-bullseye': { type: 'boolean', default: false },
    targets: { type: 'string' },
    kb: { type: 'boolean', default: false },
    'kb-interval': { type: 'string' },
    'kb-accuracy': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
  strict: true,  // throws on unknown flags
});
```

`strict: true` catches typos. Add a `--help` handler that prints usage.

## Files to change

- **Edit:** `src/cli.ts` — replace manual parsing with `parseArgs`, add help text
- **Edit:** `src/cli.test.ts` — update tests for the refactored parsing functions

## Notes

The `parseTargetsFlag()` and `parseKbFlags()` exported functions are used in tests. After refactoring, they can be replaced with a single `parseCliArgs()` that returns a typed options object. Keep the validation logic (positive integer check for targets, positive number for interval).
