import { BlockMath, InlineMath } from 'react-katex';

export function AttackSpeedSection() {
  return (
    <>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Each weapon has a base speed tier. Booster reduces it by 2, and Speed Infusion
        reduces it by an additional 2. The minimum effective speed is 2.
      </p>

      <div className="my-6">
        <BlockMath math="\text{effectiveSpeed} = \max(2,\ \text{baseSpeed} - \text{reduction})" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Where <InlineMath math="\text{reduction}" /> = 2 (Booster only) or 4 (Booster + SI).
        The attack time in seconds is then looked up from a speed table keyed by effective speed
        and skill category.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Fixed-Speed Skills</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Some skills bypass the speed table entirely and use a fixed attack time:
      </p>
      <ul className="text-text-secondary text-sm mb-4 leading-relaxed list-disc list-inside space-y-1">
        <li>Hurricane (Bowmaster): 0.12s</li>
        <li>Rapid Fire (Corsair): 0.12s</li>
        <li>Demolition (Buccaneer): 2.34s cycle</li>
        <li>Mage skills: fixed per-skill (Chain Lightning 0.69s, Blizzard 3.06s, Paralyze 0.69s, Meteor 3.06s, Angel Ray 0.81s, Genesis 2.7s)</li>
      </ul>
    </>
  );
}
