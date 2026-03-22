import { useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { weaponData } from '../../data/bundle.js';
import { FormulaTabs } from './FormulaTabs.js';

// Group weapons by whether slash = stab
function partitionWeapons() {
  const uniform: Array<{ names: string[]; multiplier: number }> = [];
  const split: Array<{ name: string; slash: number; stab: number }> = [];

  const uniformByValue = new Map<number, string[]>();
  for (const w of weaponData.types) {
    if (w.slashMultiplier === w.stabMultiplier) {
      const existing = uniformByValue.get(w.slashMultiplier);
      if (existing) {
        existing.push(w.name);
      } else {
        uniformByValue.set(w.slashMultiplier, [w.name]);
      }
    } else {
      split.push({ name: w.name, slash: w.slashMultiplier, stab: w.stabMultiplier });
    }
  }

  for (const [multiplier, names] of [...uniformByValue.entries()].sort((a, b) => b[0] - a[0])) {
    uniform.push({ names, multiplier });
  }

  const splitGrouped: Array<{ names: string[]; slash: number; stab: number }> = [];
  for (const w of split) {
    const existing = splitGrouped.find((g) => g.slash === w.slash && g.stab === w.stab);
    if (existing) {
      existing.names.push(w.name);
    } else {
      splitGrouped.push({ names: [w.name], slash: w.slash, stab: w.stab });
    }
  }

  splitGrouped.sort((a, b) => Math.max(b.slash, b.stab) - Math.max(a.slash, a.stab));

  return { uniform, split: splitGrouped };
}

function PhysicalFormulas() {
  return (
    <>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Echo of Hero adds a 4% bonus to WATK + potion + projectile:
      </p>

      <div className="my-6">
        <BlockMath math="\text{echo} = \lfloor (\text{WATK} + \text{potion} + \text{projectile}) \times 0.04 \rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Total attack for the damage formula:
      </p>

      <div className="my-6">
        <BlockMath math="\text{totalAttack} = \text{WATK} + \text{potion} + \text{projectile} + \text{echo}" />
      </div>
    </>
  );
}

function MageFormulas() {
  return (
    <>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Mage echo includes INT in the base:
      </p>

      <div className="my-6">
        <BlockMath math="\text{echo}_{\text{mage}} = \lfloor (\text{INT} + \text{MATK} + \text{potion}) \times 0.04 \rfloor" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Total magic attack (TMA) for the damage formula:
      </p>

      <div className="my-6">
        <BlockMath math="\text{TMA} = \text{INT} + \text{MATK} + \text{potion} + \text{echo}_{\text{mage}}" />
      </div>
    </>
  );
}

export function AttackCalculationSection() {
  const [activeTab, setActiveTab] = useState('physical');
  const { uniform, split } = partitionWeapons();

  const tabs = [
    { id: 'physical', label: 'Physical', content: <PhysicalFormulas /> },
    { id: 'mage', label: 'Mage', content: <MageFormulas /> },
  ];

  return (
    <>
      <FormulaTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <h4 className="text-sm font-semibold text-text-bright mt-8 mb-3">Weapon Multipliers</h4>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Each weapon type has a multiplier <InlineMath math="W" /> applied to the primary stat. Most
        weapons use a single value. Axes, blunt weapons, and polearms have different slash and stab
        multipliers — some skills use a weighted mix (e.g., BW Blast with a 3:2 ratio
        gives <InlineMath math="W = \text{slash} \times 0.6 + \text{stab} \times 0.4" />).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-3 py-2 text-left font-medium text-text-dim">Weapon Type</th>
              <th className="px-3 py-2 text-right font-medium text-text-dim">
                <InlineMath math="W" />
              </th>
            </tr>
          </thead>
          <tbody>
            {uniform.map((group) => (
              <tr key={group.multiplier} className="border-b border-border-default/50">
                <td className="px-3 py-1.5 font-medium text-text-muted">
                  {group.names.join(', ')}
                </td>
                <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                  {group.multiplier.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {split.length > 0 && (
        <>
          <h4 className="text-xs font-medium text-text-dim mt-6 mb-2 uppercase tracking-wide">
            Slash / Stab Differ
          </h4>

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
                {split.map((group) => (
                  <tr
                    key={group.names.join(',')}
                    className="border-b border-border-default/50"
                  >
                    <td className="px-3 py-1.5 font-medium text-text-muted">
                      {group.names.join(' / ')}
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                      {group.slash.toFixed(1)}
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-secondary tabular-nums">
                      {group.stab.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
