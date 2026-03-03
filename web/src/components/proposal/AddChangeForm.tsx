import { useState } from 'react';
import type { ProposalChange } from '@engine/proposals/types.js';
import { skillSlug } from '@engine/proposals/apply.js';
import type { SimulationData } from '../../hooks/useSimulation.js';
import type { DiscoveryResult } from '../../data/bundle.js';

export function AddChangeForm({
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
