export function RankCell({ before, after }: { before?: number; after?: number }) {
  if (before == null || after == null) return <span className="text-text-faint">-</span>;
  const diff = before - after; // positive = improved (lower rank number = better)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-text-secondary">{after}</span>
      {diff !== 0 && (
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
            diff > 0 ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
          }`}
        >
          {diff > 0 ? `\u2191${diff}` : `\u2193${Math.abs(diff)}`}
        </span>
      )}
    </span>
  );
}
