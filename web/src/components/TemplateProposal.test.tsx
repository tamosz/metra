import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TemplateProposal } from './TemplateProposal.js';
import type { SlotChange } from '../utils/template-proposal.js';

describe('TemplateProposal', () => {
  afterEach(cleanup);

  const changes: SlotChange[] = [
    { slot: 'weapon', stat: 'WATK', from: 140, to: 145 },
  ];

  it('renders change count and template name', () => {
    render(<TemplateProposal className="hero" tier="high" changes={changes} />);
    expect(screen.getByText(/1 change/)).toBeTruthy();
    expect(screen.getByText(/hero-high template/)).toBeTruthy();
  });

  it('renders justification textarea', () => {
    render(<TemplateProposal className="hero" tier="high" changes={changes} />);
    expect(screen.getByPlaceholderText(/Why should these values change/)).toBeTruthy();
  });

  it('renders GitHub issue link and copy button', () => {
    render(<TemplateProposal className="hero" tier="high" changes={changes} />);
    expect(screen.getByText('Open as GitHub Issue')).toBeTruthy();
    expect(screen.getByText('Copy to Clipboard')).toBeTruthy();
  });

  it('GitHub issue link opens in new tab', () => {
    render(<TemplateProposal className="hero" tier="high" changes={changes} />);
    const link = screen.getByText('Open as GitHub Issue');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
