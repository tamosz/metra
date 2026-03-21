import { useRef, useMemo, useEffect, useState } from 'react';
import type { ScenarioResult } from '@engine/proposals/types.js';
import { HIGH_IMPACT_THRESHOLD, UNIFORM_SHIFT_STDDEV_THRESHOLD, EMPHASIS_DEBOUNCE_MS } from '../utils/animation-config.js';

export interface AnimationEntry {
  previousDps: number;
  changeRatio: number;
  isHighImpact: boolean;
}

export interface AnimatedDpsResult {
  entries: Map<string, AnimationEntry>;
  transitionId: number;
  prefersReducedMotion: boolean;
}

function entryKey(className: string, skillName: string): string {
  return `${className}|${skillName}`;
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimatedDps(
  results: ScenarioResult[],
  capEnabled: boolean,
  enabled: boolean,
): AnimatedDpsResult {
  const prevMapRef = useRef<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);
  const [transitionId, setTransitionId] = useState(0);
  const reducedMotion = getReducedMotion();

  const currentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of results) {
      const dps = Math.round(capEnabled ? r.dps.dps : r.dps.uncappedDps);
      map.set(entryKey(r.className, r.skillName), dps);
    }
    return map;
  }, [results, capEnabled]);

  const entries = useMemo(() => {
    const map = new Map<string, AnimationEntry>();
    const prevMap = prevMapRef.current;

    if (isFirstRender.current || !enabled || reducedMotion) {
      for (const [key, dps] of currentMap) {
        map.set(key, { previousDps: dps, changeRatio: 0, isHighImpact: false });
      }
      return map;
    }

    // Compute deltas
    const deltas: { key: string; current: number; previous: number; absDelta: number; pctChange: number }[] = [];
    for (const [key, dps] of currentMap) {
      const prev = prevMap.get(key);
      if (prev === undefined) {
        map.set(key, { previousDps: dps, changeRatio: 0, isHighImpact: false });
        continue;
      }
      const absDelta = Math.abs(dps - prev);
      const pctChange = prev !== 0 ? absDelta / prev : 0;
      deltas.push({ key, current: dps, previous: prev, absDelta, pctChange });
    }

    if (deltas.length === 0) return map;

    const totalAbsDelta = deltas.reduce((sum, d) => sum + d.absDelta, 0);
    const meanAbsDelta = totalAbsDelta / deltas.length;

    // Check for uniform shift: stddev of percentage changes
    const meanPctChange = deltas.reduce((sum, d) => sum + d.pctChange, 0) / deltas.length;
    const variance = deltas.reduce((sum, d) => sum + (d.pctChange - meanPctChange) ** 2, 0) / deltas.length;
    const stddev = Math.sqrt(variance);
    const isUniformShift = stddev < UNIFORM_SHIFT_STDDEV_THRESHOLD;

    for (const d of deltas) {
      const changeRatio = meanAbsDelta > 0 ? d.absDelta / meanAbsDelta : 0;
      const isHighImpact = !isUniformShift && changeRatio > HIGH_IMPACT_THRESHOLD;
      map.set(d.key, { previousDps: d.previous, changeRatio, isHighImpact });
    }

    return map;
  }, [currentMap, enabled, reducedMotion]);

  // Update prevMap and transitionId after computing entries
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevMapRef.current = currentMap;
      return;
    }

    // Check if data actually changed
    const prevMap = prevMapRef.current;
    let changed = prevMap.size !== currentMap.size;
    if (!changed) {
      for (const [key, dps] of currentMap) {
        if (prevMap.get(key) !== dps) {
          changed = true;
          break;
        }
      }
    }

    prevMapRef.current = currentMap;

    if (changed && enabled) {
      // Debounce emphasis so rapid toggles don't flicker
      const timer = setTimeout(() => {
        setTransitionId((id) => id + 1);
      }, EMPHASIS_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }
  }, [currentMap, enabled]);

  return { entries, transitionId, prefersReducedMotion: reducedMotion };
}
