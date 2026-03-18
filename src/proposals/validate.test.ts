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

  it('accepts string to value', () => {
    const result = validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'speedCategory', to: 'Hurricane' }],
    });
    expect(result.changes[0].to).toBe('Hurricane');
  });

  it('accepts string from and to values', () => {
    const result = validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'weaponType', from: '2H Sword', to: '2H Axe' }],
    });
    expect(result.changes[0].from).toBe('2H Sword');
    expect(result.changes[0].to).toBe('2H Axe');
  });

  it('rejects non-number non-string non-boolean to', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', to: [1, 2] }],
    })).toThrow('to must be a finite number, string, or boolean');
  });

  it('rejects change with NaN to', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', to: NaN }],
    })).toThrow('to must be a finite number');
  });

  it('rejects non-number non-string non-boolean from', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', from: [1, 2], to: 280 }],
    })).toThrow('from must be a finite number, string, or boolean');
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

  it('rejects trailing hyphen in class part of target', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero-.brandish', field: 'basePower', to: 280 }],
    })).toThrow('className.skill-slug');
  });

  it('rejects trailing hyphen in skill part of target', () => {
    expect(() => validateProposal({
      ...valid,
      changes: [{ target: 'hero.brandish-', field: 'basePower', to: 280 }],
    })).toThrow('className.skill-slug');
  });

  it('accepts single-character class and skill parts', () => {
    const result = validateProposal({
      ...valid,
      changes: [{ target: 'h.b', field: 'basePower', to: 280 }],
    });
    expect(result.changes[0].target).toBe('h.b');
  });
});
