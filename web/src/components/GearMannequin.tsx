import { useState } from 'react';
import { gearSlots, type GearSlotStats } from '../data/bundle.js';

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

// SVG body slots — keys map to gear-slots.json
const BODY_SLOTS: Record<string, { type: 'ellipse' | 'path'; attrs: Record<string, string | number> }[]> = {
  helmet: [{ type: 'ellipse', attrs: { cx: 90, cy: 32, rx: 24, ry: 28 } }],
  overall: [{ type: 'path', attrs: { d: 'M63,60 L48,80 L48,165 L132,165 L132,80 L117,60' } }],
  glove: [
    { type: 'path', attrs: { d: 'M48,80 L26,140 L26,158 L38,158 L42,145' } },
    { type: 'path', attrs: { d: 'M132,80 L154,140 L154,158 L142,158 L138,145' } },
  ],
  shoe: [
    { type: 'path', attrs: { d: 'M63,165 L58,268 L46,280 L78,280 L76,268' } },
    { type: 'path', attrs: { d: 'M117,165 L122,268 L134,280 L102,280 L104,268' } },
  ],
};

// Floating accessory positions (left side, right side)
const LEFT_ACCESSORIES = [
  { key: 'earring', top: 20, left: -56 },
  { key: 'eye', top: 60, left: -56 },
  { key: 'face', top: 100, left: -56 },
  { key: 'pendant', top: 140, left: -56 },
];

const RIGHT_ACCESSORIES = [
  { key: 'shoulder', top: 20, right: -56 },
  { key: 'belt', top: 60, right: -56 },
  { key: 'medal', top: 100, right: -56 },
];

const RINGS = ['ring1', 'ring2', 'ring3', 'ring4'];

const STAT_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  watk: '#22c55e',
};

const STAT_LABELS = {
  primary: 'Primary',
  secondary: 'Secondary',
  watk: 'WATK',
};

function slotFill(slotKey: string, hoveredSlot: string | null): string {
  if (hoveredSlot === null) return 'rgba(59,130,246,0.05)';
  if (hoveredSlot === slotKey) return 'rgba(59,130,246,0.12)';
  return 'rgba(59,130,246,0.05)';
}

function slotStroke(slotKey: string, hoveredSlot: string | null): string {
  if (hoveredSlot === slotKey) return '#3b82f6';
  return '#555';
}

function slotOpacity(slotKey: string, hoveredSlot: string | null): number {
  if (hoveredSlot === null) return 1;
  return hoveredSlot === slotKey ? 1 : 0.4;
}

function iconStyle(
  slotKey: string,
  hoveredSlot: string | null,
): React.CSSProperties {
  const isHovered = hoveredSlot === slotKey;
  const dimmed = hoveredSlot !== null && !isHovered;
  return {
    border: `1.5px solid ${isHovered ? '#3b82f6' : '#555'}`,
    background: isHovered ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
    opacity: dimmed ? 0.4 : 1,
    transition: 'all 0.15s',
  };
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">% of {label.toLowerCase()}</span>
        <span className="text-text-secondary">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.15s' }}
        />
      </div>
    </div>
  );
}

function StatPanel({ hoveredSlot }: { hoveredSlot: string | null }) {
  if (hoveredSlot === null) {
    return (
      <div className="rounded-lg border border-border bg-bg-raised p-4">
        <div className="text-sm font-semibold text-text-bright mb-3">Gear Totals</div>
        <div className="h-px mb-3" style={{ background: '#27272a' }} />
        <div className="space-y-2">
          {(['primary', 'secondary', 'watk'] as const).map((stat) => (
            <div key={stat} className="flex justify-between text-sm">
              <span className="text-text-secondary">{STAT_LABELS[stat]}</span>
              <span className="text-text-bright font-medium">{TOTALS[stat]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-dim mt-4">
          Hover a slot to see its contribution
        </p>
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
    <div className="rounded-lg border border-border bg-bg-raised p-4">
      <div className="text-sm font-semibold text-text-bright mb-3">{displayName}</div>
      <div className="h-px mb-3" style={{ background: '#27272a' }} />
      <div className="space-y-1 mb-4">
        {stats.map((s) => (
          <div key={s.key} className="flex justify-between text-sm">
            <span className="text-text-secondary">{STAT_LABELS[s.key]}</span>
            <span className="text-text-bright font-medium">+{s.value}</span>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {stats.map((s) => (
          <StatBar
            key={s.key}
            label={STAT_LABELS[s.key]}
            value={s.value}
            total={TOTALS[s.key]}
            color={STAT_COLORS[s.key]}
          />
        ))}
      </div>
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

  return (
    <section>
      <h3 className="text-base font-semibold text-text-bright mb-1">Gear Breakdown</h3>
      <p className="text-sm text-text-secondary mb-4">
        Where the shared gear budget comes from, slot by slot.
      </p>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
        {/* Mannequin area */}
        <div className="relative" style={{ width: 260, height: 400 }}>
          {/* Left accessories */}
          {LEFT_ACCESSORIES.map(({ key, top, left }) => (
            <div
              key={key}
              className="absolute flex items-center justify-center rounded-md text-xs text-text-secondary cursor-pointer select-none"
              style={{
                top,
                left: 130 + left - 20,
                width: 44,
                height: 32,
                ...iconStyle(key, hoveredSlot),
              }}
              {...handlers(key)}
            >
              {SLOT_DISPLAY_NAMES[key]?.slice(0, 3)}
            </div>
          ))}

          {/* Right accessories */}
          {RIGHT_ACCESSORIES.map(({ key, top, right }) => (
            <div
              key={key}
              className="absolute flex items-center justify-center rounded-md text-xs text-text-secondary cursor-pointer select-none"
              style={{
                top,
                right: 130 + right - 20 - 44,
                width: 44,
                height: 32,
                ...iconStyle(key, hoveredSlot),
              }}
              {...handlers(key)}
            >
              {SLOT_DISPLAY_NAMES[key]?.slice(0, 3)}
            </div>
          ))}

          {/* SVG mannequin */}
          <svg
            viewBox="0 0 180 340"
            className="absolute"
            style={{ left: 40, top: 30, width: 180, height: 340 }}
          >
            {/* Cape — behind body, dashed. Invisible wide paths for hover target. */}
            <path d="M58,68 Q35,130 40,200" fill="none" stroke="transparent" strokeWidth="16" style={{ cursor: 'pointer' }} {...handlers('cape')} />
            <path d="M122,68 Q145,130 140,200" fill="none" stroke="transparent" strokeWidth="16" style={{ cursor: 'pointer' }} {...handlers('cape')} />
            <path
              d="M58,68 Q35,130 40,200"
              fill="none"
              stroke={slotStroke('cape', hoveredSlot)}
              strokeWidth="1.5"
              strokeDasharray="5,4"
              style={{
                opacity: slotOpacity('cape', hoveredSlot),
                transition: 'all 0.15s',
                pointerEvents: 'none',
              }}
            />
            <path
              d="M122,68 Q145,130 140,200"
              fill="none"
              stroke={slotStroke('cape', hoveredSlot)}
              strokeWidth="1.5"
              strokeDasharray="5,4"
              style={{
                opacity: slotOpacity('cape', hoveredSlot),
                transition: 'all 0.15s',
                pointerEvents: 'none',
              }}
            />

            {/* Body slots */}
            {Object.entries(BODY_SLOTS).map(([slotKey, shapes]) =>
              shapes.map((shape, i) => {
                const commonProps = {
                  key: `${slotKey}-${i}`,
                  fill: slotFill(slotKey, hoveredSlot),
                  stroke: slotStroke(slotKey, hoveredSlot),
                  strokeWidth: 2,
                  style: {
                    opacity: slotOpacity(slotKey, hoveredSlot),
                    transition: 'all 0.15s',
                    cursor: 'pointer' as const,
                  },
                  ...handlers(slotKey),
                };
                if (shape.type === 'ellipse') {
                  return <ellipse {...commonProps} {...(shape.attrs as React.SVGProps<SVGEllipseElement>)} />;
                }
                return <path {...commonProps} {...(shape.attrs as React.SVGProps<SVGPathElement>)} />;
              }),
            )}

            {/* Slot labels on the body */}
            <text x="90" y="37" textAnchor="middle" fontSize="10" fill="#888" style={{ pointerEvents: 'none' }}>
              Helm
            </text>
            <text x="90" y="120" textAnchor="middle" fontSize="10" fill="#888" style={{ pointerEvents: 'none' }}>
              Overall
            </text>
            <text x="26" y="152" textAnchor="middle" fontSize="8" fill="#888" style={{ pointerEvents: 'none' }}>
              Glv
            </text>
            <text x="154" y="152" textAnchor="middle" fontSize="8" fill="#888" style={{ pointerEvents: 'none' }}>
              Glv
            </text>
            <text x="62" y="260" textAnchor="middle" fontSize="8" fill="#888" style={{ pointerEvents: 'none' }}>
              Shoe
            </text>
            <text x="118" y="260" textAnchor="middle" fontSize="8" fill="#888" style={{ pointerEvents: 'none' }}>
              Shoe
            </text>
          </svg>

          {/* Ring icons along the bottom */}
          <div
            className="absolute flex gap-2 justify-center"
            style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            {RINGS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-center text-xs text-text-secondary cursor-pointer select-none"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  ...iconStyle(key, hoveredSlot),
                }}
                {...handlers(key)}
              >
                {SLOT_DISPLAY_NAMES[key]?.replace('Ring ', 'R')}
              </div>
            ))}
          </div>
        </div>

        {/* Stat panel */}
        <div className="w-full sm:w-[220px] shrink-0">
          <StatPanel hoveredSlot={hoveredSlot} />
        </div>
      </div>
    </section>
  );
}
