import LZString from 'lz-string';
import type { BuffOverrides } from '../components/BuffToggles.js';
import type { CgsValues } from './cgs.js';
import { SKILL_GROUPS } from './skill-groups.js';

export interface FilterState {
  tier?: string;
  buffs?: BuffOverrides;
  elements?: Record<string, number>;
  kb?: { interval?: number; accuracy?: number };
  targets?: number;
  cap?: boolean;
  cgs?: CgsValues;
  groups?: string[];
  breakdown?: boolean;
}

const KNOWN_GROUP_IDS = new Set<string>(SKILL_GROUPS.map((g) => g.id));

export function encodeFilterState(state: FilterState): string {
  if (Object.keys(state).length === 0) return '';
  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeFilterState(encoded: string): FilterState | null {
  try {
    if (!encoded) return null;
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const result: FilterState = {};

    if (typeof parsed.tier === 'string') result.tier = parsed.tier;
    if (typeof parsed.buffs === 'object' && parsed.buffs !== null && !Array.isArray(parsed.buffs)) {
      if (Object.values(parsed.buffs).every((v) => typeof v === 'boolean' || typeof v === 'number'))
        result.buffs = parsed.buffs;
      else return null;
    }
    if (typeof parsed.elements === 'object' && parsed.elements !== null && !Array.isArray(parsed.elements)) {
      if (Object.values(parsed.elements).every((v) => typeof v === 'number' && Number.isFinite(v)))
        result.elements = parsed.elements;
      else return null;
    }
    if (typeof parsed.kb === 'object' && parsed.kb !== null && !Array.isArray(parsed.kb)) {
      const { interval, accuracy, ...rest } = parsed.kb;
      if (
        Object.keys(rest).length === 0 &&
        (interval === undefined || (typeof interval === 'number' && Number.isFinite(interval))) &&
        (accuracy === undefined || (typeof accuracy === 'number' && Number.isFinite(accuracy)))
      )
        result.kb = parsed.kb;
      else return null;
    }
    if (typeof parsed.targets === 'number' && Number.isFinite(parsed.targets)) result.targets = parsed.targets;
    if (typeof parsed.cap === 'boolean') result.cap = parsed.cap;
    if (typeof parsed.cgs === 'object' && parsed.cgs !== null && !Array.isArray(parsed.cgs)) {
      if (
        typeof parsed.cgs.cape === 'number' && Number.isFinite(parsed.cgs.cape) &&
        typeof parsed.cgs.glove === 'number' && Number.isFinite(parsed.cgs.glove) &&
        typeof parsed.cgs.shoe === 'number' && Number.isFinite(parsed.cgs.shoe)
      )
        result.cgs = parsed.cgs;
      else return null;
    }
    if (typeof parsed.breakdown === 'boolean') result.breakdown = parsed.breakdown;

    if (Array.isArray(parsed.groups)) {
      const validGroups = parsed.groups.filter((g: unknown) => typeof g === 'string' && KNOWN_GROUP_IDS.has(g));
      if (validGroups.length > 0) result.groups = validGroups;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function getFilterFromUrl(): FilterState | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#f=')) return null;
  return decodeFilterState(hash.slice(3));
}

export function setFilterInUrl(state: FilterState): void {
  const encoded = encodeFilterState(state);
  if (encoded) {
    window.history.replaceState(null, '', `#f=${encoded}`);
  } else {
    clearFilterFromUrl();
  }
}

export function clearFilterFromUrl(): void {
  window.history.replaceState(null, '', window.location.pathname);
}
