import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimatedNumber } from './useAnimatedNumber.js';

describe('useAnimatedNumber', () => {
  let rafCallbacks: Array<(time: number) => void>;
  let originalRaf: typeof requestAnimationFrame;
  let originalCaf: typeof cancelAnimationFrame;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    rafCallbacks = [];
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;
    originalMatchMedia = window.matchMedia;
    globalThis.requestAnimationFrame = (cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    };
    globalThis.cancelAnimationFrame = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCaf;
    window.matchMedia = originalMatchMedia;
  });

  function flushRaf(time: number) {
    const cbs = [...rafCallbacks];
    rafCallbacks = [];
    cbs.forEach((cb) => cb(time));
  }

  it('returns target value immediately on first render', () => {
    const { result } = renderHook(() => useAnimatedNumber(1000, 400));
    expect(result.current).toBe(1000);
  });

  it('interpolates from old to new value over duration', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 400),
      { initialProps: { target: 1000 } },
    );
    expect(result.current).toBe(1000);

    rerender({ target: 2000 });

    act(() => flushRaf(0));
    act(() => flushRaf(200));
    expect(result.current).toBeGreaterThan(1000);
    expect(result.current).toBeLessThan(2000);

    act(() => flushRaf(400));
    expect(result.current).toBe(2000);
  });

  it('returns target immediately when prefers-reduced-motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, 400),
      { initialProps: { target: 1000 } },
    );
    rerender({ target: 2000 });
    expect(result.current).toBe(2000);
  });

  it('cancels rAF on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ target }) => useAnimatedNumber(target, 400),
      { initialProps: { target: 1000 } },
    );
    rerender({ target: 2000 });
    act(() => flushRaf(0));
    unmount();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });
});
