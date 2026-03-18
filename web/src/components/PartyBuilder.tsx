import { useState, useCallback } from 'react';
import { usePartySimulation } from '../hooks/usePartySimulation.js';
import { getPartyFromUrl, setPartyInUrl } from '../utils/url-encoding.js';
import { PartyRoster } from './PartyRoster.js';
import { PartyGrid } from './PartyGrid.js';
import { PartyBuffBar } from './PartyBuffBar.js';
import { PartyAttribution } from './PartyAttribution.js';
import { SlotSwapPanel } from './SlotSwapPanel.js';
import { PresetSelector } from './PresetSelector.js';
import { PartyTierList } from './PartyTierList.js';

export function PartyBuilder() {
  const [members, setMembers] = useState<string[]>(() => getPartyFromUrl() ?? []);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const { result, presets, slotSwapOptions } = usePartySimulation(members);

  const addMember = useCallback((className: string) => {
    setMembers(prev => {
      if (prev.length >= 6) return prev;
      const next = [...prev, className];
      setPartyInUrl(next);
      return next;
    });
  }, []);

  const removeMember = useCallback((index: number) => {
    setMembers(prev => {
      const next = prev.filter((_, i) => i !== index);
      setPartyInUrl(next);
      return next;
    });
    setSelectedMemberIndex(prev => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const setPartyMembers = useCallback((next: { className: string }[]) => {
    const classNames = next.map((m) => m.className);
    setMembers(classNames);
    setPartyInUrl(classNames);
    setSelectedMemberIndex(null);
  }, []);

  const swapOptions = selectedMemberIndex !== null ? slotSwapOptions(selectedMemberIndex) : [];
  const selectedMember = selectedMemberIndex !== null ? result?.members[selectedMemberIndex] : null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-text-bright">Party Builder</h2>
      <p className="mb-4 text-sm text-text-muted">
        Drag classes into your party to see total DPS, buff attribution, and slot swap analysis.
      </p>

      <PresetSelector presets={presets} onSelect={setPartyMembers} />

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

          {result && result.members.length > 0 && (
            <PartyAttribution
              members={result.members}
              onSelectMember={setSelectedMemberIndex}
              selectedMemberIndex={selectedMemberIndex}
            />
          )}

          {selectedMemberIndex !== null && selectedMember && (
            <SlotSwapPanel
              currentClassName={selectedMember.className}
              options={swapOptions}
            />
          )}
        </div>
      </div>
      <div className="mt-8 border-t border-border-default pt-6">
        <h3 className="mb-4 text-base font-semibold text-text-bright">Top Parties</h3>
        <p className="mb-4 text-sm text-text-muted">
          Best party compositions ranked by total DPS. Click a bar to see the breakdown.
        </p>
        <PartyTierList onLoadParty={setPartyMembers} />
      </div>
    </div>
  );
}
