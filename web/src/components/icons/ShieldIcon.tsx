interface IconProps {
  size?: number;
  color?: string;
}

export function ShieldIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L3 3V7C3 10.5 5.5 13.5 8 15C10.5 13.5 13 10.5 13 7V3L8 1Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 5V10M6 7.5H10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
