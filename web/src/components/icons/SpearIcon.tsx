interface IconProps {
  size?: number;
  color?: string;
}

export function SpearIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2L10 3L13 6L14 2Z" />
      <line x1="12" y1="4" x2="2" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
