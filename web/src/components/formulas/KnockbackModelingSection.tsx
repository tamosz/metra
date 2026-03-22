import { BlockMath, InlineMath } from 'react-katex';
import { discoveredData } from '../../data/bundle.js';

interface KnockbackModelingSectionProps {
  selectedClass?: string | null;
}

export function KnockbackModelingSection({ selectedClass }: KnockbackModelingSectionProps) {
  const classData = selectedClass ? discoveredData.classDataMap.get(selectedClass) : null;

  const kbDefenses: Array<{ classes: string; defense: string; rate: string; match: boolean }> = [
    {
      classes: 'Hero, Dark Knight, Paladin',
      defense: 'Power Stance',
      rate: '90%',
      match: !!classData && (classData.stanceRate ?? 0) > 0 && classData.className !== 'Buccaneer',
    },
    {
      classes: 'Buccaneer',
      defense: 'Energy Charge',
      rate: '90%',
      match: classData?.className === 'Buccaneer',
    },
    {
      classes: 'Shadower',
      defense: 'Shadow Shifter',
      rate: '40%',
      match: classData?.className === 'Shadower',
    },
    {
      classes: 'Night Lord',
      defense: 'Shadow Shifter',
      rate: '30%',
      match: classData?.className === 'Night Lord',
    },
    {
      classes: 'Archers, Corsair, Mages',
      defense: 'None',
      rate: '0%',
      match: !!classData &&
        (classData.stanceRate ?? 0) === 0 &&
        (classData.shadowShifterRate ?? 0) === 0 &&
        classData.className !== 'Buccaneer',
    },
  ];

  const recoveryTimes: Array<{ type: string; time: string; examples: string }> = [
    { type: 'Burst / normal', time: '0.5s', examples: 'Brandish, Crusher, Triple Throw, etc.' },
    { type: 'Channeled', time: '0.7s', examples: 'Hurricane, Rapid Fire (0.5s base + 0.2s wind-up)' },
    { type: 'I-frame', time: '0s', examples: 'Demolition, Barrage' },
  ];

  return (
    <>
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
        <BlockMath math="\text{dodge} = \frac{\text{avoidability}}{4.5 \times \text{bossAccuracy}}" />
      </div>

      <p className="text-text-secondary text-sm mb-4 leading-relaxed">
        Clamped to class-specific ranges: [2%, 80%] for non-thieves, [5%, 95%] for thieves
        (Night Lord, Shadower). When the boss is higher level than the player, avoidability
        is reduced by <InlineMath math="(\text{monsterLevel} - \text{charLevel}) / 2" /> first.
        In practice, dodge is small against endgame bosses — a Night Lord with 300 avoid
        vs boss accuracy 250 gets ~27% dodge.
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
              <tr
                key={row.classes}
                className={`border-b border-border-default/50 transition-colors ${
                  row.match ? 'bg-bg-active/50' : ''
                }`}
              >
                <td className={`px-3 py-1.5 ${row.match ? 'text-text-bright' : 'text-text-primary'}`}>
                  {row.classes}
                </td>
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
    </>
  );
}
