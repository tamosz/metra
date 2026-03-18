import { useState, useCallback } from 'react';
import { usePartySimulation } from '../hooks/usePartySimulation.js';
import { getPartyFromUrl, setPartyInUrl } from '../utils/url-encoding.js';
import { PartyRoster } from './PartyRoster.js';
import { PartyGrid } from './PartyGrid.js';
import { PartyBuffBar } from './PartyBuffBar.js';

export function PartyBuilder() {
  const [members, setMembers] = useState<string[]>(() => getPartyFromUrl() ?? []);
  const { result, presets, slotSwapOptions } = usePartySimulation(members);

  const addMember = useCallback((className: string) => {
    if (members.length >= 6) return;
    const next = [...members, className];
    setMembers(next);
    setPartyInUrl(next);
  }, [members]);

  const removeMember = useCallback((index: number) => {
    const next = members.filter((_, i) => i !== index);
    setMembers(next);
    setPartyInUrl(next);
  }, [members]);

  const setPartyMembers = useCallback((next: string[]) => {
    setMembers(next);
    setPartyInUrl(next);
  }, []);

  // Suppress unused variable warnings — these will be used in future tasks
  void presets;
  void slotSwapOptions;
  void setPartyMembers;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-text-bright">Party Builder</h2>
      <p className="mb-4 text-sm text-text-muted">
        Drag classes into your party to see total DPS, buff attribution, and slot swap analysis.
      </p>
      <div className="flex gap-4">
        <PartyRoster onAddMember={addMember} />
        <div className="flex-1">
          <PartyGrid
            members={members}
            memberResults={result?.members ?? []}
            onDrop={addMember}
            onRemove={removeMember}
          />
          {result && <PartyBuffBar buffs={result.activeBuffs} totalDps={result.totalDps} />}
        </div>
      </div>
    </div>
  );
}
