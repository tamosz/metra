import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { discoveredData } from '../data/bundle.js';
import {
  getClassMetadata,
  damageFormulaToTab,
  damageFormulaToAttackTab,
  type ClassMetadata,
} from './formulas/class-metadata.js';
import { getClassColor } from '../utils/class-colors.js';

interface SectionDef {
  id: string;
  label: string;
  subtitle: string;
  getSubtitle?: (meta: ClassMetadata) => string;
}

const SECTIONS: readonly SectionDef[] = [
  { id: 'stats', label: 'Stat Calculation', subtitle: 'MW boost, total stats' },
  {
    id: 'attack',
    label: 'Attack Calculation',
    subtitle: 'Echo, total attack, weapon multipliers',
    getSubtitle: (m) =>
      m.damageFormula === 'magic'
        ? `Mage echo, TMA, weapon multipliers`
        : `Physical echo, total attack, ${m.weaponType} multiplier`,
  },
  {
    id: 'damage-range',
    label: 'Damage Range',
    subtitle: 'Standard, throwing star, magic',
    getSubtitle: (m) => {
      const labels: Record<string, string> = {
        standard: 'Standard formula',
        throwingStar: 'Throwing star formula',
        magic: 'Magic formula',
      };
      return `${labels[m.damageFormula]} (${m.className})`;
    },
  },
  {
    id: 'crit',
    label: 'Critical Damage',
    subtitle: 'SE crit, built-in crit',
    getSubtitle: (m) =>
      m.builtInCritRate > 0
        ? `SE crit, built-in ${Math.round(m.builtInCritRate * 100)}%`
        : 'SE crit',
  },
  { id: 'speed', label: 'Attack Speed', subtitle: 'Booster, SI, fixed-speed skills' },
  { id: 'damage-cap', label: 'Damage Cap', subtitle: '199,999 cap, adjusted ranges' },
  {
    id: 'dps',
    label: 'DPS Formula',
    subtitle: 'Skill %, crit weighting, combos',
    getSubtitle: (m) =>
      m.hasShadowPartner ? 'Skill %, crit weighting, Shadow Partner, combos' : 'Skill %, crit weighting, combos',
  },
  {
    id: 'knockback',
    label: 'Knockback Modeling',
    subtitle: 'Stance, dodge, uptime loss',
    getSubtitle: (m) => {
      if (m.hasStance) return `Power Stance, uptime loss`;
      if (m.hasShifter) return `Shadow Shifter, uptime loss`;
      return 'No KB defense, uptime loss';
    },
  },
  { id: 'class-reference', label: 'Class Reference', subtitle: 'Per-class config table' },
] as const;

type SectionId = string;

export function FormulasPage() {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() => {
    const hash = window.location.hash.slice(1);
    const initial = new Set<SectionId>();
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      initial.add(hash);
    }
    return initial;
  });

  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const classMeta = useMemo(
    () => (selectedClass ? getClassMetadata(selectedClass) : null),
    [selectedClass]
  );

  const classEntries = useMemo(() => {
    return Array.from(discoveredData.classDataMap.entries())
      .map(([key, data]) => ({ key, className: data.className }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, []);

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

  const handleClassSelect = useCallback((classKey: string) => {
    setSelectedClass((prev) => (prev === classKey ? null : classKey));
  }, []);

  // Handle hash navigation on load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Derive tab overrides from selected class
  const damageRangeTab = classMeta ? damageFormulaToTab(classMeta.damageFormula) : undefined;
  const attackTab = classMeta ? damageFormulaToAttackTab(classMeta.damageFormula) : undefined;

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-bold text-text-bright mb-2">Damage Formulas</h2>
      <p className="text-text-secondary mb-6">
        The exact formulas used by the simulator, from raw stats to final DPS.
      </p>

      {/* Class filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-1.5">
          {classEntries.map(({ key, className }) => {
            const isSelected = selectedClass === key;
            const color = getClassColor(className);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleClassSelect(key)}
                className={`rounded-full px-3 py-1 text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? 'text-text-bright border-current'
                    : 'text-text-muted border-transparent hover:text-text-secondary'
                }`}
                style={isSelected ? { color, borderColor: color } : undefined}
              >
                {className}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border-default">
        {SECTIONS.map((section) => {
          const subtitle =
            classMeta && section.getSubtitle ? section.getSubtitle(classMeta) : section.subtitle;

          return (
            <AccordionSection
              key={section.id}
              id={section.id}
              title={section.label}
              subtitle={subtitle}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggle(section.id)}
            >
              <SectionContent
                id={section.id}
                selectedClass={selectedClass}
                damageRangeTab={damageRangeTab}
                attackTab={attackTab}
                classMeta={classMeta}
              />
            </AccordionSection>
          );
        })}
      </div>
    </div>
  );
}

interface SectionContentProps {
  id: string;
  selectedClass: string | null;
  damageRangeTab: string | undefined;
  attackTab: string | undefined;
  classMeta: ClassMetadata | null;
}

function SectionContent({ id, selectedClass, damageRangeTab, attackTab, classMeta }: SectionContentProps) {
  switch (id) {
    case 'stats':
      return <StatCalculationSection />;
    case 'attack':
      return (
        <AttackCalculationSection
          defaultTab={attackTab}
          highlightWeapon={classMeta?.weaponType}
        />
      );
    case 'damage-range':
      return <DamageRangeSection defaultTab={damageRangeTab} />;
    case 'crit':
      return <CriticalDamageSection selectedClass={selectedClass} />;
    case 'speed':
      return <AttackSpeedSection />;
    case 'damage-cap':
      return <DamageCapSection />;
    case 'dps':
      return <DpsFormulaSection selectedClass={selectedClass} />;
    case 'knockback':
      return <KnockbackModelingSection selectedClass={selectedClass} />;
    case 'class-reference':
      return <ClassReferenceSection selectedClass={selectedClass} />;
    default:
      return null;
  }
}
