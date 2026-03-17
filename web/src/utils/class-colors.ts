/**
 * Color palette for Royals classes.
 * Designed for dark backgrounds with good contrast and class identity.
 */
const CLASS_COLORS: Record<string, string> = {
  Hero: '#e05555',
  'Hero (Axe)': '#c04030',
  'Hero (ST)': '#cc4545',
  'Dark Knight': '#7855e0',
  Paladin: '#e0b855',
  'Paladin (BW)': '#c8a040',
  'Night Lord': '#55b8e0',
  Bowmaster: '#55e068',
  Marksman: '#40c8b0',
  Corsair: '#e07855',
  Buccaneer: '#e055b8',
  Shadower: '#8855e0',
  Bishop: '#f0e070',
  'Archmage I/L': '#60b0f0',
  'Archmage F/P': '#e07040',
};

const DEFAULT_COLOR = '#888888';

export function getClassColor(className: string): string {
  return CLASS_COLORS[className] ?? DEFAULT_COLOR;
}

export const VARIANT_CLASSES = new Set(['Hero (Axe)', 'Hero (ST)', 'Paladin (BW)']);

export function getClassColorWithOpacity(className: string, opacity: number): string {
  const hex = getClassColor(className);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
