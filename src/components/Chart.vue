<script setup lang="ts">
    import DocumentationIcon from './icons/IconDocumentation.vue'
    import ToolingIcon from './icons/IconTooling.vue'
    import EcosystemIcon from './icons/IconEcosystem.vue'
    import CommunityIcon from './icons/IconCommunity.vue'
    import SupportIcon from './icons/IconSupport.vue'

    //calculate range by stats
    function bowStatsToRange(weaponAttack: number, dex: number): number {
        let minRange: number = weaponAttack + dex * 100;
        let maxRange: number = weaponAttack + dex * 150;
        let averageRange: number = (minRange + maxRange) / 2;
        return averageRange
    }

    function bowDamageFormula(averageRange: number): number {
        return averageRange * 12; //needs a real formula
    }

    //can probably be generic for all classes
    function calculateExpectedDamage(stats: number[]): number {
        let bowmanRange: number = bowStatsToRange(stats[0], stats[1]);
        let expectedDamage: number = bowDamageFormula(bowmanRange);
        return expectedDamage
    }
</script>

<template>
  <line-chart
    :data="{
      140: calculateExpectedDamage([100, 500]), //these will come from input boxes
      180: calculateExpectedDamage([180, 800]), //stats will be a longer list
      200: calculateExpectedDamage([250, 1000]),
      // [watk, mainstat, secondary, what else?]
    }" 
    label = "dpm" 
    legend = "true"
    thousands = ","
  ></line-chart>
</template>
