import { BlockMath, InlineMath } from 'react-katex';
import { SectionHeading } from './SectionHeading.js';

export function DamageRangeSection() {
  return (
    <section id="damage-range" className="mb-16 scroll-mt-8">
      <SectionHeading label="Damage Range" />

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Three formula variants exist depending on class type. Each attack deals uniform random
        damage between Min and Max.
      </p>

      {/* Standard formula */}
      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Standard Formula</h4>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Used by: Hero, DrK, Paladin, Bowmaster, Marksman, Corsair, Buccaneer, Shadower.
      </p>

      <div className="my-6">
        <BlockMath math="\text{Max} = \left\lfloor \frac{(\text{primaryStat} \times W + \text{secondaryStat}) \times \text{totalAttack}}{100} \right\rfloor" />
      </div>
      <div className="my-6">
        <BlockMath math="\text{Min} = \left\lfloor \frac{(\text{primaryStat} \times W \times 0.9 \times M + \text{secondaryStat}) \times \text{totalAttack}}{100} \right\rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Where <InlineMath math="W" /> = weapon multiplier
        and <InlineMath math="M" /> = mastery (class-specific, typically 0.6).
      </p>

      <div className="my-6">
        <BlockMath math="\text{Avg} = (\text{Min} + \text{Max}) / 2" />
      </div>

      {/* Throwing star formula */}
      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Throwing Star Formula</h4>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Used by: Night Lord. No weapon multiplier or secondary stat — pure LUK scaling.
      </p>

      <div className="my-6">
        <BlockMath math="\text{Max} = \left\lfloor \frac{5.0 \times \text{LUK} \times \text{totalAttack}}{100} \right\rfloor" />
      </div>
      <div className="my-6">
        <BlockMath math="\text{Min} = \left\lfloor \frac{2.5 \times \text{LUK} \times \text{totalAttack}}{100} \right\rfloor" />
      </div>
      <div className="my-6">
        <BlockMath math="\text{Avg} = (\text{Min} + \text{Max}) / 2" />
      </div>

      {/* Magic formula */}
      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Magic Formula</h4>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Used by: Archmage I/L, Archmage F/P, Bishop.
      </p>

      <div className="my-6">
        <BlockMath math="\text{Max} = \left\lfloor \left( \frac{\text{TMA}^2 / 1000 + \text{TMA}}{30} + \frac{\text{INT}}{200} \right) \times S_{\text{amp}} \times W_{\text{amp}} \right\rfloor" />
      </div>
      <div className="my-6">
        <BlockMath math="\text{Min} = \left\lfloor \left( \frac{\text{TMA}^2 / 1000 + \text{TMA} \times M \times 0.9}{30} + \frac{\text{INT}}{200} \right) \times S_{\text{amp}} \times W_{\text{amp}} \right\rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Where <InlineMath math="S_{\text{amp}}" /> = Spell Amplification
        and <InlineMath math="W_{\text{amp}}" /> = Weapon Amplification (elemental staff/wand).
        Amplification values: I/L = 1.4 / 1.25, F/P = 1.2 / 1.25, Bishop = 1.0 / 1.0.
      </p>

      <div className="my-6">
        <BlockMath math="\text{Avg} = (\text{Min} + \text{Max}) / 2" />
      </div>
    </section>
  );
}
