import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'stats', label: 'Stat Calculation' },
  { id: 'attack', label: 'Attack Calculation' },
  { id: 'damage-range', label: 'Damage Range' },
  { id: 'crit', label: 'Critical Damage' },
  { id: 'speed', label: 'Attack Speed' },
  { id: 'damage-cap', label: 'Damage Cap' },
  { id: 'dps', label: 'DPS Formula' },
  { id: 'class-reference', label: 'Class Reference' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export function FormulasPage() {
  const [activeSection, setActiveSection] = useState<SectionId>(SECTIONS[0].id);

  useEffect(() => {
    const sectionIds = new Set<string>(SECTIONS.map((s) => s.id));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && sectionIds.has(entry.target.id)) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex gap-10">
      {/* Desktop TOC sidebar */}
      <nav className="hidden lg:block sticky top-8 self-start w-48 shrink-0">
        <ul className="space-y-1 text-sm">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block rounded px-2.5 py-1.5 transition-colors no-underline ${
                  activeSection === id
                    ? 'bg-bg-active text-text-bright'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-text-bright mb-2">Damage Formulas</h2>
        <p className="text-text-secondary mb-8">
          The exact formulas used by the simulator, from raw stats to final DPS.
        </p>

        {/* Mobile TOC */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 mb-6 lg:hidden">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`shrink-0 rounded-full px-3 py-1 text-xs no-underline transition-colors ${
                activeSection === id
                  ? 'bg-bg-active text-text-bright'
                  : 'bg-bg-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Content sections — placeholder for now */}
        {SECTIONS.map(({ id, label }) => (
          <section key={id} id={id} className="mb-16 scroll-mt-8">
            <h3 className="text-base font-semibold text-text-bright mb-4 pb-2 border-b border-border-default">
              {label}
            </h3>
            <p className="text-text-muted text-sm">Content coming in next tasks.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
