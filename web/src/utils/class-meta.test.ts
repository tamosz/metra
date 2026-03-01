import { describe, it, expect } from 'vitest';
import { isSupportClass, getSupportClassNote, getSupportClassNames } from './class-meta.js';

describe('class-meta', () => {
  describe('isSupportClass', () => {
    it('returns true for bishop', () => {
      expect(isSupportClass('bishop')).toBe(true);
    });

    it('returns true for archmage-il', () => {
      expect(isSupportClass('archmage-il')).toBe(true);
    });

    it('returns false for non-support classes', () => {
      expect(isSupportClass('hero')).toBe(false);
      expect(isSupportClass('nl')).toBe(false);
      expect(isSupportClass('drk')).toBe(false);
    });

    it('returns false for unknown class names', () => {
      expect(isSupportClass('nonexistent')).toBe(false);
      expect(isSupportClass('')).toBe(false);
    });
  });

  describe('getSupportClassNote', () => {
    it('returns a note string for bishop', () => {
      const note = getSupportClassNote('bishop');
      expect(note).toBeTypeOf('string');
      expect(note!.length).toBeGreaterThan(0);
    });

    it('returns a note string for archmage-il', () => {
      const note = getSupportClassNote('archmage-il');
      expect(note).toBeTypeOf('string');
      expect(note!.length).toBeGreaterThan(0);
    });

    it('returns null for non-support classes', () => {
      expect(getSupportClassNote('hero')).toBeNull();
      expect(getSupportClassNote('nl')).toBeNull();
    });
  });

  describe('getSupportClassNames', () => {
    it('filters to only support classes', () => {
      const names = getSupportClassNames(['hero', 'bishop', 'nl', 'archmage-il', 'drk']);
      expect(names).toEqual(['bishop', 'archmage-il']);
    });

    it('returns empty array when no support classes present', () => {
      expect(getSupportClassNames(['hero', 'nl'])).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(getSupportClassNames([])).toEqual([]);
    });
  });
});
