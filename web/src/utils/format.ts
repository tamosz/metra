export function formatClassName(name: string): string {
  const special: Record<string, string> = {
    'drk': 'DrK',
    'nl': 'NL',
    'sair': 'Corsair',
    'bucc': 'Buccaneer',
    'hero-axe': 'Hero (Axe)',
    'mm': 'Marksman',
  };
  if (special[name]) return special[name];
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
