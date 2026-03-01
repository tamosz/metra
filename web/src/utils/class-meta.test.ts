import { describe, it, expect } from 'vitest';
import { isSupportClass, getSupportClassNote, getSupportClassNames } from './class-meta.js';

describe('class-meta', () => {
  describe('isSupportClass', () => {
    it('returns true for Bishop', () => {
      expect(isSupportClass('Bishop')).toBe(true);
    });

    it('returns true for Archmage I/L', () => {
      expect(isSupportClass('Archmage I/L')).toBe(true);
    });

    it('returns false for non-support classes', () => {
      expect(isSupportClass('Hero')).toBe(false);
      expect(isSupportClass('Night Lord')).toBe(false);
      expect(isSupportClass('Dark Knight')).toBe(false);
    });

    it('returns false for unknown class names', () => {
      expect(isSupportClass('nonexistent')).toBe(false);
      expect(isSupportClass('')).toBe(false);
    });
  });

  describe('getSupportClassNote', () => {
    it('returns a note string for Bishop', () => {
      const note = getSupportClassNote('Bishop');
      expect(note).toBeTypeOf('string');
      expect(note!.length).toBeGreaterThan(0);
    });

    it('returns a note string for Archmage I/L', () => {
      const note = getSupportClassNote('Archmage I/L');
      expect(note).toBeTypeOf('string');
      expect(note!.length).toBeGreaterThan(0);
    });

    it('returns null for non-support classes', () => {
      expect(getSupportClassNote('Hero')).toBeNull();
      expect(getSupportClassNote('Night Lord')).toBeNull();
    });
  });

  describe('getSupportClassNames', () => {
    it('filters to only support classes', () => {
      const names = getSupportClassNames(['Hero', 'Bishop', 'Night Lord', 'Archmage I/L', 'Dark Knight']);
      expect(names).toEqual(['Bishop', 'Archmage I/L']);
    });

    it('returns empty array when no support classes present', () => {
      expect(getSupportClassNames(['Hero', 'Night Lord'])).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(getSupportClassNames([])).toEqual([]);
    });
  });
});
