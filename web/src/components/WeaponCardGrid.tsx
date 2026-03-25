import { useRef, useState } from 'react';
import { type ClassBase, type GearBudget } from '../data/bundle.js';
import { getClassColor, getClassColorWithOpacity } from '../utils/class-colors.js';
import gearBudgetJson from '@data/gear-budget.json';

const budget = gearBudgetJson as GearBudget;

interface ClassRow {
  slug: string;
  base: ClassBase;
  extras: number;
  totalWATK: number;
}

function weaponLabel(base: ClassBase): string {
  return base.shieldWATK ? `${base.weaponType} + Shield` : base.weaponType;
}

function weaponWATK(base: ClassBase): number {
  return base.godlyCleanWATK + budget.scrollBonus;
}

function cardStyle(row: ClassRow, hoveredSlug: string | null) {
  const color = getClassColor(row.base.className);
  const isHovered = hoveredSlug === row.slug;
  const dimmed = hoveredSlug !== null && !isHovered;
  return {
    border: `1.5px solid ${isHovered ? color : '#333'}`,
    background: isHovered ? getClassColorWithOpacity(row.base.className, 0.08) : 'rgba(39,39,42,0.3)',
    opacity: dimmed ? 0.35 : 1,
    transition: 'all 0.15s',
    padding: '14px 8px 12px',
  };
}

function WeaponIcon({ className, color }: { className: string; color: string }) {
  switch (className) {
    case 'Hero':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <line x1="7" y1="25" x2="22" y2="6" stroke={color} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="6" cy="26" r="2.5" fill={color} opacity="0.4"/>
          <line x1="8" y1="21" x2="11" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M20,8 Q24,4 26,8" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <circle cx="26" cy="4" r="1" fill={color} opacity="0.6"/>
          <circle cx="28" cy="6" r="0.6" fill={color} opacity="0.4"/>
        </svg>
      );
    case 'Dark Knight':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <line x1="16" y1="28" x2="16" y2="8" stroke={color} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="16" cy="5" r="3" fill={color} opacity="0.3"/>
          <path d="M16,5 L13,10 L16,8 L19,10 Z" fill={color}/>
          <circle cx="12" cy="7" r="1.5" fill={color} opacity="0.2"/>
          <circle cx="20" cy="7" r="1.5" fill={color} opacity="0.2"/>
          <circle cx="22" cy="4" r="0.8" fill={color} opacity="0.5"/>
        </svg>
      );
    case 'Paladin':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <path d="M16,4 C8,4 5,10 5,16 C5,22 10,28 16,28 C22,28 27,22 27,16 C27,10 24,4 16,4 Z" fill={color} opacity="0.15" stroke={color} strokeWidth="2"/>
          <line x1="16" y1="9" x2="16" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="10" y1="16" x2="22" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="10" cy="9" r="1" fill={color} opacity="0.5"/>
          <circle cx="22" cy="9" r="0.7" fill={color} opacity="0.4"/>
        </svg>
      );
    case 'Night Lord':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <path d="M16,4 L18,12 L26,12 L20,17 L22,25 L16,20 L10,25 L12,17 L6,12 L14,12 Z"
                fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="16" cy="15" r="2.5" fill={color} opacity="0.5"/>
          <circle cx="26" cy="6" r="1" fill={color} opacity="0.5"/>
          <circle cx="28" cy="8" r="0.6" fill={color} opacity="0.3"/>
          <circle cx="5" cy="22" r="0.7" fill={color} opacity="0.3"/>
        </svg>
      );
    case 'Shadower':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <circle cx="19" cy="18" r="8" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5"/>
          <line x1="8" y1="26" x2="20" y2="8" stroke={color} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="7" cy="27" r="2" fill={color} opacity="0.4"/>
          <path d="M18,10 Q22,7 23,11" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <circle cx="25" cy="6" r="0.8" fill={color} opacity="0.5"/>
        </svg>
      );
    case 'Bowmaster':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <path d="M8,26 Q4,16 8,6" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="8" y1="6" x2="8" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="16" x2="26" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <path d="M24,9 L28,8 L25,12" fill={color} opacity="0.8"/>
          <circle cx="28" cy="7" r="1" fill={color} opacity="0.5"/>
          <circle cx="29" cy="9" r="0.5" fill={color} opacity="0.3"/>
        </svg>
      );
    case 'Marksman':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <circle cx="16" cy="16" r="10" fill={color} opacity="0.1" stroke={color} strokeWidth="2"/>
          <circle cx="16" cy="16" r="5" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6"/>
          <circle cx="16" cy="16" r="2" fill={color} opacity="0.7"/>
          <line x1="16" y1="3" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="26" x2="16" y2="29" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="16" x2="6" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="16" x2="29" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="6" r="1" fill={color} opacity="0.5"/>
          <circle cx="26" cy="8" r="0.6" fill={color} opacity="0.3"/>
        </svg>
      );
    case 'Corsair':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <rect x="4" y="12" width="17" height="7" rx="3" fill={color} opacity="0.2" stroke={color} strokeWidth="2"/>
          <line x1="21" y1="15.5" x2="25" y2="15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="27" cy="15.5" r="2.5" fill={color} opacity="0.25"/>
          <circle cx="28" cy="13" r="1.2" fill={color} opacity="0.2"/>
          <circle cx="29" cy="17" r="1" fill={color} opacity="0.15"/>
          <path d="M8,19 L7,25 Q7,27 9,27 L11,27 Q13,27 13,25 L12,19" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="27" cy="9" r="0.8" fill={color} opacity="0.5"/>
          <circle cx="29" cy="11" r="0.5" fill={color} opacity="0.3"/>
        </svg>
      );
    case 'Buccaneer':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-1">
          <circle cx="16" cy="16" r="9" fill={color} opacity="0.15" stroke={color} strokeWidth="2"/>
          <circle cx="11" cy="10" r="2.5" fill={color} opacity="0.25" stroke={color} strokeWidth="1"/>
          <circle cx="16" cy="8.5" r="2.5" fill={color} opacity="0.25" stroke={color} strokeWidth="1"/>
          <circle cx="21" cy="10" r="2.5" fill={color} opacity="0.25" stroke={color} strokeWidth="1"/>
          <circle cx="9" cy="16" r="2" fill={color} opacity="0.2" stroke={color} strokeWidth="1"/>
          <line x1="26" y1="8" x2="28" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <line x1="27" y1="12" x2="30" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          <line x1="25" y1="5" x2="26" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
        </svg>
      );
    default:
      return <div className="text-2xl mb-1">•</div>;
  }
}

function StatPanel({ rows, hoveredSlug }: { rows: ClassRow[]; hoveredSlug: string | null }) {
  if (hoveredSlug === null) {
    const watks = rows.map((r) => weaponWATK(r.base));
    if (watks.length === 0) return null;
    const avg = Math.round(watks.reduce((a, b) => a + b, 0) / watks.length);
    const min = Math.min(...watks);
    const max = Math.max(...watks);
    return (
      <div className="flex items-center justify-center gap-8 py-3 min-h-[52px]">
        <div className="text-center">
          <div className="text-lg font-semibold text-text-bright">{rows.length}</div>
          <div className="text-xs text-text-muted">Classes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-bright">{avg}</div>
          <div className="text-xs text-text-muted">Avg Weapon</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-text-bright">{min}–{max}</div>
          <div className="text-xs text-text-muted">Range</div>
        </div>
      </div>
    );
  }

  const row = rows.find((r) => r.slug === hoveredSlug);
  if (!row) return null;

  const color = getClassColor(row.base.className);
  const stats: { label: string; value: string }[] = [
    { label: 'Godly Clean', value: String(row.base.godlyCleanWATK) },
    { label: 'Scrolling', value: `+${budget.scrollBonus}` },
  ];
  if (row.base.shieldWATK) {
    stats.push({ label: 'Shield', value: `+${row.base.shieldWATK}` });
  }
  stats.push({ label: 'Base', value: `Speed ${row.base.weaponSpeed}` });

  return (
    <div className="flex items-center justify-center gap-8 py-3 min-h-[52px]">
      <div className="text-sm font-semibold" style={{ color }}>{row.base.className}</div>
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-lg font-semibold text-text-bright">{s.value}</div>
          <div className="text-xs text-text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function WeaponCardGrid({ rows }: { rows: ClassRow[] }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [sticky, setSticky] = useState(false);
  const hoveredRef = useRef<string | null>(null);
  hoveredRef.current = hoveredSlug;

  const handlers = (slug: string) => ({
    onMouseEnter: () => { if (!sticky) setHoveredSlug(slug); },
    onMouseLeave: () => { if (!sticky) setHoveredSlug(null); },
    onClick: () => {
      const wasSticky = sticky && hoveredRef.current === slug;
      if (wasSticky) {
        setHoveredSlug(null);
        setSticky(false);
      } else {
        setHoveredSlug(slug);
        setSticky(true);
      }
    },
  });

  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">Per-Class Weapons</h3>
      <p className="text-sm text-text-secondary mb-4">
        Weapon WATK at perfect scrolling. Hover for breakdown.
      </p>

      <div className="rounded-lg border border-border bg-bg-raised p-6">
        <div className="grid grid-cols-3 gap-2">
          {rows.map((row) => {
            const color = getClassColor(row.base.className);
            return (
              <div
                key={row.slug}
                className="rounded-lg text-center cursor-pointer"
                style={cardStyle(row, hoveredSlug)}
                {...handlers(row.slug)}
              >
                <WeaponIcon className={row.base.className} color={color} />
                <div className="text-[22px] font-bold text-text-bright mb-0.5">
                  {weaponWATK(row.base)}
                </div>
                <div className="text-xs font-semibold" style={{ color }}>
                  {row.base.className}
                </div>
                <div className="text-[10px] text-text-muted">{weaponLabel(row.base)}</div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border mt-4 pt-1">
          <StatPanel rows={rows} hoveredSlug={hoveredSlug} />
        </div>
      </div>
    </section>
  );
}
