import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const engineMocks = vi.hoisted(() => ({
  computeBuffAttribution: vi.fn(),
  simulateParty: vi.fn(),
  findOptimalParty: vi.fn(),
  PARTY_PRESETS: [
    { name: 'Meta', description: 'Auto', members: [], autoComputed: true },
    { name: 'No Support', description: 'Auto', members: [], autoComputed: true },
    { name: 'Warriors + SI', description: 'Static', members: [{ className: 'hero' }] },
  ],
}));

const bundleMocks = vi.hoisted(() => ({
  discoveredData: {
    classDataMap: new Map<string, unknown>(),
    builds: new Map<string, unknown>(),
  },
  gameData: { stub: true },
}));

vi.mock('@metra/engine', () => ({
  computeBuffAttribution: engineMocks.computeBuffAttribution,
  simulateParty: engineMocks.simulateParty,
  findOptimalParty: engineMocks.findOptimalParty,
  PARTY_PRESETS: engineMocks.PARTY_PRESETS,
}));

vi.mock('../data/bundle.js', () => ({
  discoveredData: bundleMocks.discoveredData,
  gameData: bundleMocks.gameData,
}));

import { usePartySimulation } from './usePartySimulation.js';

function makePartyResult(classNames: string[], totalDps: number) {
  return {
    party: { name: '', members: classNames.map((className) => ({ className })) },
    totalDps,
    members: classNames.map((className, index) => ({
      className,
      skillName: `Skill ${index + 1}`,
      dps: totalDps / Math.max(classNames.length, 1),
      soloBaseline: 0,
      buffContribution: 0,
    })),
    activeBuffs: { sharpEyes: false, speedInfusion: false },
  };
}

describe('usePartySimulation', () => {
  beforeEach(() => {
    bundleMocks.discoveredData.classDataMap = new Map([
      ['hero', { className: 'hero' }],
      ['bowmaster', { className: 'bowmaster' }],
      ['bucc', { className: 'bucc' }],
      ['marksman', { className: 'marksman' }],
    ]);
    bundleMocks.discoveredData.builds = new Map([
      ['hero', { className: 'hero' }],
      ['bowmaster', { className: 'bowmaster' }],
      ['bucc', { className: 'bucc' }],
    ]);

    engineMocks.computeBuffAttribution.mockReset();
    engineMocks.simulateParty.mockReset();
    engineMocks.findOptimalParty.mockReset();

    engineMocks.findOptimalParty.mockImplementation(() => ({
      optimal: makePartyResult(['hero', 'bowmaster'], 1000),
      topParties: [],
    }));
  });

  it('returns no result and no swap options when the party is empty', () => {
    const { result } = renderHook(() => usePartySimulation([]));

    expect(result.current.result).toBeNull();
    expect(result.current.slotSwapOptions(0)).toEqual([]);
    expect(engineMocks.computeBuffAttribution).not.toHaveBeenCalled();
  });

  it('fills successful auto-computed presets and leaves failed ones empty', () => {
    engineMocks.findOptimalParty
      .mockImplementationOnce(() => ({
        optimal: makePartyResult(['night-lord', 'bowmaster'], 1400),
        topParties: [],
      }))
      .mockImplementationOnce(() => {
        throw new Error('optimization failed');
      });

    const { result } = renderHook(() => usePartySimulation([]));

    expect(result.current.presets).toEqual([
      {
        name: 'Meta',
        description: 'Auto',
        autoComputed: true,
        members: [{ className: 'night-lord' }, { className: 'bowmaster' }],
      },
      {
        name: 'No Support',
        description: 'Auto',
        autoComputed: true,
        members: [],
      },
      {
        name: 'Warriors + SI',
        description: 'Static',
        members: [{ className: 'hero' }],
      },
    ]);

    expect(engineMocks.findOptimalParty).toHaveBeenNthCalledWith(
      1,
      bundleMocks.discoveredData.classDataMap,
      bundleMocks.discoveredData.builds,
      bundleMocks.gameData,
    );
    expect(engineMocks.findOptimalParty).toHaveBeenNthCalledWith(
      2,
      bundleMocks.discoveredData.classDataMap,
      bundleMocks.discoveredData.builds,
      bundleMocks.gameData,
      6,
      { excluded: ['bowmaster', 'marksman', 'bucc'] },
    );
  });

  it('computes sorted slot swap options from supported classes only', () => {
    engineMocks.computeBuffAttribution.mockReturnValue(
      makePartyResult(['hero', 'bowmaster'], 1000),
    );
    engineMocks.simulateParty.mockImplementation((party: { members: Array<{ className: string }> }) => {
      const totals: Record<string, number> = {
        hero: 1000,
        bowmaster: 1300,
        bucc: 900,
      };
      return makePartyResult(
        party.members.map((member) => member.className),
        totals[party.members[0]?.className ?? 'hero'] ?? 0,
      );
    });

    const { result } = renderHook(() => usePartySimulation(['hero', 'bowmaster']));
    const options = result.current.slotSwapOptions(0);

    expect(engineMocks.computeBuffAttribution).toHaveBeenCalledWith(
      {
        name: 'Custom',
        members: [{ className: 'hero' }, { className: 'bowmaster' }],
      },
      bundleMocks.discoveredData.classDataMap,
      bundleMocks.discoveredData.builds,
      bundleMocks.gameData,
    );
    expect(options).toEqual([
      { className: 'bowmaster', partyDpsDelta: 300, newTotalDps: 1300 },
      { className: 'hero', partyDpsDelta: 0, newTotalDps: 1000 },
      { className: 'bucc', partyDpsDelta: -100, newTotalDps: 900 },
    ]);
  });
});
