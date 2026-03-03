import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuilds } from './useBuilds.js';

const STORAGE_KEY = 'royals-sim:builds';

describe('useBuilds', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useBuilds());
    expect(result.current.builds).toEqual([]);
    expect(result.current.activeBuildId).toBeNull();
  });

  it('saves a build and returns it', () => {
    const { result } = renderHook(() => useBuilds());
    let saved: ReturnType<typeof result.current.save>;
    act(() => {
      saved = result.current.save('My gear', { cape: 14, glove: 18, shoe: 12 });
    });
    expect(saved!.name).toBe('My gear');
    expect(saved!.cgs).toEqual({ cape: 14, glove: 18, shoe: 12 });
    expect(result.current.builds).toHaveLength(1);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useBuilds());
    act(() => {
      result.current.save('Persisted', { cape: 10, glove: 10, shoe: 10 });
    });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Persisted');
  });

  it('removes a build', () => {
    const { result } = renderHook(() => useBuilds());
    let id: string;
    act(() => {
      id = result.current.save('Temp', { cape: 10, glove: 10, shoe: 10 }).id;
    });
    act(() => {
      result.current.remove(id);
    });
    expect(result.current.builds).toHaveLength(0);
  });

  it('clears activeBuildId when removing the active build', () => {
    const { result } = renderHook(() => useBuilds());
    let id: string;
    act(() => {
      id = result.current.save('Active', { cape: 10, glove: 10, shoe: 10 }).id;
    });
    act(() => {
      result.current.setActive(id);
    });
    expect(result.current.activeBuildId).toBe(id);
    act(() => {
      result.current.remove(id);
    });
    expect(result.current.activeBuildId).toBeNull();
  });

  it('tracks active build id', () => {
    const { result } = renderHook(() => useBuilds());
    let id: string;
    act(() => {
      id = result.current.save('A', { cape: 10, glove: 10, shoe: 10 }).id;
    });
    act(() => {
      result.current.setActive(id);
    });
    expect(result.current.activeBuildId).toBe(id);
    act(() => {
      result.current.setActive(null);
    });
    expect(result.current.activeBuildId).toBeNull();
  });

  it('loads builds from localStorage on init', () => {
    const existing = [{ id: 'build-abc', name: 'Loaded', cgs: { cape: 15, glove: 15, shoe: 15 } }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    const { result } = renderHook(() => useBuilds());
    expect(result.current.builds).toHaveLength(1);
    expect(result.current.builds[0].name).toBe('Loaded');
  });
});
