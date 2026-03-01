import { Tooltip } from './Tooltip.js';

export function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; annotation?: string; tooltip?: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5">
        {options.map((opt) => (
          <span key={opt.value} className="inline-flex items-center">
            <button
              onClick={() => onChange(opt.value)}
              className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors ${
                value === opt.value
                  ? 'border border-border-active bg-bg-active text-text-bright'
                  : 'border border-transparent bg-transparent text-text-dim hover:text-text-muted'
              }`}
            >
              {opt.label}
              {opt.annotation && (
                <span className="ml-1 text-[10px] text-text-faint">{opt.annotation}</span>
              )}
            </button>
            {opt.tooltip && <Tooltip text={opt.tooltip} />}
          </span>
        ))}
      </div>
    </div>
  );
}
