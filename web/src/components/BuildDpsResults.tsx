import type { BuildExplorerState } from '../hooks/useBuildExplorer.js';
import { encodeBuild } from '../utils/url-encoding.js';
import { colors } from '../theme.js';

interface BuildDpsResultsProps {
  state: BuildExplorerState;
  showCopyLink?: boolean;
}

export function BuildDpsResults({ state, showCopyLink = true }: BuildDpsResultsProps) {
  const { results, selectedClass, selectedTier, overrides } = state;

  const handleShare = () => {
    const encoded = encodeBuild({ class: selectedClass, tier: selectedTier, overrides });
    const url = `${window.location.origin}${window.location.pathname}#b=${encoded}`;
    navigator.clipboard.writeText(url);
  };

  const hasOverrides = Object.keys(overrides).length > 0;
  const th = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium text-left';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-text-dim">
          DPS Results
        </div>
        {showCopyLink && (
          <button
            onClick={handleShare}
            className="cursor-pointer rounded border border-border-default bg-transparent px-2.5 py-0.5 text-[11px] text-text-muted transition-colors hover:border-border-active hover:text-text-bright"
          >
            Copy Link
          </button>
        )}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className={th}>Skill</th>
            <th className={`${th} text-right`}>Your DPS</th>
            {hasOverrides && (
              <>
                <th className={`${th} text-right`}>Template</th>
                <th className={`${th} text-right`}>Change</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr
              key={row.skillName}
              className="border-b border-border-subtle hover:bg-white/[0.03]"
            >
              <td className="px-3 py-2 text-text-secondary">{row.skillName}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatDps(row.dps)}
              </td>
              {hasOverrides && (
                <>
                  <td className="px-3 py-2 text-right tabular-nums text-text-dim">
                    {formatDps(row.baselineDps)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums" style={{ color: changeColor(row.changePercent) }}>
                    {formatChange(row.changePercent)}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {results.length === 0 && (
        <div className="py-4 text-center text-sm text-text-faint">
          No skills found for this class.
        </div>
      )}
    </div>
  );
}

function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}

function formatChange(percent: number): string {
  if (Math.abs(percent) < 0.01) return '0.0%';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

function changeColor(percent: number): string {
  if (Math.abs(percent) < 0.01) return colors.textFaint;
  return percent > 0 ? colors.positive : colors.negative;
}
