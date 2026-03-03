import { useState, useCallback } from 'react';
import type { SavedCgsBuild } from '../types/saved-cgs-build.js';
import type { CgsValues } from '../utils/cgs.js';

const STORAGE_KEY = 'royals-sim:builds';

function loadFromStorage(): SavedCgsBuild[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCgsBuild[];
  } catch {
    return [];
  }
}

function saveToStorage(builds: SavedCgsBuild[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export interface BuildsState {
  builds: SavedCgsBuild[];
  activeBuildId: string | null;
  save: (name: string, cgs: CgsValues) => SavedCgsBuild;
  remove: (id: string) => void;
  setActive: (id: string | null) => void;
}

export function useBuilds(): BuildsState {
  const [builds, setBuilds] = useState<SavedCgsBuild[]>(() => loadFromStorage());
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null);

  const persist = useCallback((next: SavedCgsBuild[]) => {
    setBuilds(next);
    saveToStorage(next);
  }, []);

  const save = useCallback((name: string, cgs: CgsValues) => {
    const build: SavedCgsBuild = {
      id: 'build-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      cgs,
    };
    persist([...loadFromStorage(), build]);
    return build;
  }, [persist]);

  const remove = useCallback((id: string) => {
    persist(loadFromStorage().filter((b) => b.id !== id));
    setActiveBuildId((prev) => (prev === id ? null : prev));
  }, [persist]);

  const setActive = useCallback((id: string | null) => {
    setActiveBuildId(id);
  }, []);

  return { builds, activeBuildId, save, remove, setActive };
}
