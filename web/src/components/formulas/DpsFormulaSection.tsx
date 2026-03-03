import { BlockMath, InlineMath } from 'react-katex';
import { SectionHeading } from './SectionHeading.js';

export function DpsFormulaSection() {
  return (
    <section id="dps" className="mb-16 scroll-mt-8">
      <SectionHeading label="DPS Formula" />

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        The final pipeline combining everything into damage per second.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Skill Damage Percent</h4>

      <div className="my-6">
        <BlockMath math="\text{skillDmg\%} = \text{basePower} \times \text{multiplier}" />
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Average Damage per Attack</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Weighted by crit rate, using adjusted ranges that account for the damage cap:
      </p>

      <div className="my-6">
        <BlockMath math="\text{avgDmg} = \left( \frac{\text{skillDmg\%}}{100} \times (1 - \text{critRate}) \times \text{adjRange}_{\text{normal}} + \frac{\text{critDmg\%}}{100} \times \text{critRate} \times \text{adjRange}_{\text{crit}} \right) \times \text{hitCount}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        For magic skills, the multiplier is used directly (not divided by 100).
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Shadow Partner</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Night Lord and Shadower have a Shadow Partner clone that deals 50% of attack damage,
        so total damage is 1.5x:
      </p>

      <div className="my-6">
        <BlockMath math="\text{avgDmg}_{\text{SP}} = \text{avgDmg} \times 1.5" />
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Final DPS</h4>

      <div className="my-6">
        <BlockMath math="\text{DPS} = \frac{\text{avgDmg}}{\text{attackTime}}" />
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Multi-Target Scaling</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        For AoE skills, effective targets = <InlineMath math="\min(\text{maxTargets},\ \text{targetCount})" />.
        DPS is multiplied by effective targets.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Combo Groups</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Some classes use skill rotations (e.g., Marksman Snipe + Strafe weave, Buccaneer Barrage
        + Demolition). Skills sharing a combo group have their individual DPS contributions summed
        into a single combined DPS value. Each sub-skill uses the total rotation cycle time as its
        attack time.
      </p>
    </section>
  );
}
