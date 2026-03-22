import { useState, useEffect, useCallback } from 'react';
import { AccordionSection } from './formulas/AccordionSection.js';
import { StatCalculationSection } from './formulas/StatCalculationSection.js';
import { AttackCalculationSection } from './formulas/AttackCalculationSection.js';
import { DamageRangeSection } from './formulas/DamageRangeSection.js';
import { CriticalDamageSection } from './formulas/CriticalDamageSection.js';
import { AttackSpeedSection } from './formulas/AttackSpeedSection.js';
import { DamageCapSection } from './formulas/DamageCapSection.js';
import { DpsFormulaSection } from './formulas/DpsFormulaSection.js';
import { KnockbackModelingSection } from './formulas/KnockbackModelingSection.js';
import { ClassReferenceSection } from './formulas/ClassReferenceSection.js';

const SECTIONS = [
  { id: 'stats', label: 'Stat Calculation', subtitle: 'MW boost, total stats' },
  { id: 'attack', label: 'Attack Calculation', subtitle: 'Echo, total attack, weapon multipliers' },
  { id: 'damage-range', label: 'Damage Range', subtitle: 'Standard, throwing star, magic' },
  { id: 'crit', label: 'Critical Damage', subtitle: 'SE crit, built-in crit' },
  { id: 'speed', label: 'Attack Speed', subtitle: 'Booster, SI, fixed-speed skills' },
  { id: 'damage-cap', label: 'Damage Cap', subtitle: '199,999 cap, adjusted ranges' },
  { id: 'dps', label: 'DPS Formula', subtitle: 'Skill %, crit weighting, combos' },
  { id: 'knockback', label: 'Knockback Modeling', subtitle: 'Stance, dodge, uptime loss' },
  { id: 'class-reference', label: 'Class Reference', subtitle: 'Per-class config table' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const SECTION_COMPONENTS: Record<SectionId, React.ComponentType> = {
  'stats': StatCalculationSection,
  'attack': AttackCalculationSection,
  'damage-range': DamageRangeSection,
  'crit': CriticalDamageSection,
  'speed': AttackSpeedSection,
  'damage-cap': DamageCapSection,
  'dps': DpsFormulaSection,
  'knockback': KnockbackModelingSection,
  'class-reference': ClassReferenceSection,
};

export function FormulasPage() {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() => {
    const hash = window.location.hash.slice(1);
    const initial = new Set<SectionId>();
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      initial.add(hash as SectionId);
    }
    return initial;
  });

  const toggle = useCallback((id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle hash navigation on load
  useEffect(() => {
    const hash = window.location.hash.slice(1) as SectionId;
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      // Small delay to let the accordion open and render content
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-bold text-text-bright mb-2">Damage Formulas</h2>
      <p className="text-text-secondary mb-8">
        The exact formulas used by the simulator, from raw stats to final DPS.
      </p>

      <div className="divide-y divide-border-default border-t border-border-default">
        {SECTIONS.map(({ id, label, subtitle }) => {
          const Component = SECTION_COMPONENTS[id];
          return (
            <AccordionSection
              key={id}
              id={id}
              title={label}
              subtitle={subtitle}
              isOpen={openSections.has(id)}
              onToggle={() => toggle(id)}
            >
              <Component />
            </AccordionSection>
          );
        })}
      </div>
    </div>
  );
}
