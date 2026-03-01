interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="ml-1 inline-flex h-[14px] w-[14px] cursor-help items-center justify-center rounded-full border border-border-active bg-transparent text-[9px] leading-none text-text-dim transition-colors hover:text-text-muted focus:text-text-muted"
        tabIndex={0}
        aria-label={text}
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded border border-border-active bg-bg-surface px-3 py-2 text-[11px] leading-relaxed text-text-secondary opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border-active" />
      </span>
    </span>
  );
}
