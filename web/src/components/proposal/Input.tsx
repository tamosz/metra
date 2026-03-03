export function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-2">
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-border-default bg-bg-raised px-2.5 py-1.5 text-sm text-text-primary focus:border-border-active transition-colors"
      />
    </div>
  );
}
