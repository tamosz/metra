/**
 * Renders a general disclaimer about simulation accuracy
 * at the top of the dashboard.
 */
export function SimulationDisclaimer() {
  return (
    <div className="mb-4 rounded border border-border-subtle bg-bg-raised px-4 py-3 text-xs leading-relaxed text-text-muted">
      <span className="font-medium text-text-secondary">Disclaimer: </span>
      These figures are approximations based on documented formulas and may differ
      from observed in-game damage. Some discrepancies between client and server
      damage are not well understood. All data is subject to change.
    </div>
  );
}
