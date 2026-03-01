/**
 * Classes whose solo DPS rankings don't tell the full story.
 * These classes provide significant party utility (buffs, healing, etc.)
 * that isn't captured by the DPS simulator.
 */

const SUPPORT_CLASSES = new Set(['Bishop', 'Archmage I/L']);

export function isSupportClass(className: string): boolean {
  return SUPPORT_CLASSES.has(className);
}

export function getSupportClassNames(classNames: string[]): string[] {
  return classNames.filter(isSupportClass);
}
