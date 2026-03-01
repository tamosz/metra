interface IconProps {
  size?: number;
  color?: string;
}

export function ShurikenIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L9.5 6.5H8V1ZM15 8L9.5 6.5V8H15ZM8 15L6.5 9.5H8V15ZM1 8L6.5 9.5V8H1Z" />
      <circle cx="8" cy="8" r="1.5" fill={color} />
    </svg>
  );
}
