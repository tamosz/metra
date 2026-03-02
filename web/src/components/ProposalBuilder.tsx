import { useState, useRef } from 'react';
import type { ProposalState } from '../hooks/useProposal.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { ProposalChange, Proposal } from '@engine/proposals/types.js';
import { skillSlug } from '@engine/proposals/apply.js';
import { validateProposal } from '@engine/proposals/validate.js';
import {
  discoveredData,
  type DiscoveryResult,
} from '../data/bundle.js';
import { setProposalInUrl } from '../utils/url-encoding.js';
const FIELD_LABELS: Record<string, string> = {
  basePower: 'Base Power',
  multiplier: 'Multiplier',
  hitCount: 'Hit Count',
};

function resolveChangeDisplay(
  target: string,
  discovery: DiscoveryResult
): { className: string; skillName: string } | null {
  const dotIndex = target.indexOf('.');
  if (dotIndex === -1) return null;
  const classKey = target.slice(0, dotIndex);
  const skillKey = target.slice(dotIndex + 1);
  const classData = discovery.classDataMap.get(classKey);
  if (!classData) return null;
  const skill = classData.skills.find((s) => skillSlug(s.name) === skillKey);
  return {
    className: classData.className,
    skillName: skill?.name ?? skillKey,
  };
}

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

function JsonPanel({
  proposal,
  jsonInput,
  setJsonInput,
  jsonError,
  onImport,
}: {
  proposal: Proposal;
  jsonInput: string;
  setJsonInput: (s: string) => void;
  jsonError: string;
  onImport: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-border-default bg-bg-raised p-4">
      <div className="mb-3">
        <div className="mb-1 text-xs text-text-muted">Export (current proposal)</div>
        <pre data-testid="json-export" className="m-0 max-h-[200px] overflow-auto rounded bg-bg p-3 text-xs text-text-secondary">
          {JSON.stringify(proposal, null, 2)}
        </pre>
      </div>
      <div>
        <div className="mb-1 text-xs text-text-muted">Import</div>
        <textarea
          data-testid="json-import"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste proposal JSON here..."
          className="h-[100px] w-full resize-y rounded border border-border-default bg-bg-raised px-2.5 py-1.5 font-mono text-xs text-text-primary focus:border-border-active transition-colors"
        />
        {jsonError && <div className="mt-1 text-xs text-negative">{jsonError}</div>}
        <button onClick={onImport} className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs text-accent hover:text-blue-400 transition-colors">
          Import
        </button>
      </div>
    </div>
  );
}

function ChangeRow({ change, discovery, onRemove }: { change: ProposalChange; discovery: DiscoveryResult; onRemove: () => void }) {
  const display = resolveChangeDisplay(change.target, discovery);
  const fieldLabel = FIELD_LABELS[change.field] ?? change.field;

  return (
    <div data-testid="change-row" className="mb-1.5 flex items-center gap-2 rounded-md bg-bg-raised px-3 py-2 text-sm">
      {display ? (
        <>
          <span className="font-medium text-text-primary">{display.className}</span>
          <span className="text-text-dim">&mdash;</span>
          <span className="text-text-secondary">{display.skillName}:</span>
        </>
      ) : (
        <span className="text-text-muted">{change.target}</span>
      )}
      <span className="text-text-muted">{fieldLabel}</span>
      {change.from !== undefined && (
        <span className="text-text-dim">{change.from}</span>
      )}
      <span className="text-text-faint">&rarr;</span>
      <span className="font-semibold text-accent">{change.to}</span>
      <button onClick={onRemove} className="ml-auto cursor-pointer border-none bg-transparent p-0 text-xs text-negative hover:text-red-400 transition-colors">
        Remove
      </button>
    </div>
  );
}

function AddChangeForm({
  simulation,
  discovery,
  onAdd,
}: {
  simulation: SimulationData;
  discovery: DiscoveryResult;
  onAdd: (change: ProposalChange) => void;
}) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [field, setField] = useState('basePower');
  const [newValue, setNewValue] = useState('');

  const classData = selectedClass ? discovery.classDataMap.get(selectedClass) : null;
  const skills = classData?.skills ?? [];
  const skill = skills.find((s) => skillSlug(s.name) === selectedSkill);

  const currentValue = skill && field in skill ? (skill as unknown as Record<string, unknown>)[field] : undefined;

  const handleAdd = () => {
    if (!selectedClass || !selectedSkill || !newValue) return;
    const target = `${selectedClass}.${selectedSkill}`;
    const change: ProposalChange = {
      target,
      field,
      to: Number(newValue),
    };
    if (currentValue !== undefined && typeof currentValue === 'number') {
      change.from = currentValue;
    }
    onAdd(change);
    setNewValue('');
  };

  const addDisabled = !selectedClass || !selectedSkill || !newValue;
  const selectClass = 'w-full rounded border border-border-default bg-bg-raised px-2.5 py-1.5 text-sm text-text-primary focus:border-border-active transition-colors';
  const labelClass = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted';

  return (
    <div className="mt-2 grid items-end gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_120px_100px_80px]">
      <div>
        <label className={labelClass}>Class</label>
        <select
          data-testid="class-select"
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setSelectedSkill(''); }}
          className={selectClass}
        >
          <option value="">Select class...</option>
          {simulation.classNames.map((name) => (
            <option key={name} value={name}>{discovery.classDataMap.get(name)?.className ?? name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Skill</label>
        <select
          data-testid="skill-select"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className={selectClass}
          disabled={!selectedClass}
        >
          <option value="">Select skill...</option>
          {skills.map((s) => (
            <option key={skillSlug(s.name)} value={skillSlug(s.name)}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Field</label>
        <select data-testid="field-select" value={field} onChange={(e) => setField(e.target.value)} className={selectClass}>
          <option value="basePower">Base Power</option>
          <option value="multiplier">Multiplier</option>
          <option value="hitCount">Hit Count</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>
          New value
          {currentValue !== undefined && (
            <span className="text-text-dim font-normal"> (was {String(currentValue)})</span>
          )}
        </label>
        <input
          data-testid="new-value-input"
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className={selectClass}
          placeholder={currentValue !== undefined ? String(currentValue) : ''}
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={addDisabled}
        className={`rounded-md border border-border-active bg-bg-active px-3 py-1.5 text-xs font-medium text-text-primary transition-colors ${
          addDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-zinc-700'
        }`}
      >
        Add
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-border-default bg-bg-raised px-2.5 py-1.5 text-sm text-text-primary focus:border-border-active transition-colors"
      />
    </div>
  );
}
