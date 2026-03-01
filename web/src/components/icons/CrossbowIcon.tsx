interface IconProps {
  size?: number;
  color?: string;
}

export function CrossbowIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 4C2.5 5.5 2.5 10.5 4 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="4" x2="4" y2="12" stroke={color} strokeWidth="0.8" />
      <path d="M13 7L14 8L13 9" fill={color} />
    </svg>
  );
}
