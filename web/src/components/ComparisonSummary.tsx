import { getClassColor } from '../utils/class-colors.js';
import { formatClassName } from '../utils/format.js';

interface ComparisonSummaryProps {
  classA: string;
  classB: string;
  bestA: { skillName: string; dps: number };
  bestB: { skillName: string; dps: number };
  deltaPercent: number;
}

export function ComparisonSummary({ classA, classB, bestA, bestB, deltaPercent }: ComparisonSummaryProps) {
  const displayA = formatClassName(classA);
  const displayB = formatClassName(classB);
  const aWins = bestA.dps >= bestB.dps;
  const winnerName = aWins ? displayA : displayB;
  const winnerColor = aWins ? getClassColor(displayA) : getClassColor(displayB);
  const absDelta = Math.abs(deltaPercent);

  return (
    <div className="mb-5 rounded-lg border border-border-subtle bg-bg-raised px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="mb-1 text-[11px] uppercase text-text-muted">
            Build A
          </div>
          <div className="text-[15px] font-semibold" style={{ color: getClassColor(displayA) }}>
            {displayA}
          </div>
          <div className="mt-0.5 text-[13px] tabular-nums text-text-primary">
            {bestA.skillName}: {Math.round(bestA.dps).toLocaleString()}
          </div>
        </div>

        <div className="min-w-[140px] text-center">
          <div className="mb-1 text-[11px] text-text-dim">vs</div>
          {absDelta < 0.1 ? (
            <div className="text-sm font-medium text-text-muted">Tied</div>
          ) : (
            <div className="text-sm font-semibold" style={{ color: winnerColor }}>
              {winnerName} +{absDelta.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <div className="mb-1 text-[11px] uppercase text-text-muted">
            Build B
          </div>
          <div className="text-[15px] font-semibold" style={{ color: getClassColor(displayB) }}>
            {displayB}
          </div>
          <div className="mt-0.5 text-[13px] tabular-nums text-text-primary">
            {bestB.skillName}: {Math.round(bestB.dps).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
