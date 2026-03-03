import { useState } from 'react';
import type { Proposal } from '@engine/proposals/types.js';

export function JsonPanel({
  proposal,
  jsonInput,
  setJsonInput,
  jsonError,
  onImport,
}: {
  proposal: Proposal;
  jsonInput: string;
  setJsonInput: (s: string) => void;
  jsonError: string;
  onImport: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const jsonText = JSON.stringify(proposal, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="mb-4 rounded-lg border border-border-default bg-bg-raised p-4">
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-text-muted">Export (current proposal)</span>
          <button
            onClick={handleCopy}
            className="cursor-pointer border-none bg-transparent p-0 text-xs text-accent hover:text-blue-400 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre data-testid="json-export" className="m-0 max-h-[200px] overflow-auto rounded bg-bg p-3 text-xs text-text-secondary">
          {jsonText}
        </pre>
      </div>
      <div>
        <div className="mb-1 text-xs text-text-muted">Import</div>
        <textarea
          data-testid="json-import"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste proposal JSON here..."
          className="h-[100px] w-full resize-y rounded border border-border-default bg-bg-raised px-2.5 py-1.5 font-mono text-xs text-text-primary focus:border-border-active transition-colors"
        />
        {jsonError && <div className="mt-1 text-xs text-negative">{jsonError}</div>}
        <button onClick={onImport} className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs text-accent hover:text-blue-400 transition-colors">
          Import
        </button>
      </div>
    </div>
  );
}
