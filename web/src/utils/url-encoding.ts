import LZString from 'lz-string';
import type { Proposal } from '@engine/proposals/types.js';
import type { BuildOverrides } from '../hooks/useBuildExplorer.js';

/**
 * Encode a proposal into a URL-safe compressed string.
 */
export function encodeProposal(proposal: Proposal): string {
  const json = JSON.stringify(proposal);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decode a proposal from a URL-safe compressed string.
 * Returns null if decoding fails.
 */
export function decodeProposal(encoded: string): Proposal | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as Proposal;
  } catch {
    return null;
  }
}

/**
 * Read proposal from URL hash (#p=<compressed>).
 */
export function getProposalFromUrl(): Proposal | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#p=')) return null;
  const encoded = hash.slice(3);
  return decodeProposal(encoded);
}

/**
 * Write proposal to URL hash without triggering navigation.
 */
export function setProposalInUrl(proposal: Proposal): void {
  const encoded = encodeProposal(proposal);
  window.history.replaceState(null, '', `#p=${encoded}`);
}

/**
 * Clear proposal from URL hash.
 */
export function clearProposalFromUrl(): void {
  window.history.replaceState(null, '', window.location.pathname);
}

// --- Build Explorer URL encoding ---

export interface BuildUrlPayload {
  class: string;
  tier: string;
  overrides: Partial<BuildOverrides>;
}

export function encodeBuild(payload: BuildUrlPayload): string {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeBuild(encoded: string): BuildUrlPayload | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as BuildUrlPayload;
  } catch {
    return null;
  }
}

export function getBuildFromUrl(): BuildUrlPayload | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#b=')) return null;
  const encoded = hash.slice(3);
  return decodeBuild(encoded);
}

export function setBuildInUrl(payload: BuildUrlPayload): void {
  const encoded = encodeBuild(payload);
  window.history.replaceState(null, '', `#b=${encoded}`);
}
