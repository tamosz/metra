<script setup lang="ts">
    import { Character } from '@/types/character';
    //calculate range by stats
    function calculateMaxRange(c: Character): number {
      //MAX = (Primary Stat + Secondary Stat) × Weapon Attack / 100
      const maxRange = (c.mainStat + c.secondaryStat) * c.weaponAttack / 100
      return maxRange
    }

    function calculateMinRange(c: Character): number {
      //MIN = (Primary Stat × 0.9 × Skill Mastery + Secondary Stat) × Weapon Attack / 100
      const minRange = (c.mainStat * 0.9 * c.mastery + c.secondaryStat) * c.weaponAttack / 100
      return minRange
    }

    //statsToRange(weaponAttack, mainStat, secondaryStat, tertiaryStat)
    function calculateAverageRange(c: Character): number {
        const minRange: number = calculateMinRange(c)
        const maxRange: number = calculateMaxRange(c)
        const averageRange: number = (minRange + maxRange) / 2;
        return averageRange
    }

    //can probably be generic for all classes
    function calculateExpectedDamagePerMinute(c: Character): number {
        const averageRange = calculateAverageRange(c)
        const expectedDamagePerMinute = averageRange * c.weaponMultiplier * c.mainSkillMultiplier * c.skillsPerMinute
        return expectedDamagePerMinute
    }

    //character declarations
    const hero140 = new Character(100, 500, 300, 0.7, 1.2, 1.5, 60);
    const hero180 = new Character(100, 500, 300, 0.7, 1.2, 1.5, 60);
    const hero200 = new Character(100, 500, 300, 0.7, 1.2, 1.5, 60);

    const bowmaster140 = new Character(100, 500, 300, 0.7, 1.2, 1.5, 60);
    const bowmaster180 = new Character(100, 500, 300, 0.7, 1.2, 1.5, 60);
    const bowmaster200 = new Character(100, 500, 300, 0.7, 1.2, 1.5, 60);
</script>

<template>
  <line-chart
    :data="{
      140: calculateExpectedDamagePerMinute(hero140),
      180: calculateExpectedDamagePerMinute(hero180),
      200: calculateExpectedDamagePerMinute(hero200),
    }"
    label = "dpm"
    legend = "true"
    thousands = ","
  ></line-chart>
</template>
