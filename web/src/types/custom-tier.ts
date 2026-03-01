export interface CustomTierAdjustments {
  /** Delta applied to the class's primary stat (e.g., +50 STR for Hero, +50 LUK for NL). */
  primaryStatDelta: number;
  /** Delta applied to the class's secondary stat(s). */
  secondaryStatDelta: number;
  /** Delta applied to total weapon attack. */
  watkDelta: number;
  /** Override attack potion WATK (null = keep base tier's value). */
  attackPotion: number | null;
  /** Override echo active (null = keep base tier's value). */
  echoActive: boolean | null;
  /** Override sharp eyes (null = keep base tier's value). */
  sharpEyes: boolean | null;
  /** Override speed infusion (null = keep base tier's value). */
  speedInfusion: boolean | null;
  /** Override MW level (null = keep base tier's value). */
  mwLevel: number | null;
}

export interface CustomTier {
  id: string;
  name: string;
  baseTier: string;
  adjustments: CustomTierAdjustments;
}

export const DEFAULT_ADJUSTMENTS: CustomTierAdjustments = {
  primaryStatDelta: 0,
  secondaryStatDelta: 0,
  watkDelta: 0,
  attackPotion: null,
  echoActive: null,
  sharpEyes: null,
  speedInfusion: null,
  mwLevel: null,
};
