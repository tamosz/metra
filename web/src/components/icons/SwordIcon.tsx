interface IconProps {
  size?: number;
  color?: string;
}

export function SwordIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 1L5 9.5L6.5 11L15 2.5V1H13.5Z" />
      <path d="M4.5 10L3 8.5L1 10.5L2 11L1 12L2.5 13.5L3.5 12.5L4 13.5L6 11.5L4.5 10Z" />
    </svg>
  );
}
