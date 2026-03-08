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
      Assassinate has a known in-game bug affecting its crit damage with SE.
      Shadower combo DPS shown here may be overestimated.
    </div>
  );
}
