import { useState, useCallback } from 'react';
import { usePartySimulation } from '../hooks/usePartySimulation.js';
import { getPartyFromUrl, setPartyInUrl } from '../utils/url-encoding.js';

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

  const loadPreset = useCallback((presetMembers: { className: string }[]) => {
    const next = presetMembers.map(m => m.className);
    setMembers(next);
    setPartyInUrl(next);
  }, []);

  // Suppress unused variable warnings — these will be used in future tasks
  void addMember;
  void removeMember;
  void setPartyMembers;
  void presets;
  void slotSwapOptions;
  void loadPreset;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-text-bright">Party Builder</h2>
      <p className="text-sm text-text-muted">
        Drag classes into your party to see total DPS, buff attribution, and slot swap analysis.
      </p>
      <div className="mt-4 text-text-dim">
        Party: {members.join(', ') || '(empty)'} — Total DPS: {result?.totalDps?.toLocaleString() ?? '—'}
      </div>
    </div>
  );
}
