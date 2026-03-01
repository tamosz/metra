import { useState, useCallback } from 'react';
import type { SavedBuild } from '../types/saved-build.js';
import type { BuildOverrides } from './useBuildExplorer.js';

const STORAGE_KEY = 'royals-sim:saved-builds';

function loadFromStorage(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedBuild[];
  } catch {
    return [];
  }
}

function saveToStorage(builds: SavedBuild[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

export interface SavedBuildsState {
  builds: SavedBuild[];
  save: (name: string, className: string, tier: string, overrides: Partial<BuildOverrides>) => SavedBuild;
  remove: (id: string) => void;
}

export function useSavedBuilds(): SavedBuildsState {
  const [builds, setBuilds] = useState<SavedBuild[]>(() => loadFromStorage());

  const persist = useCallback((next: SavedBuild[]) => {
    setBuilds(next);
    saveToStorage(next);
  }, []);

  const save = useCallback((name: string, className: string, tier: string, overrides: Partial<BuildOverrides>) => {
    const build: SavedBuild = {
      id: 'sb-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      className,
      tier,
      overrides,
      savedAt: Date.now(),
    };
    persist([...loadFromStorage(), build]);
    return build;
  }, [persist]);

  const remove = useCallback((id: string) => {
    persist(loadFromStorage().filter((b) => b.id !== id));
  }, [persist]);

  return { builds, save, remove };
}
