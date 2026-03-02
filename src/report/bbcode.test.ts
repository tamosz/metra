import { describe, it, expect } from 'vitest';
import { renderComparisonBBCode, renderBaselineBBCode } from './bbcode.js';
import type { ComparisonResult, ScenarioResult } from '../proposals/types.js';

function mockDpsResult(dps: number) {
  return {
    skillName: 'Test',
    attackTime: 0.63,
    damageRange: { min: 1000, max: 2000, average: 1500 },
    skillDamagePercent: 494,
    critDamagePercent: 600,
    adjustedRangeNormal: 1500,
    adjustedRangeCrit: 1800,
    averageDamage: dps * 0.63,
    dps,
    uncappedDps: dps,
    capLossPercent: 0,
  };
}

describe('renderComparisonBBCode', () => {
  it('renders BBCode with [b] tags and [code] table', () => {
    const result: ComparisonResult = {
      proposal: {
        name: 'Brandish Buff',
        author: 'TestPlayer',
        description: 'Increase Brandish base power',
        changes: [
          { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
        ],
      },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish (Sword)',
          tier: 'high',
          scenario: 'Buffed',
          before: 255950,
          after: 274167,
          change: 18217,
          changePercent: 7.117,
        },
        {
          className: 'DrK',
          skillName: 'Spear Crusher',
          tier: 'high',
          scenario: 'Buffed',
          before: 249418,
          after: 249418,
          change: 0,
          changePercent: 0,
        },
      ],
    };

    const bbcode = renderComparisonBBCode(result);

    expect(bbcode).toContain('[b]Proposal: Brandish Buff[/b]');
    expect(bbcode).toContain('[i]Author: TestPlayer[/i]');
    expect(bbcode).toContain('[code]');
    expect(bbcode).toContain('[/code]');
    expect(bbcode).toContain('Hero');
    expect(bbcode).toContain('274,167');
    expect(bbcode).toContain('+18,217');
    expect(bbcode).toContain('+7.1%');
  });

  it('includes rank column when ranks are present', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Test', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 250000,
          after: 270000,
          change: 20000,
          changePercent: 8,
          rankBefore: 2,
          rankAfter: 1,
        },
      ],
    };

    const bbcode = renderComparisonBBCode(result);
    expect(bbcode).toContain('Rank');
    expect(bbcode).toContain('2\u21921');
  });

  it('renders negative changes with minus prefix', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Nerf', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 300000,
          after: 270000,
          change: -30000,
          changePercent: -10,
        },
      ],
    };

    const bbcode = renderComparisonBBCode(result);
    expect(bbcode).toContain('-30,000');
    expect(bbcode).toContain('-10.0%');
  });

  it('renders multi-scenario results as separate sections', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Multi', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 100000,
          after: 110000,
          change: 10000,
          changePercent: 10,
        },
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Bossing (50% PDR)',
          before: 50000,
          after: 55000,
          change: 5000,
          changePercent: 10,
        },
      ],
    };

    const bbcode = renderComparisonBBCode(result);
    expect(bbcode).toContain('[b]Buffed[/b]');
    expect(bbcode).toContain('[b]Bossing (50% PDR)[/b]');
    const codeBlocks = bbcode.match(/\[code\]/g);
    expect(codeBlocks).toHaveLength(2);
  });
});

describe('renderBaselineBBCode', () => {
  it('renders ranked DPS table in [code] blocks', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(300000) },
      { className: 'DrK', skillName: 'Crusher', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(250000) },
    ];

    const bbcode = renderBaselineBBCode(results);

    expect(bbcode).toContain('[b]DPS Rankings[/b]');
    expect(bbcode).toContain('[b]Buffed[/b]');
    expect(bbcode).toContain('[code]');
    expect(bbcode).toContain('300,000');
    // Hero should be rank 1 (higher DPS)
    const heroLine = bbcode.split('\n').find((l) => l.includes('Hero'));
    expect(heroLine).toMatch(/^\s*1/);
  });

  it('contains all scenario names from input', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(300000) },
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Bossing (50% PDR)', dps: mockDpsResult(150000) },
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Bossing (KB)', dps: mockDpsResult(150000) },
    ];

    const bbcode = renderBaselineBBCode(results);
    expect(bbcode).toContain('[b]Buffed[/b]');
    expect(bbcode).toContain('[b]Bossing (50% PDR)[/b]');
    expect(bbcode).toContain('[b]Bossing (KB)[/b]');
  });
});
