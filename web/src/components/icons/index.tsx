import { SwordIcon } from './SwordIcon.js';
import { AxeIcon } from './AxeIcon.js';
import { SpearIcon } from './SpearIcon.js';
import { ShieldIcon } from './ShieldIcon.js';
import { ShurikenIcon } from './ShurikenIcon.js';
import { BowIcon } from './BowIcon.js';
import { CrossbowIcon } from './CrossbowIcon.js';
import { GunIcon } from './GunIcon.js';
import { FistIcon } from './FistIcon.js';
import { DaggerIcon } from './DaggerIcon.js';
import { StaffLightningIcon } from './StaffLightningIcon.js';
import { StaffCrossIcon } from './StaffCrossIcon.js';
import { getClassColor } from '../../utils/class-colors.js';

const CLASS_ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Hero: SwordIcon,
  'Hero (Axe)': AxeIcon,
  'Hero (ST)': SwordIcon,
  'Dark Knight': SpearIcon,
  Paladin: ShieldIcon,
  'Paladin (BW)': ShieldIcon,
  'Night Lord': ShurikenIcon,
  Bowmaster: BowIcon,
  Marksman: CrossbowIcon,
  Corsair: GunIcon,
  Buccaneer: FistIcon,
  Shadower: DaggerIcon,
  'Archmage I/L': StaffLightningIcon,
  'Archmage F/P': StaffLightningIcon,
  Bishop: StaffCrossIcon,
};

interface ClassIconProps {
  className: string;
  size?: number;
}

export function ClassIcon({ className, size = 16 }: ClassIconProps) {
  const Icon = CLASS_ICON_MAP[className];
  if (!Icon) return null;
  return <Icon size={size} color={getClassColor(className)} />;
}
