/**
 * Metadata for classes whose solo DPS rankings don't tell the full story.
 * These classes provide significant party utility (buffs, healing, etc.)
 * that isn't captured by the DPS simulator.
 */

const SUPPORT_CLASS_NOTES: Record<string, string> = {
  bishop:
    'Bishop\'s primary value is party utility (Holy Symbol, Heal, Resurrection, Dispel) — not solo DPS.',
  'archmage-il':
    'Archmage I/L provides Infinity (party MP sustain), freeze utility, and strong mobbing — solo bossing DPS understates their role.',
};

export function isSupportClass(className: string): boolean {
  return className in SUPPORT_CLASS_NOTES;
}

export function getSupportClassNote(className: string): string | null {
  return SUPPORT_CLASS_NOTES[className] ?? null;
}

export function getSupportClassNames(classNames: string[]): string[] {
  return classNames.filter(isSupportClass);
}
