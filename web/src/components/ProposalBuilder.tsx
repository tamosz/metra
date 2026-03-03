import { useState, useRef } from 'react';
import type { ProposalState } from '../hooks/useProposal.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { ProposalChange } from '@engine/proposals/types.js';
import { validateProposal } from '@engine/proposals/validate.js';
import { discoveredData } from '../data/bundle.js';
import { setProposalInUrl } from '../utils/url-encoding.js';
import { Input } from './proposal/Input.js';
import { JsonPanel } from './proposal/JsonPanel.js';
import { ChangeRow } from './proposal/ChangeRow.js';
import { AddChangeForm } from './proposal/AddChangeForm.js';

interface ProposalBuilderProps {
  proposalState: ProposalState;
  simulation: SimulationData;
}

export function ProposalBuilder({ proposalState, simulation }: ProposalBuilderProps) {
  const { proposal, simulating, setName, setAuthor, setDescription, addChange, removeChange, simulate } = proposalState;
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const discovery = discoveredData;
  const changeIdCounter = useRef(0);
  const [changeKeys, setChangeKeys] = useState<number[]>([]);

  const handleAddChange = (change: ProposalChange) => {
    addChange(change);
    const id = changeIdCounter.current++;
    setChangeKeys((prev) => [...prev, id]);
  };

  const handleRemoveChange = (index: number) => {
    removeChange(index);
    setChangeKeys((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimulate = () => {
    simulate();
    if (proposal.changes.length > 0) {
      setProposalInUrl(proposal);
    }
  };

  const handleImportJson = () => {
    try {
      const raw = JSON.parse(jsonInput);
      const validated = validateProposal(raw);
      proposalState.loadProposal(validated);
      const keys = validated.changes.map(() => changeIdCounter.current++);
      setChangeKeys(keys);
      setJsonError('');
      setShowJson(false);
    } catch (e) {
      setJsonError(e instanceof SyntaxError ? 'Invalid JSON' : (e as Error).message);
    }
  };

  const disabled = proposal.changes.length === 0 || !proposal.name || simulating;

  return (
    <div>
      {proposalState.error && (
        <div className="mb-4 rounded border border-red-700/30 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          Simulation error: {proposalState.error.message}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold">Proposal Builder</h2>
        <button
          onClick={() => setShowJson(!showJson)}
          className="cursor-pointer border-none bg-transparent p-0 text-xs text-accent hover:text-blue-400 transition-colors"
        >
          {showJson ? 'Close JSON' : 'Import/Export JSON'}
        </button>
      </div>

      {showJson && (
        <JsonPanel
          proposal={proposal}
          jsonInput={jsonInput}
          setJsonInput={setJsonInput}
          jsonError={jsonError}
          onImport={handleImportJson}
        />
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Name" value={proposal.name} onChange={setName} placeholder="e.g. Brandish Buff" />
        <Input label="Author" value={proposal.author} onChange={setAuthor} placeholder="Your name" />
      </div>
      <Input
        label="Description"
        value={proposal.description ?? ''}
        onChange={setDescription}
        placeholder="What does this change do and why?"
      />

      <div className="mt-5 mb-2 flex items-center justify-between">
        <h3 className="m-0 text-[13px] font-semibold uppercase tracking-wide text-text-muted">
          Changes
        </h3>
      </div>

      {proposal.changes.map((change, i) => (
        <ChangeRow key={changeKeys[i] ?? i} change={change} discovery={discovery} onRemove={() => handleRemoveChange(i)} />
      ))}

      <AddChangeForm simulation={simulation} discovery={discovery} onAdd={handleAddChange} />

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSimulate}
          disabled={disabled}
          className={`rounded-md border border-border-active bg-bg-active px-5 py-2 text-sm font-medium text-text-primary transition-colors ${
            disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-zinc-700'
          }`}
        >
          {simulating ? 'Simulating...' : 'Simulate'}
        </button>
      </div>
    </div>
  );
}
