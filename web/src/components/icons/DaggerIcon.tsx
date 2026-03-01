interface IconProps {
  size?: number;
  color?: string;
}

export function DaggerIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1L6 8L7 9L14 2L13 1Z" />
      <path d="M6 8L5 9L3 8L2 9L4 11L3 12L4 13L5 12L7 14L8 13L7 11L9 9L8 8L6 8Z" />
    </svg>
  );
}
