# WASM Case Study: Royals Balance Simulator Engine

## Executive Summary

This document evaluates whether compiling the Metra simulation engine to WebAssembly would provide meaningful benefits. The short answer: **not for raw performance on the current workload**, but there are credible arguments around portability, future workload scaling, and UI responsiveness that deserve consideration.

## Current Performance Profile

The simulation engine is a tight, pure-function numerical pipeline. The hot path is `calculateSkillDps()` in `packages/engine/src/dps.ts`, which chains:

1. Weapon speed resolution → attack time lookup (table scan, O(1))
2. Crit damage calculation (3 formula variants, ~5 FLOPs)
3. Base damage range (standard/throwingStar/magic dispatch, 8-15 FLOPs)
4. Adjusted range with damage cap (ratio weighting, ~8 FLOPs × 2 for normal/crit)
5. Average damage with crit weighting + Shadow Partner (~10 FLOPs)
6. DPS = averageDamage / attackTime

**Per-skill cost:** ~30-40 floating-point operations.

A full simulation iterates over scenarios × classes × tiers × skills:

| Scenario | Classes | Tiers | Skills/class | Total DPS calcs |
|----------|---------|-------|--------------|-----------------|
| Baseline (Buffed) | 14 | 4 | ~2.4 avg | ~134 |
| + Training (6 mobs) | 14 | 4 | ~2.4 avg | ~268 |
| + Element variants | 14 | 4 | ~3+ avg | ~450+ |

**Total work per simulation:** 4,000-16,000 FLOPs. This is trivial — a modern CPU completes it in well under 1ms. In the browser, V8's JIT compiles these pure arithmetic functions to near-native speed. Measured wall time for a full baseline simulation is **1-5ms** in Chrome.

## The Case Against WASM

### The workload is too small

WASM's advantage over JIT-compiled JavaScript is roughly 1.2-2× for numerical code (V8 is very good at optimizing tight arithmetic loops). On a 2ms workload, saving 1ms is imperceptible. Users cannot distinguish 1ms from 2ms — both feel instantaneous.

### JS/WASM boundary overhead is real

Each call across the JS↔WASM boundary costs ~50-100ns. With 134-450 skill calculations per simulation, boundary crossings alone could consume 10-50μs — not a lot in absolute terms, but potentially a significant fraction of the total computation time. To amortize this, you'd need a batch interface (pass all skills as a typed array, get all results back), which adds complexity for marginal gain.

### The engine is already well-structured for JS

The code is pure functions with no allocations in the hot path (except the result objects). V8's TurboFan JIT handles this pattern extremely well. There's no GC pressure, no megamorphic call sites, no hidden class transitions — all the things that usually make JS slower than WASM.

### Maintenance cost

A WASM compilation step (whether via Rust, C, or AssemblyScript) introduces:
- A second language in the project (currently TypeScript-only)
- A build toolchain (wasm-pack, Emscripten, or asc)
- Type duplication (skill/build types defined in both TS and the source language)
- Harder debugging (WASM stack traces are less readable)
- CI complexity (need to build WASM artifacts before running tests)

For a community-driven balance simulator, this is a significant contributor barrier.

## The Case For WASM

### 1. Future workload scaling

The current simulation is simple: compute DPS for each (class, tier, skill) tuple independently. But the ROADMAP mentions potential future features that would increase computational load significantly:

- **Monte Carlo simulation** — instead of computing expected DPS from the uniform damage distribution formula, sample thousands of attacks to model variance, lucky streaks, and realistic kill times. This turns a 4K FLOP job into a 4M+ FLOP job.
- **Optimization/search** — "given a budget of X mesos, what gear allocation maximizes DPS?" requires evaluating thousands of build configurations.
- **Multi-class party simulation** — modeling buff interactions, skill rotations, and coordinated cooldowns across a 6-person party.

For these workloads, WASM's consistent 1.5-2× speedup over JS becomes meaningful (seconds saved, not milliseconds).

### 2. Predictable performance

JavaScript JIT compilation is unpredictable. V8 may deoptimize functions if it encounters unexpected input shapes, and the first few runs of a function are interpreted before TurboFan kicks in. WASM provides consistent, ahead-of-time compiled performance from the first call. For a tool that recalculates on every UI toggle change, eliminating JIT warmup jitter provides smoother UX — even if the steady-state speed is similar.

### 3. UI thread offloading (WASM + Web Worker)

The stronger argument isn't WASM alone — it's WASM inside a Web Worker. Currently, the simulation runs synchronously on the main thread inside a `useMemo` hook. Even at 2-5ms, this blocks React's render cycle. Combined with React reconciliation, the total frame budget impact is higher than the raw simulation time.

A WASM module in a Web Worker would:
- Keep the UI thread completely free during simulation
- Enable cancellation (kill the worker if the user changes toggles before the previous simulation finishes)
- Allow progressive results (stream class-by-class results to the UI as they complete)

This is achievable without WASM (just move the JS engine to a Worker), but WASM makes the Worker approach cleaner: a single `.wasm` binary with no module resolution issues, no source map complexity, and deterministic behavior.

### 4. Portable engine binary

A WASM module is a universal compute target. The same `.wasm` file could run in:
- **The browser** (current web app)
- **Node.js** (current CLI, via `@aspect-build/rules_js` or native WASM support)
- **Cloudflare Workers / Deno Deploy** — server-side simulation without a Node.js runtime
- **Other languages** — a Rust or Python tool could call the WASM engine directly via `wasmtime` or `wasmer`, enabling third-party integrations without reimplementing the formulas

This matters if the project ever wants to offer an API endpoint ("simulate this proposal server-side and return results") without maintaining two implementations.

### 5. AssemblyScript as a middle ground

AssemblyScript compiles a TypeScript-like language to WASM. The existing engine functions (`calculateDamageRange`, `calculateSkillDps`, etc.) are almost valid AssemblyScript already — they're pure arithmetic with typed inputs and no complex object manipulation.

A plausible migration:
1. Extract the numerical core (damage.ts, dps.ts, buffs.ts) into an AssemblyScript module
2. Keep the orchestration layer (simulate.ts, compare.ts) in TypeScript
3. The WASM module exports a batch function: `simulateAll(skillsBuffer: Float64Array) → Float64Array`
4. TypeScript marshals skill data into typed arrays, calls WASM, unmarshals results

This preserves the "one language" feel while getting WASM benefits. The type duplication is minimal because AssemblyScript types are nearly identical to TypeScript types.

## What Would a WASM Architecture Look Like?

```
packages/engine-wasm/          # New package
  src/
    damage.ts                  # AssemblyScript (copied from engine, annotated)
    dps.ts                     # AssemblyScript
    buffs.ts                   # AssemblyScript
    batch.ts                   # Batch entry point: typed arrays in, typed arrays out
  assembly/
    tsconfig.json              # AssemblyScript config
  build/
    engine.wasm                # Compiled output
    engine.js                  # JS glue code (auto-generated)

packages/engine/               # Existing package (unchanged)
  src/
    damage.ts                  # Original TypeScript (still works, still tested)
    dps.ts
    ...

web/src/
  hooks/
    useSimulation.ts           # Chooses WASM or JS engine based on availability
  workers/
    simulation.worker.ts       # Web Worker that loads engine.wasm
```

The JS engine remains the primary, tested implementation. The WASM engine is an optional accelerator. Feature detection at runtime:

```typescript
const engine = await loadWasmEngine().catch(() => loadJsEngine());
```

## Recommendation

**Don't build it now.** The current workload doesn't justify the complexity. The simulation runs in 1-5ms — there is no performance problem to solve.

**Revisit when:**
- Monte Carlo simulation or optimization search is added (workload jumps 1000×)
- Server-side simulation is needed (portability argument becomes real)
- The UI starts doing real-time slider-driven recalculation where even small jitter matters

**Do now instead:**
- Move the simulation to a Web Worker (pure JS, no WASM). This solves the UI responsiveness concern for ~100 lines of code, zero new toolchain, zero new languages.
- Structure the engine's batch interface cleanly (`simulateAll(configs) → results[]`) so that a future WASM port has a clean boundary to target.

The best time to add WASM is when you have a workload that actually needs it. The second best time is when you've already structured your code so the port is easy — and this engine is already 90% of the way there thanks to its pure-function architecture.
