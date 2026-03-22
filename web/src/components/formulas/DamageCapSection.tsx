import { BlockMath, InlineMath } from 'react-katex';

export function DamageCapSection() {
  return (
    <>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        The game enforces a damage cap of 199,999 per hit line. Skills that deal high damage
        per line can be partially or fully capped, reducing their effective DPS.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Range Cap</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        The raw damage range is divided by the skill multiplier to find the cap threshold:
      </p>

      <div className="my-6">
        <BlockMath math="\text{rangeCap} = \frac{\text{damageCap}}{\text{skillMultiplier}}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Where <InlineMath math="\text{skillMultiplier} = \text{basePower} \times \text{multiplier} / 100" /> for
        physical skills, or <InlineMath math="\text{basePower} \times \text{multiplier}" /> for magic skills.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Adjusted Average</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        When the damage range partially exceeds the cap, an adjusted average accounts for the
        truncation. Damage is uniformly distributed between min and max:
      </p>

      <div className="my-6">
        <BlockMath math="r = \frac{\text{cap} - \text{min}}{\text{max} - \text{min}}" />
      </div>
      <div className="my-6">
        <BlockMath math="\text{adjusted} = \frac{\text{cap} + \text{min}}{2} \cdot r + \text{cap} \cdot (1 - r)" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        The proportion <InlineMath math="r" /> of the range below the cap gets an average
        of <InlineMath math="(\text{cap} + \text{min}) / 2" />, while the remaining{' '}
        <InlineMath math="1 - r" /> hits the cap flat.
      </p>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        If <InlineMath math="\text{rangeCap} > \text{max}" />: no capping, use normal average.
        If <InlineMath math="\text{rangeCap} \leq \text{min}" />: fully capped,
        use <InlineMath math="\text{rangeCap}" /> as the average.
      </p>
    </>
  );
}
