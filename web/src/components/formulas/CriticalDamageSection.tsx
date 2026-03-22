import { BlockMath, InlineMath } from 'react-katex';
import { discoveredData } from '../../data/bundle.js';

interface CriticalDamageSectionProps {
  selectedClass?: string | null;
}

export function CriticalDamageSection({ selectedClass }: CriticalDamageSectionProps) {
  const classData = selectedClass ? discoveredData.classDataMap.get(selectedClass) : null;
  const builtInCritSkill = classData?.skills.find(
    (s) => s.builtInCritRate && s.builtInCritRate > 0
  );

  return (
    <>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Physical classes all use the same crit damage formula:
      </p>

      <div className="my-6">
        <BlockMath math="\text{critDmg\%} = (\text{basePower} + \text{totalCritBonus}) \times \text{multiplier}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Where:
      </p>

      <div className="my-6">
        <BlockMath math="\text{totalCritBonus} = \text{builtInCritBonus} + \text{seCritBonus}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Sharp Eyes provides <InlineMath math="\text{critRate} = 0.15" /> and{' '}
        <InlineMath math="\text{critDamageBonus} = 140" />.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Crit Rate</h4>

      <div className="my-6">
        <BlockMath math="\text{totalCritRate} = \min(\text{builtInRate} + \text{seRate},\ 1.0)" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Classes with built-in crit (additive with SE):
      </p>
      <ul className="text-text-secondary text-sm mb-4 leading-relaxed list-disc list-inside space-y-1">
        <li className={selectedClass && classData?.className === 'Night Lord' ? 'text-text-bright' : ''}>
          Night Lord (Triple Throw): 50% rate, +100 damage bonus
        </li>
        <li className={selectedClass && (classData?.className === 'Bowmaster' || classData?.className === 'Marksman') ? 'text-text-bright' : ''}>
          Bowmaster / Marksman (Critical Shot): 40% rate, +100 damage bonus
        </li>
      </ul>

      {selectedClass && builtInCritSkill && (
        <p className="text-text-secondary text-sm mb-4 leading-relaxed border-l-2 border-accent pl-3">
          {classData!.className} has {Math.round(builtInCritSkill.builtInCritRate! * 100)}% built-in
          crit on {builtInCritSkill.name}, giving{' '}
          {Math.min(Math.round(builtInCritSkill.builtInCritRate! * 100) + 15, 100)}% total with SE.
        </p>
      )}

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Known Limitation: Assassinate</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        There is community evidence that Assassinate has a v62 bug where its internal crit
        damage value (250%) was never updated when the skill&apos;s base power was buffed to
        950%. This would cause SE crits to deal <em>less</em> damage than non-crits. The
        simulator does not model this &mdash; Assassinate uses the standard SE crit formula.
        If the bug exists, Shadower combo DPS with SE active may be slightly overestimated.
      </p>
    </>
  );
}
