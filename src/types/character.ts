interface CharacterStats {
  weaponAttack: number,
  mainStat: number,
  secondaryStat: number,
  mastery: number, // is this a percentage?
  weaponMultiplier: number
  mainSkillMultiplier: number,
  skillsPerMinute: number
}

export class Character implements CharacterStats {
  constructor(
    public weaponAttack: number = 0,
    public mainStat: number = 0,
    public secondaryStat: number = 0,
    public mastery: number = 0,
    public weaponMultiplier: number = 0,
    public mainSkillMultiplier: number = 0,
    public skillsPerMinute: number = 0
  ) {}
}
