import { useState, useCallback } from 'react';
import {
  formatTemplateProposal,
  buildGitHubIssueUrl,
  generateProposalTitle,
  type SlotChange,
} from '../utils/template-proposal.js';

interface TemplateProposalProps {
  className: string;
  tier: string;
  changes: SlotChange[];
}

export function TemplateProposal({ className, tier, changes }: TemplateProposalProps) {
  const [justification, setJustification] = useState('');
  const [copied, setCopied] = useState(false);

  const title = generateProposalTitle(className, tier, changes);
  const body = formatTemplateProposal(className, tier, changes, justification);
  const issueUrl = buildGitHubIssueUrl(title, body);

  const handleCopy = useCallback(async () => {
    try {
      const text = `**${title}**\n\n${body}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or permission denied — silent fail
    }
  }, [title, body]);

  const btnBase =
    'cursor-pointer rounded border px-3 py-1.5 text-xs font-medium transition-colors';
  const btnPrimary = `${btnBase} border-accent bg-accent/10 text-accent hover:bg-accent/20`;
  const btnSecondary = `${btnBase} border-border-default bg-transparent text-text-muted hover:border-border-active hover:text-text-secondary`;

  return (
    <div className="mt-5 rounded border border-border-subtle bg-bg-raised p-4">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-dim">
        Propose Changes
      </div>
      <p className="mb-3 text-xs text-text-dim">
        {changes.length} change{changes.length !== 1 ? 's' : ''} to {className}-{tier} template.
        Submit as a GitHub issue for review.
      </p>

      <textarea
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        placeholder="Why should these values change? (optional but helpful)"
        rows={3}
        className="mb-3 w-full resize-y rounded border border-border-default bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-border-active transition-colors"
      />

      <div className="flex items-center gap-2">
        {issueUrl ? (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            Open as GitHub Issue
          </a>
        ) : (
          <span className="text-xs text-text-dim">
            Proposal too large for GitHub URL — use copy instead.
          </span>
        )}
        <button type="button" onClick={handleCopy} className={btnSecondary}>
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
}
