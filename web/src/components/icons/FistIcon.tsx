interface IconProps {
  size?: number;
  color?: string;
}

export function FistIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10V6.5C4 6 4.5 5.5 5 5.5C5.5 5.5 6 6 6 6.5V4C6 3.5 6.5 3 7 3C7.5 3 8 3.5 8 4V3.5C8 3 8.5 2.5 9 2.5C9.5 2.5 10 3 10 3.5V4C10 3.5 10.5 3 11 3C11.5 3 12 3.5 12 4V9C12 11.5 10.5 13 8 13C5.5 13 4 11.5 4 10Z" />
    </svg>
  );
}
