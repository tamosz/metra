import { BlockMath, InlineMath } from 'react-katex';
import { SectionHeading } from './SectionHeading.js';

export function CriticalDamageSection() {
  return (
    <section id="crit" className="mb-16 scroll-mt-8">
      <SectionHeading label="Critical Damage" />

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
        <li>Night Lord (Triple Throw): 50% rate, +100 damage bonus</li>
        <li>Bowmaster / Marksman (Critical Shot): 40% rate, +100 damage bonus</li>
      </ul>
    </section>
  );
}
