import LZString from 'lz-string';
import type { Proposal } from '@engine/proposals/types.js';
import { validateProposal } from '@engine/proposals/validate.js';

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
    return validateProposal(JSON.parse(json));
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

// --- Party URL encoding ---

const EMPTY_PARTY_SENTINEL = '_';

export function encodeParty(members: string[]): string {
  if (members.length === 0) return EMPTY_PARTY_SENTINEL;
  return members.join(',');
}

export function decodeParty(encoded: string): string[] | null {
  try {
    if (!encoded) return null;
    if (encoded === EMPTY_PARTY_SENTINEL) return [];
    return encoded.split(',')
      .filter(Boolean)
      .filter(s => /^[a-z][a-z0-9-]*$/.test(s))
      .slice(0, 6);
  } catch {
    return null;
  }
}

export function getPartyFromUrl(): string[] | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#party=')) return null;
  const encoded = hash.slice(7);
  return decodeParty(encoded);
}

export function setPartyInUrl(members: string[]): void {
  const encoded = encodeParty(members);
  window.history.replaceState(null, '', `#party=${encoded}`);
}
