import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SkillDetailPanel } from './SkillDetailPanel.js';
import type { DpsResult } from '@engine/engine/dps.js';

const mockDps: DpsResult = {
  skillName: 'Brandish (Sword)',
  attackTime: 0.6,
  damageRange: { min: 12000, max: 18000, average: 15000 },
  skillDamagePercent: 520,
  critDamagePercent: 800,
  totalCritRate: 0.15,
  hitCount: 2,
  hasShadowPartner: false,
  adjustedRangeNormal: 14800,
  adjustedRangeCrit: 14500,
  averageDamage: 189000,
  dps: 315000,
  uncappedDps: 320000,
  capLossPercent: 1.5,
};

const mockTierData = [
  { tier: 'low', dps: 127000 },
  { tier: 'mid', dps: 185000 },
  { tier: 'high', dps: 315000 },
];

describe('SkillDetailPanel', () => {
  afterEach(cleanup);

  it('renders formula breakdown for non-composite entries', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={mockTierData}
        classColor="#e05555"
        isComposite={false}
        capEnabled={true}
        currentTier="high"
      />
    );
    expect(screen.getByText('12,000 – 18,000')).toBeTruthy();
    expect(screen.getByText('0.60s')).toBeTruthy();
    expect(screen.getByText('520%')).toBeTruthy();
    expect(screen.getByText('800%')).toBeTruthy();
    expect(screen.getByText('15%')).toBeTruthy();
  });

  it('hides formula breakdown for composite entries', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={mockTierData}
        classColor="#e05555"
        isComposite={true}
        capEnabled={true}
        currentTier="high"
      />
    );
    // Should not show formula details
    expect(screen.queryByText('520%')).toBeNull();
    // But should still show tier comparison
    expect(screen.getByText('127,000')).toBeTruthy();
    expect(screen.getByText('315,000')).toBeTruthy();
  });

  it('renders tier comparison bars for all tiers', () => {
    render(
      <SkillDetailPanel
        dps={mockDps}
        tierData={mockTierData}
        classColor="#e05555"
        isComposite={false}
        capEnabled={true}
        currentTier="high"
      />
    );
    expect(screen.getByText('Low')).toBeTruthy();
    expect(screen.getByText('Mid')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
  });
});
