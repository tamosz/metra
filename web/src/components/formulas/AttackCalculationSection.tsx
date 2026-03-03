import { BlockMath, InlineMath } from 'react-katex';
import { weaponData } from '../../data/bundle.js';
import { SectionHeading } from './SectionHeading.js';

export function AttackCalculationSection() {
  return (
    <section id="attack" className="mb-16 scroll-mt-8">
      <SectionHeading label="Attack Calculation" />

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Echo of Hero adds a 4% bonus to attack. For physical classes it applies to WATK + potion +
        projectile:
      </p>

      <div className="my-6">
        <BlockMath math="\text{echo} = \lfloor (\text{WATK} + \text{potion} + \text{projectile}) \times 0.04 \rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Mage echo includes INT in the base:
      </p>

      <div className="my-6">
        <BlockMath math="\text{echo}_{\text{mage}} = \lfloor (\text{INT} + \text{MATK} + \text{potion}) \times 0.04 \rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Total attack for the damage formula:
      </p>

      <div className="my-6">
        <BlockMath math="\text{totalAttack} = \text{WATK} + \text{potion} + \text{projectile} + \text{echo}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        For mages, total magic attack (TMA) is used instead:
      </p>

      <div className="my-6">
        <BlockMath math="\text{TMA} = \text{INT} + \text{MATK} + \text{potion} + \text{echo}_{\text{mage}}" />
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Weapon Multipliers</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Each weapon type has slash and stab multipliers applied to the primary stat in the damage
        formula. Some skills use a weighted mix of both (e.g., BW Blast with a 3:2
        slash:stab ratio gives an effective multiplier
        of <InlineMath math="\text{slash} \times 0.6 + \text{stab} \times 0.4" />).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-3 py-2 text-left font-medium text-text-dim">Weapon Type</th>
              <th className="px-3 py-2 text-right font-medium text-text-dim">Slash</th>
              <th className="px-3 py-2 text-right font-medium text-text-dim">Stab</th>
            </tr>
          </thead>
          <tbody>
            {weaponData.types.map((weapon) => (
              <tr key={weapon.name} className="border-b border-border-default/50">
                <td className="px-3 py-1.5 font-medium text-text-muted">{weapon.name}</td>
                <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                  {weapon.slashMultiplier.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                  {weapon.stabMultiplier.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
