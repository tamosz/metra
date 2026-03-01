import { useState, useCallback } from 'react';
import type { CustomTier, CustomTierAdjustments } from '../types/custom-tier.js';
import { DEFAULT_ADJUSTMENTS } from '../types/custom-tier.js';
import { loadCustomTiers, saveCustomTiers } from '../utils/storage.js';

export interface CustomTiersState {
  tiers: CustomTier[];
  add: (name: string, baseTier: string, adjustments: CustomTierAdjustments) => CustomTier;
  update: (id: string, updates: Partial<Omit<CustomTier, 'id'>>) => void;
  remove: (id: string) => void;
}

function generateId(): string {
  return 'ct-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useCustomTiers(): CustomTiersState {
  const [tiers, setTiers] = useState<CustomTier[]>(() => loadCustomTiers());

  const persist = useCallback((next: CustomTier[]) => {
    setTiers(next);
    saveCustomTiers(next);
  }, []);

  const add = useCallback((name: string, baseTier: string, adjustments: CustomTierAdjustments) => {
    const tier: CustomTier = {
      id: generateId(),
      name,
      baseTier,
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...adjustments },
    };
    persist([...loadCustomTiers(), tier]);
    return tier;
  }, [persist]);

  const update = useCallback((id: string, updates: Partial<Omit<CustomTier, 'id'>>) => {
    persist(loadCustomTiers().map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, [persist]);

  const remove = useCallback((id: string) => {
    persist(loadCustomTiers().filter((t) => t.id !== id));
  }, [persist]);

  return { tiers, add, update, remove };
}
