import { useState, useMemo } from 'react';
import {
  allClassBases,
  computeBuildAtPowerLevel,
  type ClassBase,
} from '../data/bundle.js';
import { getClassColor, VARIANT_CLASS_SLUGS } from '../utils/class-colors.js';
import { colors } from '../theme.js';

const STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

interface ClassBuildRow {
  slug: string;
  className: string;
  color: string;
  totalWATK: number;
  primaryStat: number;
  secondaryStat: number;
  primaryLabel: string;
  secondaryLabel: string;
  attackPotion: number;
  projectile: number;
}

function getPhysicalBases(): [string, ClassBase][] {
  const entries: [string, ClassBase][] = [];
  for (const [slug, base] of allClassBases) {
    if (VARIANT_CLASS_SLUGS.has(slug)) continue;
    if (base.category !== 'physical') continue;
    entries.push([slug, base]);
  }
  return entries;
}

export function GearSlider() {
  const [power, setPower] = useState(100);

  const physicalBases = useMemo(() => getPhysicalBases(), []);

  const rows = useMemo((): ClassBuildRow[] => {
    const fraction = power / 100;
    return physicalBases.map(([slug, base]) => {
      const build = computeBuildAtPowerLevel(base, fraction);
      const secondaryArr = Array.isArray(base.secondaryStat)
        ? base.secondaryStat
        : [base.secondaryStat];
      const primaryVal =
        build.baseStats[base.primaryStat] + build.gearStats[base.primaryStat];
      const secondaryVal = secondaryArr.reduce(
        (sum, s) => sum + build.baseStats[s] + build.gearStats[s],
        0,
      );
      const secondaryLabel = secondaryArr.join('/');

      return {
        slug,
        className: base.className,
        color: getClassColor(base.className),
        totalWATK: build.totalWeaponAttack + build.projectile,
        primaryStat: primaryVal,
        secondaryStat: secondaryVal,
        primaryLabel: base.primaryStat,
        secondaryLabel,
        attackPotion: build.attackPotion,
        projectile: build.projectile,
      };
    });
  }, [power, physicalBases]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.totalWATK - a.totalWATK),
    [rows],
  );

  const maxWATK = sortedRows.length > 0 ? sortedRows[0].totalWATK : 1;
  const maxPrimary = Math.max(...rows.map((r) => r.primaryStat), 1);

  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">
        Gear Power Slider
      </h3>
      <p className="text-sm text-text-secondary mb-4">
        See how build stats change as gear scales from 10% to 100% of max values.
      </p>

      {/* Slider control */}
      <div className="rounded-lg border border-border bg-bg-raised p-4 mb-4">
        <div className="flex items-center gap-4">
          <label
            htmlFor="gear-power-slider"
            className="text-sm font-medium text-text-bright shrink-0"
          >
            Gear Power
          </label>
          <input
            id="gear-power-slider"
            type="range"
            min={10}
            max={100}
            step={10}
            value={power}
            onChange={(e) => setPower(Number(e.target.value))}
            className="flex-1 accent-blue-500"
            style={{ accentColor: colors.accent }}
          />
          <span
            className="text-lg font-bold tabular-nums shrink-0 w-14 text-right"
            style={{ color: colors.accent }}
          >
            {power}%
          </span>
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          {STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setPower(step)}
              className={`text-[10px] tabular-nums border-none bg-transparent cursor-pointer px-0.5 ${
                step === power ? 'text-text-bright font-bold' : 'text-text-dim'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      {/* Build stats table */}
      <div className="rounded-lg border border-border bg-bg-raised overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs">
              <th className="text-left px-4 py-2.5 font-medium">Class</th>
              <th className="text-right px-4 py-2.5 font-medium">Total WATK</th>
              <th className="text-left px-3 py-2.5 font-medium w-[30%]" />
              <th className="text-right px-4 py-2.5 font-medium">Primary</th>
              <th className="text-right px-4 py-2.5 font-medium">Secondary</th>
              <th className="text-right px-4 py-2.5 font-medium">Potion</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const watkBarWidth = (row.totalWATK / maxWATK) * 100;
              return (
                <tr
                  key={row.slug}
                  className="border-b border-border/50 last:border-0"
                >
                  <td
                    className="px-4 py-2 font-medium whitespace-nowrap"
                    style={{ color: row.color }}
                  >
                    {row.className}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-text-bright font-medium">
                    {row.totalWATK}
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-3 rounded-full overflow-hidden bg-bg-surface">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${watkBarWidth.toFixed(1)}%`,
                          backgroundColor: row.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-text-secondary">
                    <span className="text-text-dim text-xs mr-1">
                      {row.primaryLabel}
                    </span>
                    {row.primaryStat.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-text-secondary">
                    <span className="text-text-dim text-xs mr-1">
                      {row.secondaryLabel}
                    </span>
                    {row.secondaryStat.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-text-muted">
                    {row.attackPotion}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Primary stat bars */}
      <div className="rounded-lg border border-border bg-bg-raised p-4 mt-4">
        <div className="text-xs font-medium text-text-muted mb-3">
          Total Primary Stat at {power}%
        </div>
        <div className="space-y-1.5">
          {[...rows]
            .sort((a, b) => b.primaryStat - a.primaryStat)
            .map((row) => {
              const barWidth = (row.primaryStat / maxPrimary) * 100;
              return (
                <div key={row.slug} className="flex items-center gap-2">
                  <div
                    className="w-[90px] shrink-0 text-right text-xs font-medium truncate"
                    style={{ color: row.color }}
                  >
                    {row.className}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="h-4 rounded transition-all duration-200"
                      style={{
                        width: `${barWidth.toFixed(1)}%`,
                        backgroundColor: row.color,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs tabular-nums text-text-muted">
                    {row.primaryStat.toLocaleString()}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
