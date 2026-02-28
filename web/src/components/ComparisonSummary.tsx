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
    <div style={{
      background: '#12121a',
      border: '1px solid #1e1e2e',
      borderRadius: 8,
      padding: '16px 20px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
            Build A
          </div>
          <div style={{ color: getClassColor(displayA), fontWeight: 600, fontSize: 15 }}>
            {displayA}
          </div>
          <div style={{ fontSize: 13, color: '#ccc', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {bestA.skillName}: {Math.round(bestA.dps).toLocaleString()}
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: 140 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>vs</div>
          {absDelta < 0.1 ? (
            <div style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>Tied</div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: winnerColor }}>
              {winnerName} +{absDelta.toFixed(1)}%
            </div>
          )}
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
            Build B
          </div>
          <div style={{ color: getClassColor(displayB), fontWeight: 600, fontSize: 15 }}>
            {displayB}
          </div>
          <div style={{ fontSize: 13, color: '#ccc', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {bestB.skillName}: {Math.round(bestB.dps).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
