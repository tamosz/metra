import { useState, useEffect, useRef } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimatedNumber(target: number, duration: number): number {
  const [current, setCurrent] = useState(target);
  const prevTarget = useRef(target);
  const rafId = useRef(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTarget.current = target;
      setCurrent(target);
      return;
    }

    if (prefersReducedMotion() || prevTarget.current === target) {
      prevTarget.current = target;
      setCurrent(target);
      return;
    }

    const from = prevTarget.current;
    prevTarget.current = target;
    let startTime = -1;

    const step = (time: number) => {
      if (startTime < 0) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.round(from + (target - from) * progress));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    };

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return current;
}
