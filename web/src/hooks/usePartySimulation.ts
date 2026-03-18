import { useMemo } from 'react';
import {
  computeBuffAttribution,
  simulateParty,
  findOptimalParty,
  PARTY_PRESETS,
  type Party,
  type PartySimulationResult,
  type PresetParty,
} from '@metra/engine';
import { discoveredData, weaponData, attackSpeedData, mwData } from '../data/bundle.js';

export interface SlotSwapOption {
  className: string;
  partyDpsDelta: number;
  newTotalDps: number;
}

export interface UsePartySimulationResult {
  result: PartySimulationResult | null;
  presets: PresetParty[];
  slotSwapOptions: (memberIndex: number) => SlotSwapOption[];
  topParties: PartySimulationResult[];
}

export function usePartySimulation(members: string[]): UsePartySimulationResult {
  const { classDataMap, gearTemplates } = discoveredData;

  const result = useMemo(() => {
    if (members.length === 0) return null;
    const party: Party = { name: 'Custom', members: members.map(className => ({ className })) };
    return computeBuffAttribution(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
  }, [members, classDataMap, gearTemplates]);

  const topParties = useMemo(() => {
    const opt = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 6, undefined, 25);
    return opt.topParties;
  }, [classDataMap, gearTemplates]);

  const presets = useMemo(() => {
    return PARTY_PRESETS.map(preset => {
      if (!preset.autoComputed) return preset;
      if (preset.name === 'Meta') {
        const opt = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
        return { ...preset, members: opt.optimal.members.map(m => ({ className: m.className })) };
      }
      if (preset.name === 'No Support') {
        const opt = findOptimalParty(classDataMap, gearTemplates, weaponData, attackSpeedData, mwData, 6,
          { excluded: ['bowmaster', 'marksman', 'bucc', 'hero', 'hero-axe'] });
        return { ...preset, members: opt.optimal.members.map(m => ({ className: m.className })) };
      }
      return preset;
    });
  }, [classDataMap, gearTemplates]);

  const slotSwapOptions = useMemo(() => {
    if (!result) return () => [];
    const allClasses = [...classDataMap.keys()].filter(c => gearTemplates.has(`${c}-perfect`));
    return (memberIndex: number): SlotSwapOption[] => {
      const options: SlotSwapOption[] = [];
      for (const candidate of allClasses) {
        const swapped = members.map((m, i) => (i === memberIndex ? candidate : m));
        const party: Party = { name: 'Swap', members: swapped.map(className => ({ className })) };
        const swapResult = simulateParty(party, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
        options.push({ className: candidate, partyDpsDelta: swapResult.totalDps - result.totalDps, newTotalDps: swapResult.totalDps });
      }
      options.sort((a, b) => b.partyDpsDelta - a.partyDpsDelta);
      return options;
    };
  }, [result, members, classDataMap, gearTemplates]);

  return { result, presets, slotSwapOptions, topParties };
}
