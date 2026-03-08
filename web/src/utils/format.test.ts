import { describe, it, expect } from 'vitest';
import { formatClassName } from './format.js';

describe('formatClassName', () => {
  // Special aliases
  it('maps dark-knight to Dark Knight', () => { expect(formatClassName('dark-knight')).toBe('Dark Knight'); });
  it('maps night-lord to Night Lord', () => { expect(formatClassName('night-lord')).toBe('Night Lord'); });
  it('maps sair to Corsair', () => { expect(formatClassName('sair')).toBe('Corsair'); });
  it('maps bucc to Buccaneer', () => { expect(formatClassName('bucc')).toBe('Buccaneer'); });
  it('maps hero-axe to Hero (Axe)', () => { expect(formatClassName('hero-axe')).toBe('Hero (Axe)'); });
  it('maps mm to Marksman', () => { expect(formatClassName('mm')).toBe('Marksman'); });
  it('maps archmage-il to Archmage I/L', () => { expect(formatClassName('archmage-il')).toBe('Archmage I/L'); });
  it('maps archmage-fp to Archmage F/P', () => { expect(formatClassName('archmage-fp')).toBe('Archmage F/P'); });

  // Fallback capitalization
  it('capitalizes hero', () => { expect(formatClassName('hero')).toBe('Hero'); });
  it('capitalizes bowmaster', () => { expect(formatClassName('bowmaster')).toBe('Bowmaster'); });
  it('capitalizes paladin', () => { expect(formatClassName('paladin')).toBe('Paladin'); });
  it('capitalizes shadower', () => { expect(formatClassName('shadower')).toBe('Shadower'); });
});
