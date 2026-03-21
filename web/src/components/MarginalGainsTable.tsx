import { useMemo } from 'react';
import { calculateMarginalGains, calculateSkillDps, type MarginalGain, type CharacterBuild, type ClassSkillData, type SkillEntry } from '@metra/engine';
import { gameData } from '../data/bundle.js';
import { formatDps } from '../utils/format.js';
import { TH } from '../utils/styles.js';

interface MarginalGainsTableProps {
  build: CharacterBuild;
  classData: ClassSkillData;
}

export function MarginalGainsTable({ build, classData }: MarginalGainsTableProps) {
  const { bestSkill, gains } = useMemo(() => {
    let bestSingle: SkillEntry | null = null;
    let bestDps = 0;

    const comboSkills = new Map<string, { skills: SkillEntry[]; totalDps: number }>();

    for (const skill of classData.skills) {
      const dps = calculateSkillDps(build, classData, skill, gameData).dps;
      if (skill.comboGroup) {
        const existing = comboSkills.get(skill.comboGroup);
        if (existing) {
          existing.skills.push(skill);
          existing.totalDps += dps;
        } else {
          comboSkills.set(skill.comboGroup, { skills: [skill], totalDps: dps });
        }
      } else if (dps > bestDps) {
        bestDps = dps;
        bestSingle = skill;
      }
    }

    // Check if any combo group beats the best single skill
    let bestComboGroup: string | null = null;
    for (const [groupName, group] of comboSkills) {
      if (group.totalDps > bestDps) {
        bestDps = group.totalDps;
        bestComboGroup = groupName;
        bestSingle = null;
      }
    }

    let marginalGains: MarginalGain[];
    let skillLabel: string;

    if (bestComboGroup) {
      const group = comboSkills.get(bestComboGroup)!;
      skillLabel = bestComboGroup;
      // Sum marginal gains across all sub-skills in the combo
      const gainsBySubSkill = group.skills.map(skill =>
        calculateMarginalGains(build, classData, skill, gameData)
      );
      const statMap = new Map<string, MarginalGain>();
      for (const subGains of gainsBySubSkill) {
        for (const g of subGains) {
          const existing = statMap.get(g.stat);
          if (existing) {
            existing.dpsGain += g.dpsGain;
          } else {
            statMap.set(g.stat, { ...g });
          }
        }
      }
      marginalGains = [...statMap.values()].map(g => ({
        ...g,
        percentGain: bestDps > 0 ? (g.dpsGain / bestDps) * 100 : 0,
      }));
      marginalGains.sort((a, b) => b.dpsGain - a.dpsGain);
    } else if (bestSingle) {
      skillLabel = bestSingle.name;
      marginalGains = calculateMarginalGains(build, classData, bestSingle, gameData);
    } else {
      return { bestSkill: null, gains: [] };
    }

    return { bestSkill: skillLabel, gains: marginalGains };
  }, [build, classData]);

  if (!bestSkill || gains.length === 0) return null;

  const bestGain = gains[0];

  return (
    <div className="mt-6">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-dim">
        What to upgrade next?
      </div>
      <div className="mb-2 text-[11px] text-text-faint">
        Based on {bestSkill}
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className={`${TH} text-left`}>Stat</th>
            <th className={`${TH} text-right`}>Current</th>
            <th className={`${TH} text-right`}>+1 DPS</th>
            <th className={`${TH} text-right`}>+1 %</th>
          </tr>
        </thead>
        <tbody>
          {gains.map((g) => {
            const isBest = g === bestGain && g.dpsGain > 0;
            return (
              <tr
                key={g.stat}
                className={`border-b border-border-subtle ${isBest ? 'bg-accent/5' : 'hover:bg-white/[0.03]'}`}
              >
                <td className={`px-3 py-2 ${isBest ? 'text-accent font-medium' : 'text-text-secondary'}`}>
                  {g.stat}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-dim">
                  {g.currentValue.toLocaleString()}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${isBest ? 'text-accent' : ''}`}>
                  +{formatDps(g.dpsGain)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-dim">
                  +{g.percentGain.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
