interface IconProps {
  size?: number;
  color?: string;
}

export function StaffLightningIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="2" x2="4" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4" cy="2.5" r="1.5" fill={color} />
      <path d="M9 4L7 8H10L8 12" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
