import { useState } from 'react';
import type { ProposalState } from '../hooks/useProposal.js';
import type { SimulationData } from '../hooks/useSimulation.js';
import type { ProposalChange, Proposal } from '@engine/proposals/types.js';
import { skillSlug } from '@engine/proposals/apply.js';
import {
  discoverClassesAndTiers,
} from '../data/bundle.js';
import { setProposalInUrl } from '../utils/url-encoding.js';

interface ProposalBuilderProps {
  proposalState: ProposalState;
  simulation: SimulationData;
}

const focusStyleTag = `
  .metra-input:focus { border-color: #3a3a6e !important; }
`;

export function ProposalBuilder({ proposalState, simulation }: ProposalBuilderProps) {
  const { proposal, simulating, setName, setAuthor, setDescription, addChange, removeChange, simulate } = proposalState;
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const handleSimulate = () => {
    simulate();
    if (proposal.changes.length > 0) {
      setProposalInUrl(proposal);
    }
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput) as Proposal;
      if (!parsed.name || !parsed.changes) {
        setJsonError('Invalid proposal format');
        return;
      }
      proposalState.loadProposal(parsed);
      setJsonError('');
      setShowJson(false);
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  return (
    <div>
      <style>{focusStyleTag}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Proposal Builder</h2>
        <button
          onClick={() => setShowJson(!showJson)}
          style={linkButtonStyle}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Input label="Name" value={proposal.name} onChange={setName} placeholder="e.g. Brandish Buff" />
        <Input label="Author" value={proposal.author} onChange={setAuthor} placeholder="Your name" />
      </div>
      <Input
        label="Description"
        value={proposal.description ?? ''}
        onChange={setDescription}
        placeholder="What does this change do and why?"
      />

      <div style={{ marginTop: 20, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Changes
        </h3>
      </div>

      {proposal.changes.map((change, i) => (
        <ChangeRow key={i} change={change} onRemove={() => removeChange(i)} />
      ))}

      <AddChangeForm simulation={simulation} onAdd={addChange} />

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={handleSimulate}
          disabled={proposal.changes.length === 0 || !proposal.name || simulating}
          style={{
            ...buttonStyle,
            opacity: proposal.changes.length === 0 || !proposal.name || simulating ? 0.4 : 1,
            cursor: proposal.changes.length === 0 || !proposal.name || simulating ? 'not-allowed' : 'pointer',
          }}
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
    <div style={{
      background: '#12121a',
      border: '1px solid #1e1e2e',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Export (current proposal)</div>
        <pre data-testid="json-export" style={{
          background: '#0a0a0f',
          padding: 12,
          borderRadius: 4,
          fontSize: 12,
          overflow: 'auto',
          maxHeight: 200,
          color: '#aaa',
          margin: 0,
        }}>
          {JSON.stringify(proposal, null, 2)}
        </pre>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Import</div>
        <textarea
          className="metra-input"
          data-testid="json-import"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste proposal JSON here..."
          style={{
            ...inputStyle,
            height: 100,
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: 12,
          }}
        />
        {jsonError && <div style={{ color: '#e05555', fontSize: 12, marginTop: 4 }}>{jsonError}</div>}
        <button onClick={onImport} style={{ ...linkButtonStyle, marginTop: 8 }}>
          Import
        </button>
      </div>
    </div>
  );
}

function ChangeRow({ change, onRemove }: { change: ProposalChange; onRemove: () => void }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 12px',
      background: '#12121a',
      borderRadius: 6,
      marginBottom: 6,
      fontSize: 13,
    }}>
      <span style={{ color: '#888' }}>{change.target}</span>
      <span style={{ color: '#666' }}>.</span>
      <span style={{ color: '#aaa' }}>{change.field}</span>
      {change.from !== undefined && (
        <span style={{ color: '#666' }}>{change.from}</span>
      )}
      <span style={{ color: '#555' }}>&rarr;</span>
      <span style={{ fontWeight: 600, color: '#55b8e0' }}>{change.to}</span>
      <button onClick={onRemove} style={{ ...linkButtonStyle, color: '#e05555', marginLeft: 'auto' }}>
        Remove
      </button>
    </div>
  );
}

function AddChangeForm({
  simulation,
  onAdd,
}: {
  simulation: SimulationData;
  onAdd: (change: ProposalChange) => void;
}) {
  const discovery = discoverClassesAndTiers();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [field, setField] = useState('basePower');
  const [newValue, setNewValue] = useState('');

  const classData = selectedClass ? discovery.classDataMap.get(selectedClass) : null;
  const skills = classData?.skills ?? [];
  const skill = skills.find((s) => skillSlug(s.name) === selectedSkill);

  const currentValue = skill && field in skill ? (skill as Record<string, unknown>)[field] : undefined;

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

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 120px 100px 80px',
      gap: 8,
      marginTop: 8,
      alignItems: 'end',
    }}>
      <div>
        <label style={labelStyle}>Class</label>
        <select
          className="metra-input"
          data-testid="class-select"
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setSelectedSkill(''); }}
          style={inputStyle}
        >
          <option value="">Select class...</option>
          {simulation.classNames.map((name) => (
            <option key={name} value={name}>{discovery.classDataMap.get(name)?.className ?? name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Skill</label>
        <select
          className="metra-input"
          data-testid="skill-select"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          style={inputStyle}
          disabled={!selectedClass}
        >
          <option value="">Select skill...</option>
          {skills.map((s) => (
            <option key={skillSlug(s.name)} value={skillSlug(s.name)}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Field</label>
        <select className="metra-input" data-testid="field-select" value={field} onChange={(e) => setField(e.target.value)} style={inputStyle}>
          <option value="basePower">basePower</option>
          <option value="multiplier">multiplier</option>
          <option value="hitCount">hitCount</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>
          New value
          {currentValue !== undefined && (
            <span style={{ color: '#666', fontWeight: 400 }}> (was {String(currentValue)})</span>
          )}
        </label>
        <input
          className="metra-input"
          data-testid="new-value-input"
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          style={inputStyle}
          placeholder={currentValue !== undefined ? String(currentValue) : ''}
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={!selectedClass || !selectedSkill || !newValue}
        style={{
          ...buttonStyle,
          padding: '6px 12px',
          fontSize: 12,
          opacity: !selectedClass || !selectedSkill || !newValue ? 0.4 : 1,
          cursor: !selectedClass || !selectedSkill || !newValue ? 'not-allowed' : 'pointer',
        }}
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
    <div style={{ marginBottom: 8 }}>
      <label style={labelStyle}>{label}</label>
      <input
        className="metra-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#12121a',
  border: '1px solid #1e1e2e',
  borderRadius: 4,
  padding: '6px 10px',
  color: '#e0e0e8',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  background: '#2a2a4e',
  color: '#e0e0e8',
  border: '1px solid #3a3a6e',
  borderRadius: 6,
  padding: '8px 20px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#55b8e0',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
};
