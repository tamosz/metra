import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Dashboard } from './Dashboard.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { BuildsState } from '../hooks/useBuilds.js';

const mockDps = (dps: number) => ({
  skillName: 'Test',
  attackTime: 0.6,
  damageRange: { min: 10000, max: 20000, average: 15000 },
  skillDamagePercent: 500,
  critDamagePercent: 700,
  totalCritRate: 0.15,
  hitCount: 2,
  hasShadowPartner: false,
  adjustedRangeNormal: 14000,
  adjustedRangeCrit: 13000,
  averageDamage: dps * 0.6,
  dps,
  uncappedDps: dps * 1.02,
  capLossPercent: 2.0,
});

const mockSimulation: SimulationData = {
  results: [
    { scenario: 'Baseline', className: 'Hero', skillName: 'Brandish (Sword)', tier: 'high', dps: mockDps(240000), headline: true },
    { scenario: 'Baseline', className: 'Night Lord', skillName: 'Triple Throw', tier: 'high', dps: mockDps(300000), headline: true },
  ],
  classNames: ['Hero', 'Night Lord'],
  tiers: ['high'],
};

const mockBuilds: BuildsState = {
  builds: [],
  activeBuildId: null,
  save: vi.fn() as any,
  remove: vi.fn(),
  setActive: vi.fn(),
};

const defaultProps = {
  simulation: mockSimulation,
  buildsState: mockBuilds,
  selectedTier: 'high',
  setSelectedTier: vi.fn(),
  cgsValues: { cape: 20, glove: 18, shoe: 16 },
  setCgsValues: vi.fn(),
  targetCount: 1,
  setTargetCount: vi.fn(),
  elementModifiers: {},
  setElementModifiers: vi.fn(),
  buffOverrides: {},
  setBuffOverrides: vi.fn(),
  kbEnabled: false,
  setKbEnabled: vi.fn(),
  bossAttackInterval: 1.5,
  setBossAttackInterval: vi.fn(),
  bossAccuracy: 250,
  setBossAccuracy: vi.fn(),
  capEnabled: true,
  setCapEnabled: vi.fn(),
};

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Dashboard', () => {
  afterEach(cleanup);

  it('renders ranking table', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByTestId('ranking-table')).toBeTruthy();
  });

  it('shows class names in the table', () => {
    render(<Dashboard {...defaultProps} />);
    expect(screen.getByText('Night Lord')).toBeTruthy();
    expect(screen.getByText('Hero')).toBeTruthy();
  });

  it('sorts by DPS descending by default (highest first)', () => {
    render(<Dashboard {...defaultProps} />);
    const rows = screen.getByTestId('ranking-table').querySelectorAll('tbody tr');
    const firstRowText = rows[0].textContent || '';
    const secondRowText = rows[1].textContent || '';
    expect(firstRowText).toContain('Night Lord');
    expect(secondRowText).toContain('Hero');
  });
});
