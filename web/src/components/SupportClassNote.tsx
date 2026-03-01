import { getSupportClassNames, getSupportClassNote } from '../utils/class-meta.js';
import { formatClassName } from '../utils/format.js';

interface SupportClassNoteProps {
  /** Pass all class names (multi-class views) or a single class name */
  classNames: string[];
}

/**
 * Renders a subtle disclaimer when support classes appear in rankings.
 * Returns null if no support classes are present.
 */
export function SupportClassNote({ classNames }: SupportClassNoteProps) {
  const supportClasses = getSupportClassNames(classNames);
  if (supportClasses.length === 0) return null;

  return (
    <div className="mb-4 rounded border border-border-subtle bg-bg-raised px-4 py-3 text-xs leading-relaxed text-text-muted">
      <span className="font-medium text-text-secondary">Note: </span>
      {supportClasses.length === 1 ? (
        getSupportClassNote(supportClasses[0])
      ) : (
        <>
          {supportClasses.map((cls) => (
            <span key={cls} className="block mt-1">
              <span className="text-text-secondary">{formatClassName(cls)}</span>
              {': '}
              {getSupportClassNote(cls)}
            </span>
          ))}
        </>
      )}
      <span className="block mt-1 text-text-dim">
        Rankings below reflect solo DPS only and do not account for party contribution.
      </span>
    </div>
  );
}
