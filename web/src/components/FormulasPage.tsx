import { useState, useEffect } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { weaponData, discoveredData } from '../data/bundle.js';
import type { ClassSkillData } from '@engine/data/types.js';

const SECTIONS = [
  { id: 'stats', label: 'Stat Calculation' },
  { id: 'attack', label: 'Attack Calculation' },
  { id: 'damage-range', label: 'Damage Range' },
  { id: 'crit', label: 'Critical Damage' },
  { id: 'speed', label: 'Attack Speed' },
  { id: 'damage-cap', label: 'Damage Cap' },
  { id: 'dps', label: 'DPS Formula' },
  { id: 'knockback', label: 'Knockback Modeling' },
  { id: 'class-reference', label: 'Class Reference' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function SectionHeading({ label }: { label: string }) {
  return (
    <h3 className="text-base font-semibold text-text-bright mb-4 pb-2 border-b border-border-default">
      {label}
    </h3>
  );
}

function DpsFormulaSection() {
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

function KnockbackModelingSection() {
  const kbDefenses: Array<{ classes: string; defense: string; rate: string }> = [
    { classes: 'Hero, DrK, Paladin', defense: 'Power Stance', rate: '90%' },
    { classes: 'Buccaneer', defense: 'Energy Charge', rate: '90%' },
    { classes: 'Shadower', defense: 'Shadow Shifter', rate: '40%' },
    { classes: 'Night Lord', defense: 'Shadow Shifter', rate: '30%' },
    { classes: 'Archers, Corsair, Mages', defense: 'None', rate: '0%' },
  ];

  const recoveryTimes: Array<{ type: string; time: string; examples: string }> = [
    { type: 'Burst / normal', time: '0.6s', examples: 'Brandish, Crusher, Triple Throw, etc.' },
    { type: 'Channeled', time: '1.0s', examples: 'Hurricane, Rapid Fire' },
    { type: 'I-frame', time: '0s', examples: 'Demolition, Barrage' },
  ];

  return (
    <section id="knockback" className="mb-16 scroll-mt-8">
      <SectionHeading label="Knockback Modeling" />

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Boss attacks interrupt skills, reducing effective DPS. The KB model estimates uptime loss
        based on boss attack frequency, class defenses, and skill recovery time. This is an
        approximation — real KB losses depend on boss AI patterns, positioning, and animation timing.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Dodge Chance</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        First, dodge chance is calculated from avoidability vs boss accuracy (pre-BB formula):
      </p>

      <div className="my-6">
        <BlockMath math="\text{dodge} = \frac{\lfloor\sqrt{\text{avoidability}}\rfloor - \lfloor\sqrt{\text{bossAccuracy}}\rfloor}{100}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Clamped to [0, 0.95]. At boss accuracy 250, <InlineMath math="\lfloor\sqrt{250}\rfloor = 15" />,
        so a player would need avoidability &gt;255 just to get 1% dodge. In practice, dodge is
        negligible against endgame bosses.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">KB Probability</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Three independent defenses are checked per boss attack:
      </p>

      <div className="my-6">
        <BlockMath math="\text{kbProb} = (1 - \text{dodge}) \times (1 - \text{stance}) \times (1 - \text{shifter})" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Stance prevents knockback on hit. Shadow Shifter dodges the hit entirely. Both are
        independent multiplicative checks.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-bg-surface border-b border-border-default">
              <th className="px-3 py-2 text-left font-medium text-text-dim">Class</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Defense</th>
              <th className="px-3 py-2 text-right font-medium text-text-dim">Rate</th>
            </tr>
          </thead>
          <tbody>
            {kbDefenses.map((row) => (
              <tr key={row.classes} className="border-b border-border-default/50">
                <td className="px-3 py-1.5 text-text-primary">{row.classes}</td>
                <td className="px-3 py-1.5 text-text-secondary">{row.defense}</td>
                <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                  {row.rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Uptime</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        KB events per second times recovery time gives the fraction of time lost:
      </p>

      <div className="my-6">
        <BlockMath math="\text{uptime} = \max\!\left(0.1,\; 1 - \frac{\text{kbProb}}{\text{bossInterval}} \times \text{recovery}\right)" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Clamped to a minimum of 10% to avoid degenerate zero-DPS cases. Final DPS with KB:
      </p>

      <div className="my-6">
        <BlockMath math="\text{DPS}_{\text{KB}} = \text{DPS} \times \text{uptime}" />
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Recovery Time</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        How long a knockback interrupts attacking depends on the skill type. These are community
        estimates — no exact server-side timings exist.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-bg-surface border-b border-border-default">
              <th className="px-3 py-2 text-left font-medium text-text-dim">Skill Type</th>
              <th className="px-3 py-2 text-right font-medium text-text-dim">Recovery</th>
              <th className="px-3 py-2 text-left font-medium text-text-dim">Examples</th>
            </tr>
          </thead>
          <tbody>
            {recoveryTimes.map((row) => (
              <tr key={row.type} className="border-b border-border-default/50">
                <td className="px-3 py-1.5 text-text-primary">{row.type}</td>
                <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                  {row.time}
                </td>
                <td className="px-3 py-1.5 text-text-secondary text-xs">{row.examples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Channeled skills (Hurricane, Rapid Fire) lose extra time because the channel must restart
        after knockback. I-frame skills like Demolition and Barrage are intangible during their
        animation and cannot be interrupted.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Default Boss Parameters</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        The defaults model a representative endgame boss (Zakum/Horntail):
      </p>

      <ul className="text-text-secondary text-sm mb-4 leading-relaxed list-disc list-inside space-y-1">
        <li>Attack interval: 1.5s (configurable)</li>
        <li>Accuracy: 250 (configurable)</li>
      </ul>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Boss AI uses cooldown-based skill systems rather than fixed intervals, so the interval
        parameter is an average estimate. Actual attack frequency varies by boss and encounter phase.
      </p>
    </section>
  );
}

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

function ClassReferenceSection() {
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
                classData.seCritFormula === 'addAfterMultiply' ? 'addAfterMultiply' : '\u2014';
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

function StatCalculationSection() {
  return (
    <section id="stats" className="mb-16 scroll-mt-8">
      <SectionHeading label="Stat Calculation" />

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
    </section>
  );
}

function AttackCalculationSection() {
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

function DamageRangeSection() {
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

function CriticalDamageSection() {
  return (
    <section id="crit" className="mb-16 scroll-mt-8">
      <SectionHeading label="Critical Damage" />

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Two crit damage formula variants exist, configured per class
        via <InlineMath math="\text{seCritFormula}" />.
      </p>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">
        addBeforeMultiply (default)
      </h4>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Used by: Hero, DrK, Night Lord, Bowmaster, Marksman, Shadower, Corsair, Buccaneer.
      </p>

      <div className="my-6">
        <BlockMath math="\text{critDmg\%} = (\text{basePower} + \text{totalCritBonus}) \times \text{multiplier}" />
      </div>

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">
        addAfterMultiply (Paladin only)
      </h4>

      <div className="my-6">
        <BlockMath math="\text{critDmg\%} = \text{basePower} \times \text{multiplier} + \text{totalCritBonus}" />
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

function AttackSpeedSection() {
  return (
    <section id="speed" className="mb-16 scroll-mt-8">
      <SectionHeading label="Attack Speed" />

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
    </section>
  );
}

function DamageCapSection() {
  return (
    <section id="damage-cap" className="mb-16 scroll-mt-8">
      <SectionHeading label="Damage Cap" />

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
    </section>
  );
}

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

        {/* Content sections */}
        <StatCalculationSection />
        <AttackCalculationSection />
        <DamageRangeSection />
        <CriticalDamageSection />
        <AttackSpeedSection />
        <DamageCapSection />
        <DpsFormulaSection />
        <KnockbackModelingSection />
        <ClassReferenceSection />
      </div>
    </div>
  );
}
