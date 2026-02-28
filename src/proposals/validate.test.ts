import { describe, it, expect } from 'vitest';
import { validateProposal, ProposalValidationError } from './validate.js';

describe('validateProposal', () => {
  const valid = {
    name: 'Test Buff',
    author: 'Tester',
    changes: [
      { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
    ],
  };

  it('accepts a valid proposal', () => {
    const result = validateProposal(valid);
    expect(result.name).toBe('Test Buff');
    expect(result.author).toBe('Tester');
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].to).toBe(280);
  });

  it('accepts optional description', () => {
    const result = validateProposal({ ...valid, description: 'A buff' });
    expect(result.description).toBe('A buff');
  });

  it('accepts change without from', () => {
    const result = validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', to: 280 }],
    });
    expect(result.changes[0].from).toBeUndefined();
  });

  it('rejects null input', () => {
    expect(() => validateProposal(null)).toThrow(ProposalValidationError);
    expect(() => validateProposal(null)).toThrow('must be a JSON object');
  });

  it('rejects non-object input', () => {
    expect(() => validateProposal('string')).toThrow('must be a JSON object');
    expect(() => validateProposal(42)).toThrow('must be a JSON object');
  });

  it('rejects missing name', () => {
    expect(() => validateProposal({ author: 'x', changes: [] })).toThrow('non-empty "name"');
  });

  it('rejects empty name', () => {
    expect(() => validateProposal({ name: '', author: 'x', changes: [] })).toThrow('non-empty "name"');
  });

  it('rejects missing author', () => {
    expect(() => validateProposal({ name: 'x', changes: [] })).toThrow('non-empty "author"');
  });

  it('rejects non-string description', () => {
    expect(() => validateProposal({ ...valid, description: 123 })).toThrow('"description" must be a string');
  });

  it('rejects missing changes array', () => {
    expect(() => validateProposal({ name: 'x', author: 'y' })).toThrow('"changes" array');
  });

  it('rejects empty changes array', () => {
    expect(() => validateProposal({ name: 'x', author: 'y', changes: [] })).toThrow('at least one change');
  });

  it('rejects change with invalid target format', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'HERO.brandish', field: 'basePower', to: 280 }],
    })).toThrow('className.skill-slug');
  });

  it('rejects change with no dot in target', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'herobrandish', field: 'basePower', to: 280 }],
    })).toThrow('className.skill-slug');
  });

  it('rejects change with missing field', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', to: 280 }],
    })).toThrow('field must be a non-empty string');
  });

  it('rejects change with non-number to', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', to: 'high' }],
    })).toThrow('to must be a finite number');
  });

  it('rejects change with NaN to', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', to: NaN }],
    })).toThrow('to must be a finite number');
  });

  it('rejects change with non-number from', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', from: 'old', to: 280 }],
    })).toThrow('from must be a finite number');
  });

  it('reports the change index in error messages', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
        { target: 'bad', field: 'x', to: 1 },
      ],
    })).toThrow('changes[1]');
  });
});
