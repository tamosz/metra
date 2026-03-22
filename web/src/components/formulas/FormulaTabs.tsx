import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface FormulaTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function FormulaTabs({ tabs, activeTab, onTabChange }: FormulaTabsProps) {
  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-1 mb-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active.id}
            onClick={() => onTabChange(tab.id)}
            className={`rounded-full px-3 py-1 text-xs transition-colors cursor-pointer ${
              tab.id === active.id
                ? 'bg-bg-active text-text-bright'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{active.content}</div>
    </div>
  );
}
