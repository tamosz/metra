import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadProposal, parseTargetsFlag } from './cli.js';

describe('loadProposal', () => {
  function withTempFile(filename: string, content: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'cli-test-'));
    const filepath = join(dir, filename);
    writeFileSync(filepath, content, 'utf-8');
    return filepath;
  }

  it('loads and validates a well-formed proposal', () => {
    const path = withTempFile('valid.json', JSON.stringify({
      name: 'Test Proposal',
      author: 'Tester',
      changes: [{ target: 'hero.brandish-sword', field: 'basePower', to: 280 }],
    }));
    const proposal = loadProposal(path);
    expect(proposal.name).toBe('Test Proposal');
    expect(proposal.author).toBe('Tester');
    expect(proposal.changes).toHaveLength(1);
    expect(proposal.changes[0].to).toBe(280);
  });

  it('throws with path info for missing file', () => {
    expect(() => loadProposal('/nonexistent/proposal.json')).toThrow(
      /Failed to parse \/nonexistent\/proposal\.json/
    );
  });

  it('throws with parse error for invalid JSON', () => {
    const path = withTempFile('bad.json', '{ not valid json }');
    expect(() => loadProposal(path)).toThrow(/Failed to parse/);
  });

  it('throws validation error for valid JSON with invalid structure', () => {
    const path = withTempFile('no-name.json', JSON.stringify({
      author: 'Tester',
      changes: [],
    }));
    expect(() => loadProposal(path)).toThrow(/non-empty "name"/);
  });

  it('throws validation error for empty changes array', () => {
    const path = withTempFile('empty-changes.json', JSON.stringify({
      name: 'Empty',
      author: 'Tester',
      changes: [],
    }));
    expect(() => loadProposal(path)).toThrow(/at least one change/);
  });
});

describe('parseTargetsFlag', () => {
  const origArgv = process.argv;
  afterEach(() => { process.argv = origArgv; });

  it('returns undefined when no --targets flag', () => {
    process.argv = ['node', 'cli.ts'];
    expect(parseTargetsFlag()).toBeUndefined();
  });

  it('returns parsed number for valid input', () => {
    process.argv = ['node', 'cli.ts', '--targets', '6'];
    expect(parseTargetsFlag()).toBe(6);
  });

  it('floors fractional values', () => {
    process.argv = ['node', 'cli.ts', '--targets', '6.7'];
    expect(parseTargetsFlag()).toBe(6);
  });

  it('throws on missing value after --targets', () => {
    process.argv = ['node', 'cli.ts', '--targets'];
    expect(() => parseTargetsFlag()).toThrow(/positive integer/);
  });

  it('throws on non-numeric value', () => {
    process.argv = ['node', 'cli.ts', '--targets', 'abc'];
    expect(() => parseTargetsFlag()).toThrow(/positive integer/);
  });

  it('throws on zero', () => {
    process.argv = ['node', 'cli.ts', '--targets', '0'];
    expect(() => parseTargetsFlag()).toThrow(/positive integer/);
  });

  it('throws on negative value', () => {
    process.argv = ['node', 'cli.ts', '--targets', '-1'];
    expect(() => parseTargetsFlag()).toThrow(/positive integer/);
  });
});
