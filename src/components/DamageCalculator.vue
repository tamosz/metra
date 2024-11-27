<template>
  <div>
    <line-chart
      :data="chartData"
      :colors="chartColors"
      :title="'Character DPM by Level'"
      :download="true"
      :library="chartOptions"
    ></line-chart>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { characters } from '../config/characterFormulas'

// Compute the chart data in the format Chartkick expects
const chartData = computed(() => {
  const levels = Array.from({length: 200}, (_, i) => i + 1)
  return characters.map(char => ({
    name: char.name,
    data: levels.reduce((acc, level) => {
      acc[level] = char.damageFormula(level)
      return acc
    }, {})
  }))
})

// Extract colors for the chart
const chartColors = computed(() =>
  characters.map(char => char.color)
)

const chartOptions = {
  elements: {
    line: {
      borderWidth: 2,  // Makes lines thinner
      tension: 0.1     // Reduces curve smoothing
    },
    point: {
      radius: 0,       // Hides individual points
      hitRadius: 5     // Area for hover detection
    }
  }
}
</script>
