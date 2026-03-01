import type { CustomTier } from '../types/custom-tier.js';

const CUSTOM_TIERS_KEY = 'royals-sim:custom-tiers';

export function loadCustomTiers(): CustomTier[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TIERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomTier[];
  } catch {
    return [];
  }
}

export function saveCustomTiers(tiers: CustomTier[]): void {
  localStorage.setItem(CUSTOM_TIERS_KEY, JSON.stringify(tiers));
}
