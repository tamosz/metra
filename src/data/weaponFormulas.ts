export const weaponFormulas: WeaponFormulas = {
  twoHandedSword: {
    name: "Two-Handed Sword",
    type: "two-handed",
    multiplier: {
      primary: {
        stat: "STR",
        multiplier: 4.6
      },
      secondary: {
        stat: "DEX"
      }
    }
  },
  // Add other weapons...
}

// Utility functions for damage calculations
export const calculateDamage = (
  primaryStat: number,
  secondaryStat: number,
  weaponAttack: number,
  multiplier: WeaponMultiplier,
  skillMastery: number = 0.6
) => {
  return {
    max: (primaryStat * multiplier.primary.multiplier + secondaryStat) * weaponAttack / 100,
    min: (primaryStat * multiplier.primary.multiplier * 0.9 * skillMastery + secondaryStat) * weaponAttack / 100
  };
}; 
