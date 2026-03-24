import { useState } from 'react';
import { gearSlots, type GearSlotStats, type GearBudget } from '../data/bundle.js';
import gearBudgetJson from '@data/gear-budget.json';

const SLOT_DISPLAY_NAMES: Record<string, string> = {
  helmet: 'Helmet',
  overall: 'Overall',
  glove: 'Gloves',
  cape: 'Cape',
  shoe: 'Shoes',
  earring: 'Earring',
  eye: 'Eye Acc.',
  face: 'Face Acc.',
  pendant: 'Pendant',
  shoulder: 'Shoulder',
  belt: 'Belt',
  medal: 'Medal',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  ring3: 'Ring 3',
  ring4: 'Ring 4',
};

const TOTALS = {
  primary: Object.values(gearSlots).reduce((s, v) => s + v.primary, 0),
  secondary: Object.values(gearSlots).reduce((s, v) => s + v.secondary, 0),
  watk: Object.values(gearSlots).reduce((s, v) => s + v.watk, 0),
};

const budget = gearBudgetJson as GearBudget;
if (TOTALS.primary !== budget.gearPrimary) {
  throw new Error(`gear-slots primary (${TOTALS.primary}) != gearPrimary (${budget.gearPrimary})`);
}
if (TOTALS.secondary !== budget.gearSecondary) {
  throw new Error(`gear-slots secondary (${TOTALS.secondary}) != gearSecondary (${budget.gearSecondary})`);
}
if (TOTALS.watk !== budget.nonWeaponWATK) {
  throw new Error(`gear-slots WATK (${TOTALS.watk}) != nonWeaponWATK (${budget.nonWeaponWATK})`);
}

// Accessory slots arranged around the mannequin — positioned to feel like an equipment screen
const ACCESSORY_SLOTS = [
  // Left column — face/head accessories
  { key: 'earring', top: 18, left: 6 },
  { key: 'eye', top: 56, left: 6 },
  { key: 'face', top: 94, left: 6 },
  { key: 'pendant', top: 132, left: 6 },
  // Right column — body accessories
  { key: 'cape', top: 18, right: 6 },
  { key: 'shoulder', top: 56, right: 6 },
  { key: 'belt', top: 94, right: 6 },
  { key: 'medal', top: 132, right: 6 },
] as const;

const RINGS = ['ring1', 'ring2', 'ring3', 'ring4'] as const;

const STAT_COLORS = { primary: '#3b82f6', secondary: '#8b5cf6', watk: '#22c55e' };
const STAT_LABELS = { primary: 'Primary', secondary: 'Secondary', watk: 'WATK' };

function slotStyle(slotKey: string, hoveredSlot: string | null) {
  const isHovered = hoveredSlot === slotKey;
  const dimmed = hoveredSlot !== null && !isHovered;
  return {
    fill: isHovered ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.04)',
    stroke: isHovered ? '#3b82f6' : '#555',
    strokeWidth: isHovered ? 2.5 : 1.5,
    opacity: dimmed ? 0.35 : 1,
    transition: 'all 0.15s',
    cursor: 'pointer' as const,
  };
}

function iconStyle(slotKey: string, hoveredSlot: string | null): React.CSSProperties {
  const isHovered = hoveredSlot === slotKey;
  const dimmed = hoveredSlot !== null && !isHovered;
  return {
    border: `1.5px solid ${isHovered ? '#3b82f6' : '#333'}`,
    background: isHovered ? 'rgba(59,130,246,0.1)' : 'transparent',
    opacity: dimmed ? 0.35 : 1,
    transition: 'all 0.15s',
  };
}

function StatPanel({ hoveredSlot }: { hoveredSlot: string | null }) {
  if (hoveredSlot === null) {
    return (
      <div className="flex items-center justify-center gap-8 py-3 min-h-[52px]">
        {(['primary', 'secondary', 'watk'] as const).map((stat) => (
          <div key={stat} className="text-center">
            <div className="text-lg font-semibold text-text-bright">{TOTALS[stat]}</div>
            <div className="text-xs text-text-muted">{STAT_LABELS[stat]}</div>
          </div>
        ))}
      </div>
    );
  }

  const slot = gearSlots[hoveredSlot] as GearSlotStats | undefined;
  if (!slot) return null;

  const displayName = SLOT_DISPLAY_NAMES[hoveredSlot] ?? hoveredSlot;
  const stats = [
    { key: 'primary' as const, value: slot.primary },
    { key: 'secondary' as const, value: slot.secondary },
    { key: 'watk' as const, value: slot.watk },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex items-center justify-center gap-8 py-3 min-h-[52px]">
      <div className="text-sm font-semibold text-text-bright">{displayName}</div>
      {stats.map((s) => {
        const pct = TOTALS[s.key] > 0 ? (s.value / TOTALS[s.key]) * 100 : 0;
        return (
          <div key={s.key} className="text-center">
            <div className="text-lg font-semibold text-text-bright">+{s.value}</div>
            <div className="text-xs text-text-muted">{STAT_LABELS[s.key]}</div>
            <div className="w-16 h-1 rounded-full mt-1 mx-auto" style={{ background: '#27272a' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: STAT_COLORS[s.key], transition: 'width 0.15s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function GearMannequin() {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const handlers = (key: string) => ({
    onMouseEnter: () => setHoveredSlot(key),
    onMouseLeave: () => setHoveredSlot(null),
    onClick: () => setHoveredSlot((prev) => (prev === key ? null : key)),
  });

  const ss = (key: string) => slotStyle(key, hoveredSlot);

  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">Gear Breakdown</h3>
      <p className="text-sm text-text-secondary mb-4">
        Where the shared gear budget comes from, slot by slot.
      </p>

      <div className="rounded-lg border border-border bg-bg-raised p-6">
        {/* Centered mannequin with accessories */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: 280, height: 230 }}>
            {/* Accessory icons */}
            {ACCESSORY_SLOTS.map((slot) => (
              <div
                key={slot.key}
                className="absolute flex items-center justify-center rounded text-xs text-text-secondary cursor-pointer select-none"
                style={{
                  top: slot.top,
                  ...('left' in slot ? { left: slot.left } : { right: slot.right }),
                  width: 40,
                  height: 30,
                  fontSize: 10,
                  ...iconStyle(slot.key, hoveredSlot),
                }}
                {...handlers(slot.key)}
              >
                {SLOT_DISPLAY_NAMES[slot.key]?.slice(0, 4)}
              </div>
            ))}

            {/* SVG mannequin — chibi MapleStory style */}
            <svg
              viewBox="0 0 160 220"
              style={{ position: 'absolute', left: 60, top: 0, width: 160, height: 220 }}
            >
              {/* Head / Helmet — big round chibi head */}
              <ellipse
                cx="80" cy="45" rx="36" ry="38"
                style={ss('helmet')}
                strokeLinejoin="round"
                {...handlers('helmet')}
              />
              {/* Cute face */}
              <circle cx="67" cy="47" r="2.5" fill="#555" style={{ pointerEvents: 'none', opacity: hoveredSlot && hoveredSlot !== 'helmet' ? 0.35 : 1, transition: 'opacity 0.15s' }} />
              <circle cx="93" cy="47" r="2.5" fill="#555" style={{ pointerEvents: 'none', opacity: hoveredSlot && hoveredSlot !== 'helmet' ? 0.35 : 1, transition: 'opacity 0.15s' }} />
              <path d="M73,56 Q80,62 87,56" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none', opacity: hoveredSlot && hoveredSlot !== 'helmet' ? 0.35 : 1, transition: 'opacity 0.15s' }} />

              {/* Body / Overall — rounded stubby torso */}
              <path
                d="M55,83 C50,87 47,98 47,112 C47,128 49,140 53,148 L107,148 C111,140 113,128 113,112 C113,98 110,87 105,83 Z"
                style={ss('overall')}
                strokeLinejoin="round"
                {...handlers('overall')}
              />

              {/* Left arm / Glove */}
              <path
                d="M47,95 C40,102 33,116 31,128 C30,135 33,139 38,139 C43,139 47,133 47,126"
                style={ss('glove')}
                strokeLinejoin="round"
                strokeLinecap="round"
                {...handlers('glove')}
              />

              {/* Right arm / Glove */}
              <path
                d="M113,95 C120,102 127,116 129,128 C130,135 127,139 122,139 C117,139 113,133 113,126"
                style={ss('glove')}
                strokeLinejoin="round"
                strokeLinecap="round"
                {...handlers('glove')}
              />

              {/* Left leg / Shoe */}
              <path
                d="M63,148 L61,174 C61,174 59,184 54,186 C49,188 46,186 46,183 C46,180 51,178 54,178 L61,174"
                style={ss('shoe')}
                strokeLinejoin="round"
                strokeLinecap="round"
                {...handlers('shoe')}
              />

              {/* Right leg / Shoe */}
              <path
                d="M97,148 L99,174 C99,174 101,184 106,186 C111,188 114,186 114,183 C114,180 109,178 106,178 L99,174"
                style={ss('shoe')}
                strokeLinejoin="round"
                strokeLinecap="round"
                {...handlers('shoe')}
              />
            </svg>

            {/* Rings along the bottom */}
            <div
              className="absolute flex gap-1.5 justify-center"
              style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
            >
              {RINGS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-center text-text-secondary cursor-pointer select-none"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    fontSize: 10,
                    ...iconStyle(key, hoveredSlot),
                  }}
                  {...handlers(key)}
                >
                  {SLOT_DISPLAY_NAMES[key]?.replace('Ring ', 'R')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat panel — below mannequin, full width */}
        <div className="border-t border-border mt-4 pt-1">
          <StatPanel hoveredSlot={hoveredSlot} />
        </div>
      </div>
    </section>
  );
}
