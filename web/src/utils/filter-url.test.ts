import { describe, it, expect } from 'vitest';
import { encodeFilterState, decodeFilterState, type FilterState } from './filter-url.js';

describe('filter-url', () => {
  it('returns empty string for all-default state', () => {
    expect(encodeFilterState({})).toBe('');
  });

  it('roundtrips buff overrides', () => {
    const state: FilterState = { buffs: { sharpEyes: false } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips element modifiers', () => {
    const state: FilterState = { elements: { Holy: 1.5, Fire: 0.5 } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips KB enabled with default params', () => {
    const state: FilterState = { kb: {} };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips KB with custom params', () => {
    const state: FilterState = { kb: { interval: 3.0, accuracy: 300 } };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips target count', () => {
    const state: FilterState = { targets: 6 };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips cap disabled', () => {
    const state: FilterState = { cap: false };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips skill groups', () => {
    const state: FilterState = { groups: ['warriors', 'mages'] };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips breakdown enabled', () => {
    const state: FilterState = { breakdown: true };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('roundtrips complex multi-field state', () => {
    const state: FilterState = {
      buffs: { sharpEyes: false, speedInfusion: false },
      kb: { interval: 2.0 },
      targets: 3,
      cap: false,
      groups: ['warriors', 'pirates'],
      breakdown: true,
    };
    const encoded = encodeFilterState(state);
    expect(decodeFilterState(encoded)).toEqual(state);
  });

  it('returns null for malformed input', () => {
    expect(decodeFilterState('')).toBeNull();
    expect(decodeFilterState('garbage')).toBeNull();
  });

  it('filters unknown group IDs on decode', () => {
    const state = { groups: ['warriors', 'unknown-group'] };
    const encoded = encodeFilterState(state as FilterState);
    const decoded = decodeFilterState(encoded);
    expect(decoded!.groups).toEqual(['warriors']);
  });

  it('rejects buffs with wrong inner types', () => {
    const encoded = encodeFilterState({ buffs: { sharpEyes: 'not-a-boolean' } } as unknown as FilterState);
    expect(decodeFilterState(encoded)).toBeNull();
  });

  it('rejects elements with wrong inner types', () => {
    const encoded = encodeFilterState({ elements: { Holy: 'not-a-number' } } as unknown as FilterState);
    expect(decodeFilterState(encoded)).toBeNull();
  });

  it('rejects kb with wrong inner types', () => {
    const encoded = encodeFilterState({ kb: { interval: 'bad' } } as unknown as FilterState);
    expect(decodeFilterState(encoded)).toBeNull();
  });

  it('rejects arrays where objects are expected', () => {
    expect(decodeFilterState(encodeFilterState({ buffs: [true] } as unknown as FilterState))).toBeNull();
    expect(decodeFilterState(encodeFilterState({ elements: [1, 2] } as unknown as FilterState))).toBeNull();
  });

  it('rejects NaN and Infinity in numeric fields', () => {
    expect(decodeFilterState(encodeFilterState({ targets: NaN } as FilterState))).toBeNull();
    expect(decodeFilterState(encodeFilterState({ targets: Infinity } as FilterState))).toBeNull();
  });
});
