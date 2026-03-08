interface AssassinateBugNoteProps {
  classNames: string[];
}

/**
 * Renders a disclaimer when Shadower appears in rankings,
 * warning that Assassinate is bugged in-game and DPS may be overestimated.
 */
export function AssassinateBugNote({ classNames }: AssassinateBugNoteProps) {
  if (!classNames.some((c) => c === 'Shadower')) return null;

  return (
    <div className="mb-4 rounded border border-border-subtle bg-bg-raised px-4 py-3 text-xs leading-relaxed text-text-muted">
      <span className="font-medium text-text-secondary">Note: </span>
      Assassinate has a{' '}
      <a
        href="https://royals.ms/forum/threads/assassinate-and-sharp-eye.180132/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-text-secondary hover:text-text-bright"
      >
        known in-game bug
      </a>{' '}
      affecting its crit damage with SE. Shadower combo DPS shown here may be overestimated.
    </div>
  );
}
