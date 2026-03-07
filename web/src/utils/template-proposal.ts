import { formatClassName } from './format.js';

export interface SlotChange {
  slot: string;
  stat: string;
  from: number;
  to: number;
}

const GITHUB_REPO = 'tamosz/metra';
const MAX_URL_LENGTH = 8000;

export function generateProposalTitle(
  className: string,
  tier: string,
  changes: SlotChange[]
): string {
  const prefix = `gear template: ${className} ${tier} — `;
  const maxLen = 70;

  const parts = changes.map((c) => `${c.slot} ${c.stat}`);
  let suffix = parts.join(', ');

  if ((prefix + suffix).length > maxLen) {
    suffix = '';
    for (const part of parts) {
      const next = suffix ? `${suffix}, ${part}` : part;
      if ((prefix + next + ', ...').length > maxLen) {
        suffix += suffix ? ', ...' : '...';
        break;
      }
      suffix = next;
    }
  }

  return prefix + suffix;
}

export function formatTemplateProposal(
  className: string,
  tier: string,
  changes: SlotChange[],
  justification: string
): string {
  const displayName = formatClassName(className);
  const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);

  const lines: string[] = [
    `## Gear Template Proposal: ${displayName} (${tierDisplay})`,
    '',
    '### Changes',
    '',
    '| Slot | Stat | Current | Proposed |',
    '|------|------|---------|----------|',
  ];

  for (const change of changes) {
    lines.push(`| ${change.slot} | ${change.stat} | ${change.from} | ${change.to} |`);
  }

  lines.push('');
  lines.push('### Justification');
  lines.push('');
  if (justification.trim()) {
    lines.push(justification.trim());
  } else {
    lines.push('_No justification provided._');
  }

  lines.push('');
  lines.push('### Template File');
  lines.push('');
  lines.push(`\`data/gear-templates/${className}-${tier}.json\``);

  return lines.join('\n');
}

export function buildGitHubIssueUrl(
  title: string,
  body: string
): string | null {
  const params = new URLSearchParams({
    title,
    body,
    labels: 'gear-template',
  });
  const url = `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
  if (url.length > MAX_URL_LENGTH) return null;
  return url;
}
