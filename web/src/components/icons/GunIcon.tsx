interface IconProps {
  size?: number;
  color?: string;
}

export function GunIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="6" width="12" height="3" rx="1" />
      <rect x="10" y="9" width="2" height="4" rx="0.5" />
      <rect x="13" y="6.5" width="2" height="2" rx="0.5" />
    </svg>
  );
}
