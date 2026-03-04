import { discoveredData } from '../../data/bundle.js';
import type { ClassSkillData } from '@engine/data/types.js';
import { SectionHeading } from './SectionHeading.js';

function getNotables(classData: ClassSkillData): string[] {
  const notes: string[] = [];
  if (classData.stanceRate && classData.stanceRate > 0) {
    notes.push(`Stance (${Math.round(classData.stanceRate * 100)}%)`);
  }
  if (classData.shadowShifterRate && classData.shadowShifterRate > 0) {
    notes.push(`Shadow Shifter (${Math.round(classData.shadowShifterRate * 100)}%)`);
  }
  // Shadow Partner / Berserk — hardcoded, no explicit data field
  const name = classData.className.toLowerCase();
  if (name === 'nl' || name === 'shadower') {
    notes.push('Shadow Partner');
  }
  if (name === 'drk') {
    notes.push('Berserk (2.1×)');
  }
  if (classData.spellAmplification && classData.spellAmplification !== 1) {
    notes.push(`Spell Amp (${classData.spellAmplification})`);
  }
  if (classData.weaponAmplification && classData.weaponAmplification !== 1) {
    notes.push(`Weapon Amp (${classData.weaponAmplification})`);
  }
  // Built-in crit from skills
  const critSkills = classData.skills.filter((s) => s.builtInCritRate && s.builtInCritRate > 0);
  if (critSkills.length > 0) {
    const rate = critSkills[0].builtInCritRate!;
    notes.push(`Built-in crit (${Math.round(rate * 100)}%)`);
  }
  return notes;
}

export function ClassReferenceSection() {
  const entries = Array.from(discoveredData.classDataMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <section id="class-reference" className="mb-16 scroll-mt-8">
      <SectionHeading label="Class Reference" />

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Per-class configuration used by the simulator, populated from the data files.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-bg-surface border-b border-border-default">
              <th className="px-3 py-2 text-left font-medium text-text-dim">Class</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Formula</th>
              <th className="px-3 py-2 text-right font-medium text-text-dim">Mastery</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Primary</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Secondary</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Crit Formula</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Notable</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, classData]) => {
              const secondary = Array.isArray(classData.secondaryStat)
                ? classData.secondaryStat.join('/')
                : classData.secondaryStat;
              const critFormula =
                classData.seCritFormula === 'multiplicative' ? 'multiplicative' : '\u2014';
              const notables = getNotables(classData);

              return (
                <tr key={key} className="border-b border-border-default/50">
                  <td className="px-3 py-1.5 font-medium text-text-primary">
                    {classData.className}
                  </td>
                  <td className="px-3 py-1.5 text-text-secondary">
                    {classData.damageFormula ?? 'standard'}
                  </td>
                  <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                    {classData.mastery}
                  </td>
                  <td className="px-3 py-1.5 text-text-secondary">{classData.primaryStat}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{secondary}</td>
                  <td className="px-3 py-1.5 text-text-secondary text-xs">{critFormula}</td>
                  <td className="px-3 py-1.5 text-text-secondary text-xs">
                    {notables.length > 0 ? notables.join(', ') : '\u2014'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
