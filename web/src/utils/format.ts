export function formatClassName(name: string): string {
  const special: Record<string, string> = {
    'drk': 'DrK',
    'nl': 'NL',
    'sair': 'Corsair',
    'bucc': 'Buccaneer',
    'hero-axe': 'Hero (Axe)',
    'mm': 'Marksman',
    'archmage-il': 'Archmage I/L',
    'archmage-fp': 'Archmage F/P',
  };
  if (special[name]) return special[name];
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function formatDps(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatChange(percent: number): string {
  if (Math.abs(percent) < 0.01) return '0.0%';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

export function changeColorClass(percent: number): string {
  if (Math.abs(percent) < 0.01) return 'text-text-faint';
  return percent > 0 ? 'text-positive' : 'text-negative';
}
