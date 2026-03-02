export const GAME_TERMS: Record<string, string> = {
  SE: 'Sharp Eyes — party buff that adds 15% crit rate and +140% crit damage.',
  SI: 'Speed Infusion — Buccaneer party buff that increases attack speed by 2 tiers.',
  MW: 'MW — party buff that increases all stats by a percentage (e.g., MW20 = +12%).',
  PDR: 'Physical Damage Reduction — boss defense that reduces incoming damage by a percentage.',
  WATK: 'Weapon Attack — the main offensive stat on gear. Higher WATK = more damage.',
  Mastery: 'Determines the minimum damage range. Higher mastery = more consistent damage.',
  Echo: 'Echo of Hero — event buff that adds +4% total attack.',
  'Shadow Partner': 'Shadower/NL buff that adds a clone dealing 50% of your damage (1.5x total).',
  Berserk: 'DrK HP-sacrifice buff that multiplies damage by 2.1x when HP is low.',
  Rotation: 'A repeating sequence of skills used for sustained DPS (e.g., Snipe + Strafes).',
};

export const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  Buffed: 'All party buffs active: MW20, SE, SI, Echo, and attack potions.',
  Unbuffed: 'No party buffs — raw class power without SE, Echo, SI, MW, or potions.',
  'No-Echo': 'All buffs except Echo of Hero — shows how much Echo contributes.',
  'Bossing (50% PDR)': 'Fully buffed with 50% Physical Damage Reduction — sustained bossing damage.',
};

/** Generate a description for a dynamic training scenario. */
export function getScenarioDescription(name: string): string | undefined {
  if (SCENARIO_DESCRIPTIONS[name]) return SCENARIO_DESCRIPTIONS[name];
  const match = name.match(/^Training \((\d+) mobs?\)$/);
  if (match) {
    return `Fully buffed, hitting ${match[1]} mobs. AoE skills scale with target count.`;
  }
  return undefined;
}

export const BUFF_DESCRIPTIONS: Record<string, string> = {
  'Echo of Hero': 'Event buff: +4% total attack.',
  'Sharp Eyes': 'Party buff: +15% crit rate, +140% crit damage.',
  'Speed Infusion': 'Buccaneer buff: +2 attack speed tiers.',
  'Shadow Partner': 'Clone deals 50% of your damage (1.5x total).',
  'MW Level': 'MW: increases all stats by a % based on skill level.',
};
