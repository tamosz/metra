import { BlockMath } from 'react-katex';

export function StatCalculationSection() {
  return (
    <>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Base stats are boosted by Maple Warrior before being added to gear stats. MW20 applies a
        1.10 multiplier, floored after multiplication.
      </p>

      <div className="my-6">
        <BlockMath math="\text{boostedBase} = \lfloor \text{baseStat} \times \text{mwMultiplier} \rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Total stats for the damage formula combine gear stats with the MW-boosted base:
      </p>

      <div className="my-6">
        <BlockMath math="\text{totalPrimary} = \text{gearPrimary} + \text{boostedBase}" />
      </div>
      <div className="my-6">
        <BlockMath math="\text{totalSecondary} = \text{gearSecondary} + \lfloor \text{baseSecondary} \times \text{mwMultiplier} \rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Some classes have multiple secondary stats (e.g., Shadower uses both STR and DEX as
        secondary). In those cases the secondary stats are each computed separately and then summed.
      </p>
    </>
  );
}
