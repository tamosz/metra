# Corsair Practical Bossing Estimate

## Problem

Corsair has two bossing skills: Battleship Cannon (~350k DPS high) and Rapid Fire (~242k DPS high). In practice, Corsairs spend most of their time in Battleship Cannon but periodically lose the ship (destroyed → 90s cooldown at level 1) and fall back to Rapid Fire. Neither individual bar reflects real-world Corsair DPS.

## Research

- Battleship kept at level 1 for minimum cooldown (84-90s when destroyed)
- At level 200, level 1 Battleship: 164k HP durability
- Ship has no stance/KB resistance — takes full boss damage
- Cannon is primary skill; Rapid Fire is fallback during ship cooldown
- Split varies by boss: easy bosses rarely destroy ship, hard bosses (HT) destroy it frequently
- Community consensus: Cannon is primary, RF is backup

Sources:
- [Corsairs' BattleShip thread](https://royals.ms/forum/threads/corsairs-battleship.112382/)
- [Comprehensive Corsair Guide](https://royals.ms/forum/threads/a-comprehensive-corsair-guide.122934/)
- [BeforeBigBang skill data](https://bc.hidden-street.net/character/skill/battleship)

## Design

### Chosen split: 80/20 Cannon/RF

Represents a generalist endgame bossing estimate — ship lasts roughly 3-4 minutes before breaking, plus 90s of RF downtime.

### New concept: `mixedRotation`

A new optional field on `ClassSkillData`, separate from `comboGroup`. Rationale: comboGroup models fixed rotation cycles (Bucc Barrage+Demo). This is a time-weighted statistical estimate — different concept, different mechanism.

**Data format:**

```json
// sair.json top-level field
"mixedRotations": [
  {
    "name": "Practical Bossing",
    "description": "Estimated 80/20 Cannon/RF split — assumes typical endgame bossing with periodic Battleship destruction (90s cooldown at level 1)",
    "components": [
      { "skill": "Battleship Cannon", "weight": 0.8 },
      { "skill": "Rapid Fire", "weight": 0.2 }
    ]
  }
]
```

### Simulation layer

In `simulate.ts`, after computing individual skill DPS and aggregating combo groups, process `mixedRotations`:
1. For each rotation, look up component skills' already-computed DPS results
2. Create a synthetic `ScenarioResult` with `dps = sum(componentDps * weight)`
3. Carry `description` field through to result metadata for web tooltip

### Web layer

- "Practical Bossing" appears as a bar in the dashboard alongside individual Cannon and RF
- Hover shows info icon with the description text explaining the 80/20 assumption
- Uses same styling as other skill entries (no special treatment beyond the tooltip)

### Types

```typescript
// In src/data/types.ts
interface MixedRotationComponent {
  skill: string;     // skill name (must match a SkillEntry.name in same class)
  weight: number;    // 0-1, all weights should sum to 1
}

interface MixedRotation {
  name: string;
  description: string;
  components: MixedRotationComponent[];
}

// Add to ClassSkillData:
mixedRotations?: MixedRotation[];
```

```typescript
// In src/proposals/types.ts, extend ScenarioResult:
description?: string;  // tooltip text for mixed rotations
```
