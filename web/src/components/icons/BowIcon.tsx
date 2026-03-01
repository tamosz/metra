interface IconProps {
  size?: number;
  color?: string;
}

export function BowIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2C3 2 2 8 3 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="2" x2="3" y2="14" stroke={color} strokeWidth="0.8" />
      <line x1="3" y1="8" x2="14" y2="3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13 2L14 3L13 4" fill={color} />
    </svg>
  );
}
