import { useState } from 'react';

const STORAGE_KEY = 'metra-welcome-dismissed';

export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      data-testid="welcome-banner"
      className="relative mb-6 rounded-lg border border-border-default bg-bg-raised px-5 py-4"
    >
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 cursor-pointer border-none bg-transparent p-0 text-text-dim transition-colors hover:text-text-muted"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="3" x2="11" y2="11" />
          <line x1="3" y1="11" x2="11" y2="3" />
        </svg>
      </button>
      <div className="text-sm font-medium text-text-bright">
        Royals Balance Simulator
      </div>
      <p className="m-0 mt-1.5 text-xs leading-relaxed text-text-muted">
        Compare DPS across Royals classes at different funding tiers and buff scenarios.
        Use the <strong className="text-text-secondary">Proposal Builder</strong> to test balance changes,
        or explore individual builds in <strong className="text-text-secondary">Build Explorer</strong>.
      </p>
    </div>
  );
}
