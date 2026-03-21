import { useMemo } from 'react';
import { allClassBases, SHIELD_BASE_WATK, type ClassBase, type GearBudget } from '../data/bundle.js';
import { getClassColor, VARIANT_CLASS_SLUGS } from '../utils/class-colors.js';
import { colors } from '../theme.js';
import gearBudgetJson from '@data/gear-budget.json';

const budget = gearBudgetJson as GearBudget;


const CGS_SEGMENTS = [
  { label: 'Gloves', value: 24, color: '#3b82f6' },
  { label: 'Cape', value: 24, color: '#8b5cf6' },
  { label: 'Shoes', value: 24, color: '#06b6d4' },
] as const;

const CGS_TOTAL = CGS_SEGMENTS.reduce((sum, s) => sum + s.value, 0);
if (CGS_TOTAL !== budget.nonWeaponWATK) {
  throw new Error(`CGS segments (${CGS_TOTAL}) don't match nonWeaponWATK (${budget.nonWeaponWATK})`);
}

const CHART_SEGMENTS = [
  { key: 'godlyClean', label: 'Godly Clean', color: colors.accent },
  { key: 'scrolling', label: 'Scrolling (+35)', color: '#8b5cf6' },
  { key: 'cgs', label: 'C/G/S (72)', color: '#06b6d4' },
  { key: 'extras', label: 'Extras', color: '#f59e0b' },
] as const;

interface ClassRow {
  slug: string;
  base: ClassBase;
  extras: number;
  extrasLabel: string;
  totalWATK: number;
}

function getProjectileLabel(weaponType: string): string {
  switch (weaponType) {
    case 'Claw': return 'Stars';
    case 'Bow': return 'Arrows';
    case 'Crossbow': return 'Bolts';
    case 'Gun': return 'Bullets';
    default: return 'Projectile';
  }
}

function getPassiveLabel(className: string): string {
  if (className === 'Marksman') return 'MM Boost';
  return 'Bow Expert';
}

function buildExtrasLabel(base: ClassBase): string {
  const parts: string[] = [];
  if (base.passiveWATK) {
    parts.push(`${getPassiveLabel(base.className)}: 0\u2013${base.passiveWATK}`);
  }
  if (base.projectile > 0) {
    parts.push(`${getProjectileLabel(base.weaponType)}: 0\u2013${base.projectile}`);
  }
  if (base.shieldWATK) {
    const statsStr = base.shieldStats
      ? `, ${Object.entries(base.shieldStats).map(([s, v]) => `+${v} ${s}`).join(' ')}`
      : '';
    parts.push(`Shield: ${SHIELD_BASE_WATK}\u2013${base.shieldWATK} WATK${statsStr}`);
  }
  return parts.length > 0 ? parts.join(', ') : '\u2014';
}

function buildClassRows(): ClassRow[] {
  const rows: ClassRow[] = [];
  for (const [slug, base] of allClassBases) {
    if (VARIANT_CLASS_SLUGS.has(slug)) continue;
    if (base.category !== 'physical') continue;
    const extras = (base.passiveWATK ?? 0) + (base.shieldWATK ?? 0) + base.projectile;
    const totalWATK =
      base.godlyCleanWATK + budget.scrollBonus + budget.nonWeaponWATK +
      (base.passiveWATK ?? 0) + (base.shieldWATK ?? 0) + base.projectile;
    rows.push({
      slug,
      base,
      extras,
      extrasLabel: buildExtrasLabel(base),
      totalWATK,
    });
  }
  return rows;
}

function CommonGearSection() {
  const tiles = [
    { label: 'Primary Stat from Gear', value: budget.gearPrimary.toString(), subtitle: 'Helmet, top, bottom, pendant, earring, face, eye, belt, medal, rings' },
    { label: 'Secondary Stat from Gear', value: budget.gearSecondary.toString(), subtitle: 'DEX/STR/LUK from non-weapon equipment' },
    { label: 'Attack Potion', value: budget.attackPotion.toString(), subtitle: 'Onyx Apple + Attack potion' },
    { label: 'Weapon Scrolling', value: `+${budget.scrollBonus}`, subtitle: '7 slots \u00d7 5 WATK (30% dark scrolls, all pass)' },
    { label: 'Godly Bonus', value: '+5', subtitle: 'Royals godly system: +5 over MS max clean on weapon' },
  ];

  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">Common Gear</h3>
      <p className="text-sm text-text-secondary mb-4">Same for every physical class.</p>
      <div className="rounded-lg border border-border bg-bg-raised p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-lg bg-bg-surface px-4 py-3">
              <div className="text-xs text-text-muted mb-1">{tile.label}</div>
              <div className="text-xl font-bold text-text-bright">{tile.value}</div>
              <div className="text-xs text-text-dim mt-1">{tile.subtitle}</div>
            </div>
          ))}
          <div className="rounded-lg bg-bg-surface px-4 py-3">
            <div className="text-xs text-text-muted mb-1">WATK from Gear</div>
            <div className="text-xl font-bold text-text-bright mb-2">{CGS_TOTAL}</div>
            <div className="h-3 rounded-full overflow-hidden flex">
              {CGS_SEGMENTS.map((seg) => (
                <div
                  key={seg.label}
                  style={{ width: `${(seg.value / CGS_TOTAL * 100).toFixed(1)}%`, backgroundColor: seg.color }}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              {CGS_SEGMENTS.map((seg) => (
                <div key={seg.label} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-text-dim">{seg.label} {seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeaponTableSection({ rows }: { rows: ClassRow[] }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">Per-Class Weapons & Extras</h3>
      <p className="text-sm text-text-secondary mb-4">
        Weapon choice, speed tier, and class-specific WATK bonuses.
      </p>
      <div className="rounded-lg border border-border bg-bg-raised overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs">
              <th className="text-left px-4 py-2.5 font-medium">Class</th>
              <th className="text-left px-4 py-2.5 font-medium">Weapon Type</th>
              <th className="text-right px-4 py-2.5 font-medium">Speed</th>
              <th className="text-right px-4 py-2.5 font-medium">Godly Clean</th>
              <th className="text-left px-4 py-2.5 font-medium">Extras</th>
              <th className="text-right px-4 py-2.5 font-medium">Total WATK</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2 font-medium" style={{ color: getClassColor(row.base.className) }}>
                  {row.base.className}
                </td>
                <td className="px-4 py-2 text-text-secondary">{row.base.weaponType}</td>
                <td className="px-4 py-2 text-right text-text-secondary">{row.base.weaponSpeed}</td>
                <td className="px-4 py-2 text-right text-text-bright">{row.base.godlyCleanWATK}</td>
                <td className="px-4 py-2 text-text-secondary">{row.extrasLabel}</td>
                <td className="px-4 py-2 text-right font-medium text-text-bright">{row.totalWATK}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-dim mt-2">
        Total WATK = Godly Clean + Scrolling ({budget.scrollBonus}) + C/G/S ({budget.nonWeaponWATK}) + Extras.
        Night Lord and Shadower have Shadow Partner active (1.5&times; damage multiplier, not reflected in WATK totals).
      </p>
    </section>
  );
}

function WatkCompositionSection({ rows }: { rows: ClassRow[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.totalWATK - a.totalWATK),
    [rows],
  );
  const maxWATK = sorted.length > 0 ? sorted[0].totalWATK : 1;

  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">WATK Composition</h3>
      <p className="text-sm text-text-secondary mb-4">
        How each class reaches its total weapon attack.
      </p>

      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4">
        {CHART_SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-text-secondary">{seg.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-bg-raised p-4 space-y-2">
        {sorted.map((row) => {
          const segments = [
            { value: row.base.godlyCleanWATK, color: colors.accent },
            { value: budget.scrollBonus, color: '#8b5cf6' },
            { value: budget.nonWeaponWATK, color: '#06b6d4' },
            { value: row.extras, color: '#f59e0b' },
          ];
          const barWidth = (row.totalWATK / maxWATK) * 100;

          return (
            <div key={row.slug} className="flex items-center gap-2">
              <div
                className="w-[90px] shrink-0 text-right text-xs font-medium truncate"
                style={{ color: getClassColor(row.base.className) }}
              >
                {row.base.className}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="h-5 rounded flex overflow-hidden"
                  style={{ width: `${barWidth.toFixed(1)}%` }}
                >
                  {segments.map((seg, i) =>
                    seg.value > 0 ? (
                      <div
                        key={i}
                        className="h-full"
                        style={{
                          width: `${(seg.value / row.totalWATK * 100).toFixed(1)}%`,
                          backgroundColor: seg.color,
                        }}
                        title={`${CHART_SEGMENTS[i].label}: ${seg.value}`}
                      />
                    ) : null
                  )}
                </div>
              </div>
              <div className="w-10 shrink-0 text-right text-xs text-text-muted">{row.totalWATK}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ScalingChartSection() {
  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">About the Scaling Chart</h3>
      <p className="text-sm text-text-secondary mb-4">
        The scaling chart on the Dashboard shows how DPS changes as all build parameters scale from 10%
        to 100% of their max values. This reveals which classes benefit most from overall investment and
        where scaling curves diverge.
      </p>

      <div className="rounded-lg border border-border bg-bg-raised p-4">
        <div className="text-xs font-medium text-text-bright mb-2">Everything scales with %:</div>
        <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
          <li>Base stats (from leveling/AP)</li>
          <li>Primary & secondary stat from gear</li>
          <li>C/G/S WATK</li>
          <li>Weapon clean WATK & scrolling bonus</li>
          <li>Attack potion</li>
          <li>Passive WATK (Bow Expert, MM Boost)</li>
          <li>Projectiles (stars, arrows, bolts, bullets)</li>
          <li>Shadower shield WATK</li>
        </ul>
      </div>

      <p className="text-sm text-text-secondary mt-4">
        At 50%, a class has half the base stats, half the gear stats, half the weapon attack, and half the
        projectile WATK of a max build. This is a uniform power curve for comparing class scaling, not a
        model of any specific gear set.
      </p>
    </section>
  );
}

export function GearPage() {
  const rows = useMemo(() => buildClassRows(), []);

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold text-text-bright mb-2">Gear Assumptions</h2>
      <p className="text-text-secondary mb-8">
        How the simulator models gear, stats, and weapon attack across all physical classes.
      </p>

      <div className="space-y-10">
        <CommonGearSection />
        <WeaponTableSection rows={rows} />
        <WatkCompositionSection rows={rows} />
        <ScalingChartSection />
      </div>
    </div>
  );
}
