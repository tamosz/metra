import { useState } from 'react';
import type { CustomTiersState } from '../hooks/useCustomTiers.js';
import { CustomTierEditor } from './CustomTierEditor.js';

interface CustomTierListProps {
  customTiers: CustomTiersState;
  baseTiers: string[];
}

export function CustomTierList({ customTiers, baseTiers }: CustomTierListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { tiers, add, update, remove } = customTiers;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="m-0 text-xs font-medium uppercase tracking-wide text-text-dim">
          Custom Tiers
        </h3>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="cursor-pointer rounded border border-border-default bg-transparent px-2 py-1 text-xs text-text-muted transition-colors hover:border-border-active hover:text-text-secondary"
          >
            + New
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-3">
          <CustomTierEditor
            baseTiers={baseTiers}
            onSave={(name, baseTier, adjustments) => {
              add(name, baseTier, adjustments);
              setShowAdd(false);
            }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {tiers.length > 0 && (
        <div className="flex flex-col gap-2">
          {tiers.map((tier) =>
            editingId === tier.id ? (
              <CustomTierEditor
                key={tier.id}
                baseTiers={baseTiers}
                initialName={tier.name}
                initialBaseTier={tier.baseTier}
                initialAdjustments={tier.adjustments}
                onSave={(name, baseTier, adjustments) => {
                  update(tier.id, { name, baseTier, adjustments });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={tier.id}
                className="flex items-center gap-3 rounded border border-border-subtle bg-bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-text-secondary">{tier.name}</span>
                <span className="text-xs text-text-faint">
                  base: {tier.baseTier}
                  {tier.adjustments.primaryStatDelta !== 0 &&
                    `, primary ${tier.adjustments.primaryStatDelta > 0 ? '+' : ''}${tier.adjustments.primaryStatDelta}`}
                  {tier.adjustments.watkDelta !== 0 &&
                    `, WATK ${tier.adjustments.watkDelta > 0 ? '+' : ''}${tier.adjustments.watkDelta}`}
                </span>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => setEditingId(tier.id)}
                    className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-xs text-text-dim transition-colors hover:text-text-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(tier.id)}
                    className="cursor-pointer border-none bg-transparent px-1.5 py-0.5 text-xs text-red-400/60 transition-colors hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
