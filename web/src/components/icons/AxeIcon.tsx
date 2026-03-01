interface IconProps {
  size?: number;
  color?: string;
}

export function AxeIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2L8 8M14 2H11M14 2V5" stroke={color} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 5C7.5 3.5 5 3 3 4C2 5 1.5 7.5 3 9L9 5Z" />
      <line x1="7" y1="9" x2="2" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
