interface ArcherPassiveNoteProps {
  classNames: string[];
}

/**
 * Renders a note when archer classes appear in rankings,
 * clarifying that passive WA from Bow Expert / Marksman Boost
 * is already included in the displayed values.
 */
export function ArcherPassiveNote({ classNames }: ArcherPassiveNoteProps) {
  const hasArcher = classNames.some((c) => c === 'Bowmaster' || c === 'Marksman');
  if (!hasArcher) return null;

  return (
    <div className="mb-4 rounded border border-border-subtle bg-bg-raised px-4 py-3 text-xs leading-relaxed text-text-muted">
      <span className="font-medium text-text-secondary">Note: </span>
      Archer WATK totals already include passive bonuses from Bow Expert (+10) and Marksman Boost (+15).
    </div>
  );
}
