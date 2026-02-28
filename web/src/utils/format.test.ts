import { describe, it, expect } from 'vitest';
import { formatClassName } from './format.js';

describe('formatClassName', () => {
  // Special aliases
  it('maps drk to DrK', () => { expect(formatClassName('drk')).toBe('DrK'); });
  it('maps nl to NL', () => { expect(formatClassName('nl')).toBe('NL'); });
  it('maps sair to Corsair', () => { expect(formatClassName('sair')).toBe('Corsair'); });
  it('maps bucc to Buccaneer', () => { expect(formatClassName('bucc')).toBe('Buccaneer'); });
  it('maps hero-axe to Hero (Axe)', () => { expect(formatClassName('hero-axe')).toBe('Hero (Axe)'); });
  it('maps mm to Marksman', () => { expect(formatClassName('mm')).toBe('Marksman'); });

  // Fallback capitalization
  it('capitalizes hero', () => { expect(formatClassName('hero')).toBe('Hero'); });
  it('capitalizes bowmaster', () => { expect(formatClassName('bowmaster')).toBe('Bowmaster'); });
  it('capitalizes paladin', () => { expect(formatClassName('paladin')).toBe('Paladin'); });
  it('capitalizes shadower', () => { expect(formatClassName('shadower')).toBe('Shadower'); });
});
