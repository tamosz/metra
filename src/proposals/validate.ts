import type { Proposal, ProposalChange } from './types.js';

export class ProposalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProposalValidationError';
  }
}

/**
 * Validate a proposal object has the correct shape and values.
 * Throws ProposalValidationError with a descriptive message on failure.
 */
export function validateProposal(data: unknown): Proposal {
  if (data == null || typeof data !== 'object') {
    throw new ProposalValidationError('Proposal must be a JSON object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.name !== 'string' || obj.name.trim() === '') {
    throw new ProposalValidationError('Proposal must have a non-empty "name" string');
  }

  if (typeof obj.author !== 'string' || obj.author.trim() === '') {
    throw new ProposalValidationError('Proposal must have a non-empty "author" string');
  }

  if (obj.description !== undefined && typeof obj.description !== 'string') {
    throw new ProposalValidationError('"description" must be a string if provided');
  }

  if (!Array.isArray(obj.changes)) {
    throw new ProposalValidationError('Proposal must have a "changes" array');
  }

  if (obj.changes.length === 0) {
    throw new ProposalValidationError('Proposal must have at least one change');
  }

  const changes: ProposalChange[] = [];
  for (let i = 0; i < obj.changes.length; i++) {
    changes.push(validateChange(obj.changes[i], i));
  }

  return {
    name: obj.name,
    author: obj.author,
    description: obj.description as string | undefined,
    changes,
  };
}

const TARGET_RE = /^[a-z]([a-z0-9-]*[a-z0-9])?\.[a-z]([a-z0-9-]*[a-z0-9])?$/;

function validateChange(data: unknown, index: number): ProposalChange {
  const prefix = `changes[${index}]`;

  if (data == null || typeof data !== 'object') {
    throw new ProposalValidationError(`${prefix} must be an object`);
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.target !== 'string' || !TARGET_RE.test(obj.target)) {
    throw new ProposalValidationError(
      `${prefix}.target must be "className.skill-slug" (lowercase, e.g. "hero.brandish-sword")`
    );
  }

  if (typeof obj.field !== 'string' || obj.field.trim() === '') {
    throw new ProposalValidationError(`${prefix}.field must be a non-empty string`);
  }

  if (typeof obj.to === 'number') {
    if (!isFinite(obj.to)) {
      throw new ProposalValidationError(`${prefix}.to must be a finite number`);
    }
  } else if (typeof obj.to !== 'string' && typeof obj.to !== 'boolean') {
    throw new ProposalValidationError(`${prefix}.to must be a finite number, string, or boolean`);
  }

  if (obj.from !== undefined) {
    if (typeof obj.from === 'number') {
      if (!isFinite(obj.from)) {
        throw new ProposalValidationError(`${prefix}.from must be a finite number if provided`);
      }
    } else if (typeof obj.from !== 'string' && typeof obj.from !== 'boolean') {
      throw new ProposalValidationError(`${prefix}.from must be a finite number, string, or boolean if provided`);
    }
  }

  return {
    target: obj.target,
    field: obj.field,
    to: obj.to as number | string | boolean,
    from: obj.from as number | string | boolean | undefined,
  };
}
