import { describe, it, expect } from 'vitest';
import { getClassColor, getClassColorWithOpacity } from './class-colors.js';

describe('class-colors', () => {
  describe('getClassColor', () => {
    it('returns correct color for known classes', () => {
      expect(getClassColor('Hero')).toBe('#e05555');
      expect(getClassColor('NL')).toBe('#55b8e0');
      expect(getClassColor('Archmage I/L')).toBe('#60b0f0');
    });

    it('returns default gray for unknown class', () => {
      expect(getClassColor('Unknown')).toBe('#888888');
      expect(getClassColor('')).toBe('#888888');
    });
  });

  describe('getClassColorWithOpacity', () => {
    it('returns valid rgba string for known class', () => {
      // Hero = #e05555 → rgb(224, 85, 85)
      const result = getClassColorWithOpacity('Hero', 0.5);
      expect(result).toBe('rgba(224, 85, 85, 0.5)');
    });

    it('handles opacity of 1', () => {
      const result = getClassColorWithOpacity('NL', 1);
      // NL = #55b8e0 → rgb(85, 184, 224)
      expect(result).toBe('rgba(85, 184, 224, 1)');
    });

    it('handles opacity of 0', () => {
      const result = getClassColorWithOpacity('DrK', 0);
      // DrK = #7855e0 → rgb(120, 85, 224)
      expect(result).toBe('rgba(120, 85, 224, 0)');
    });

    it('uses default color for unknown class', () => {
      // default = #888888 → rgb(136, 136, 136)
      const result = getClassColorWithOpacity('Unknown', 0.3);
      expect(result).toBe('rgba(136, 136, 136, 0.3)');
    });
  });
});
