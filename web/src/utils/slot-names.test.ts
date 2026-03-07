import { describe, it, expect } from 'vitest';
import { slotDisplayName, OVERALL_TOOLTIP } from './slot-names.js';

describe('slotDisplayName', () => {
  it('capitalizes simple slot names', () => {
    expect(slotDisplayName('weapon')).toBe('Weapon');
    expect(slotDisplayName('helmet')).toBe('Helmet');
    expect(slotDisplayName('pendant')).toBe('Pendant');
  });

  it('maps top to Overall', () => {
    expect(slotDisplayName('top')).toBe('Overall');
  });

  it('splits numbered slots', () => {
    expect(slotDisplayName('ring1')).toBe('Ring 1');
    expect(slotDisplayName('ring4')).toBe('Ring 4');
  });

  it('falls back to capitalized key for unknown slots', () => {
    expect(slotDisplayName('unknown')).toBe('Unknown');
  });

  it('exports tooltip constant', () => {
    expect(OVERALL_TOOLTIP).toContain('Top and bottom');
  });
});
