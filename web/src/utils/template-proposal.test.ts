import { describe, it, expect } from 'vitest';
import {
  formatTemplateProposal,
  buildGitHubIssueUrl,
  generateProposalTitle,
  type SlotChange,
} from './template-proposal.js';

describe('generateProposalTitle', () => {
  it('generates title from changes', () => {
    const changes: SlotChange[] = [
      { slot: 'helmet', stat: 'STR', from: 22, to: 25 },
      { slot: 'pendant', stat: 'STR', from: 27, to: 30 },
    ];
    expect(generateProposalTitle('hero', 'high', changes)).toBe(
      'gear template: hero high — helmet STR, pendant STR'
    );
  });

  it('truncates when many changes', () => {
    const changes: SlotChange[] = Array.from({ length: 10 }, (_, i) => ({
      slot: `ring${i}`,
      stat: 'STR',
      from: 1,
      to: 2,
    }));
    const title = generateProposalTitle('hero', 'high', changes);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).toContain('...');
  });
});

describe('formatTemplateProposal', () => {
  it('generates markdown with changes table and justification', () => {
    const changes: SlotChange[] = [
      { slot: 'helmet', stat: 'STR', from: 22, to: 25 },
    ];
    const md = formatTemplateProposal('hero', 'high', changes, 'BiS helmet gives 25 STR');
    expect(md).toContain('## Gear Template Proposal: Hero (High)');
    expect(md).toContain('| helmet | STR | 22 | 25 |');
    expect(md).toContain('BiS helmet gives 25 STR');
    expect(md).toContain('`data/gear-templates/hero-high.json`');
  });

  it('includes empty justification section when no justification', () => {
    const changes: SlotChange[] = [
      { slot: 'weapon', stat: 'WATK', from: 140, to: 145 },
    ];
    const md = formatTemplateProposal('hero', 'high', changes, '');
    expect(md).toContain('### Justification');
    expect(md).toContain('_No justification provided._');
  });
});

describe('buildGitHubIssueUrl', () => {
  it('returns a URL for normal-length content', () => {
    const url = buildGitHubIssueUrl('test title', 'test body');
    expect(url).not.toBeNull();
    expect(url).toContain('github.com/tamosz/metra/issues/new');
    expect(url).toContain('title=');
    expect(url).toContain('body=');
    expect(url).toContain('labels=gear-template');
  });

  it('returns null when content exceeds URL limit', () => {
    const longBody = 'x'.repeat(9000);
    const url = buildGitHubIssueUrl('title', longBody);
    expect(url).toBeNull();
  });
});
