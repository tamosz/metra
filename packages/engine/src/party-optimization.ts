import type { ClassSkillData, CharacterBuild, GameData } from './types.js';
import { simulateParty, type Party, type PartySimulationResult } from './party.js';

export interface OptimizationConstraints {
  required?: string[];
  excluded?: string[];
  maxDuplicates?: number;
}

export interface OptimizationResult {
  optimal: PartySimulationResult;
  topParties: PartySimulationResult[];
}

function combinationsWithRepetition(items: string[], k: number): string[][] {
  const results: string[][] = [];
  function generate(start: number, current: string[]) {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      generate(i, current);
      current.pop();
    }
  }
  generate(0, []);
  return results;
}

export function findOptimalParty(
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>,
  gameData: GameData,
  partySize: number = 6,
  constraints?: OptimizationConstraints,
  topN: number = 10,
): OptimizationResult {
  let availableClasses = [...classDataMap.keys()].filter((c) => gearTemplates.has(`${c}-perfect`));

  if (constraints?.excluded) {
    const excluded = new Set(constraints.excluded);
    availableClasses = availableClasses.filter((c) => !excluded.has(c));
  }

  const required = constraints?.required ?? [];
  const comboSize = partySize - required.length;
  if (comboSize < 0) {
    throw new Error(`Required classes (${required.length}) exceed party size (${partySize})`);
  }

  let combos = combinationsWithRepetition(availableClasses, comboSize);

  if (constraints?.maxDuplicates !== undefined) {
    const max = constraints.maxDuplicates;
    combos = combos.filter((combo) => {
      const full = [...required, ...combo];
      const counts = new Map<string, number>();
      for (const c of full) {
        const n = (counts.get(c) ?? 0) + 1;
        if (n > max) return false;
        counts.set(c, n);
      }
      return true;
    });
  }

  const results: PartySimulationResult[] = [];
  for (const combo of combos) {
    const members = [...required, ...combo].map((className) => ({ className }));
    const party: Party = { name: '', members };
    results.push(simulateParty(party, classDataMap, gearTemplates, gameData));
  }

  if (results.length === 0) {
    throw new Error('No valid party compositions found with the given constraints');
  }

  results.sort((a, b) => b.totalDps - a.totalDps);

  return { optimal: results[0], topParties: results.slice(0, topN) };
}
