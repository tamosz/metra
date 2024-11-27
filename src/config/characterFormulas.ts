interface Character {
  name: string;
  // Basic formula that takes level as input and returns DPM
  damageFormula: (level: number) => number;
  color: string; // for graph line color
}

export const characters: Character[] = [
  {
    name: "Hero",
    damageFormula: (level: number) => {
      // Example formula: base damage * level multiplier
      const baseDamage = 100;
      const attacksPerMinute = 40;
      return baseDamage * (1 + level * 5) * attacksPerMinute;
    },
    color: "#FF0000" // red
  },
  // Add more characters as needed
];
