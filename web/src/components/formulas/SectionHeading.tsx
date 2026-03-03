export function SectionHeading({ label }: { label: string }) {
  return (
    <h3 className="text-base font-semibold text-text-bright mb-4 pb-2 border-b border-border-default">
      {label}
    </h3>
  );
}
