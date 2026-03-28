import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadProposal, parseTargetsFlag, parseKbFlags, main } from './cli.js';

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

describe('main error handling', () => {
  const origArgv = process.argv;
  afterEach(() => { process.argv = origArgv; });

  it('throws when given a nonexistent proposal path', () => {
    process.argv = ['node', 'cli.ts', '/nonexistent/proposal.json'];
    expect(() => main()).toThrow(/Failed to parse/);
  });

  it('throws when --targets has an invalid value', () => {
    process.argv = ['node', 'cli.ts', '--targets', 'abc'];
    expect(() => main()).toThrow(/positive integer/);
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

describe('parseKbFlags', () => {
  const origArgv = process.argv;
  afterEach(() => { process.argv = origArgv; });

  it('returns undefined when --kb is not present', () => {
    process.argv = ['node', 'cli.ts'];
    expect(parseKbFlags()).toBeUndefined();
  });

  it('returns defaults when only --kb is passed', () => {
    process.argv = ['node', 'cli.ts', '--kb'];
    const result = parseKbFlags();
    expect(result).toBeDefined();
    expect(result!.bossAttackInterval).toBe(1.5);
    expect(result!.bossAccuracy).toBe(250);
  });

  it('parses custom --kb-interval', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-interval', '2.0'];
    const result = parseKbFlags();
    expect(result!.bossAttackInterval).toBe(2.0);
    expect(result!.bossAccuracy).toBe(250);
  });

  it('parses custom --kb-accuracy', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-accuracy', '270'];
    const result = parseKbFlags();
    expect(result!.bossAttackInterval).toBe(1.5);
    expect(result!.bossAccuracy).toBe(270);
  });

  it('parses both custom --kb-interval and --kb-accuracy', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-interval', '3.0', '--kb-accuracy', '300'];
    const result = parseKbFlags();
    expect(result!.bossAttackInterval).toBe(3.0);
    expect(result!.bossAccuracy).toBe(300);
  });

  it('throws on zero --kb-interval', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-interval', '0'];
    expect(() => parseKbFlags()).toThrow(/positive number/);
  });

  it('throws on negative --kb-interval', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-interval', '-1'];
    expect(() => parseKbFlags()).toThrow(/positive number/);
  });

  it('throws on non-numeric --kb-interval', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-interval', 'abc'];
    expect(() => parseKbFlags()).toThrow(/positive number/);
  });

  it('throws on --kb-accuracy below 1', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-accuracy', '0'];
    expect(() => parseKbFlags()).toThrow(/positive integer/);
  });

  it('throws on negative --kb-accuracy', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-accuracy', '-5'];
    expect(() => parseKbFlags()).toThrow(/positive integer/);
  });

  it('throws on non-numeric --kb-accuracy', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-accuracy', 'xyz'];
    expect(() => parseKbFlags()).toThrow(/positive integer/);
  });

  it('accepts fractional --kb-interval values', () => {
    process.argv = ['node', 'cli.ts', '--kb', '--kb-interval', '0.5'];
    const result = parseKbFlags();
    expect(result!.bossAttackInterval).toBe(0.5);
  });

  it('ignores --kb-interval and --kb-accuracy without --kb flag', () => {
    process.argv = ['node', 'cli.ts', '--kb-interval', '2.0', '--kb-accuracy', '300'];
    expect(parseKbFlags()).toBeUndefined();
  });
});
