import { useState, useEffect, useRef } from 'react';
import type { ComparisonResult } from '@engine/proposals/types.js';
import { ChangeRow } from '../proposal/ChangeRow.js';
import { discoveredData } from '../../data/bundle.js';
import { setProposalInUrl, clearProposalFromUrl } from '../../utils/url-encoding.js';
import { renderComparisonReport } from '@engine/report/markdown.js';
import { renderComparisonBBCode } from '@engine/report/bbcode.js';
import { useProposalEdit } from '../../context/ProposalEditContext.js';

interface EditPopoverProps {
  comparison: { result: ComparisonResult | null; error: Error | null };
}

export function EditPopover({ comparison }: EditPopoverProps) {
  const { editChanges, editMeta, setEditMeta, removeEditChange } = useProposalEdit();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }
  }, [open]);

  // Update URL when changes exist — debounce meta changes so typing in
  // the name field doesn't thrash the URL on every keystroke.
  const metaTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (editChanges.length > 0) {
      clearTimeout(metaTimerRef.current);
      metaTimerRef.current = setTimeout(() => {
        setProposalInUrl({
          name: editMeta.name || '(Edit)',
          author: editMeta.author,
          changes: editChanges,
        });
      }, 300);
    } else {
      clearProposalFromUrl();
    }
    return () => clearTimeout(metaTimerRef.current);
  }, [editChanges, editMeta]);

  if (editChanges.length === 0) return null;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
      },
      () => {
        setCopied('failed');
        setTimeout(() => setCopied(null), 2000);
      },
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-full border border-accent/50 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
      >
        {editChanges.length} change{editChanges.length !== 1 ? 's' : ''}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-80 rounded-lg border border-border-active bg-bg-surface p-4 shadow-xl">
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-text-dim uppercase">Name</label>
              <input
                type="text"
                value={editMeta.name}
                onChange={(e) => setEditMeta({ ...editMeta, name: e.target.value })}
                placeholder="Proposal name"
                className="rounded border border-border-default bg-bg-raised px-2 py-1 text-sm text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-text-dim uppercase">Author</label>
              <input
                type="text"
                value={editMeta.author}
                onChange={(e) => setEditMeta({ ...editMeta, author: e.target.value })}
                placeholder="Optional"
                className="rounded border border-border-default bg-bg-raised px-2 py-1 text-sm text-text-primary"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {editChanges.map((change, i) => (
              <ChangeRow
                key={`${change.target}-${change.field}-${i}`}
                change={change}
                discovery={discoveredData}
                onRemove={() => removeEditChange(i)}
              />
            ))}
          </div>

          {comparison.error && (
            <div className="mt-2 rounded border border-red-700/30 bg-red-950/20 px-2 py-1 text-xs text-red-400">
              {comparison.error.message}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(window.location.href, 'link')}
              className="cursor-pointer rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              {copied === 'link' ? 'Copied!' : copied === 'failed' ? 'Failed' : 'Copy Link'}
            </button>
            <button
              type="button"
              disabled={!comparison.result}
              onClick={() => {
                if (comparison.result) {
                  copyToClipboard(renderComparisonReport(comparison.result), 'md');
                }
              }}
              className="cursor-pointer rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {copied === 'md' ? 'Copied!' : 'Markdown'}
            </button>
            <button
              type="button"
              disabled={!comparison.result}
              onClick={() => {
                if (comparison.result) {
                  copyToClipboard(renderComparisonBBCode(comparison.result), 'bb');
                }
              }}
              className="cursor-pointer rounded border border-border-default bg-bg-raised px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              {copied === 'bb' ? 'Copied!' : 'BBCode'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
