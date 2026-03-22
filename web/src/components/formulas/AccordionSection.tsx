import { useRef, useEffect, useState, type ReactNode } from 'react';

interface AccordionSectionProps {
  id: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function AccordionSection({
  id,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      setHeight(contentRef.current.scrollHeight);
      // After transition, switch to auto so content can resize naturally
      const timer = setTimeout(() => setHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      // Set explicit height so the transition has a start value
      setHeight(contentRef.current.scrollHeight);
      // Double-rAF ensures the browser has painted the start value before animating to 0
      let inner: number | undefined;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setHeight(0));
      });
      return () => {
        cancelAnimationFrame(outer);
        if (inner != null) cancelAnimationFrame(inner);
      };
    }
  }, [isOpen]);

  return (
    <section id={id} className="scroll-mt-8 border-b border-border-default">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <div className="min-w-0">
          <span className="text-base font-semibold text-text-bright">{title}</span>
          <span className="ml-3 text-sm text-text-dim">{subtitle}</span>
        </div>
        <svg
          className={`size-4 shrink-0 text-text-dim transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      <div
        id={`${id}-content`}
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: isOpen && height === undefined ? 'auto' : `${height ?? 0}px` }}
      >
        <div className="pb-8">{children}</div>
      </div>
    </section>
  );
}
