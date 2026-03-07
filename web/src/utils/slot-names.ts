const SLOT_NAMES: Record<string, string> = {
  weapon: 'Weapon',
  shield: 'Shield',
  helmet: 'Helmet',
  top: 'Overall',
  earring: 'Earring',
  eye: 'Eye',
  face: 'Face',
  pendant: 'Pendant',
  belt: 'Belt',
  medal: 'Medal',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  ring3: 'Ring 3',
  ring4: 'Ring 4',
  cape: 'Cape',
  shoe: 'Shoe',
  glove: 'Glove',
};

export const OVERALL_TOOLTIP = 'Top and bottom are combined into a single slot.';

export function slotDisplayName(key: string): string {
  return SLOT_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
