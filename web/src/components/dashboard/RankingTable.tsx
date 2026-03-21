import { Fragment, useState, useMemo, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { SkillDetailPanel } from '../SkillDetailPanel.js';
import { ClassIcon } from '../icons/index.js';
import { Tooltip } from '../Tooltip.js';
import { formatDps } from '../../utils/format.js';
import { getClassColor } from '../../utils/class-colors.js';
import type { DpsResult } from '@metra/engine';
import type { ComparisonResult, ComboSubResult } from '@engine/proposals/types.js';
import { useProposalEdit } from '../../context/ProposalEditContext.js';
import { discoveredData } from '../../data/bundle.js';
import { skillSlug } from '@engine/proposals/apply.js';
import { buildDeltaMap, deltaMapKey } from '../../utils/delta-map.js';
import type { AnimatedDpsResult } from '../../hooks/useAnimatedDps.js';
import { TRANSITION_DURATION_MS, EMPHASIS_DURATION_MS } from '../../utils/animation-config.js';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber.js';

type SortColumn = 'class' | 'skill' | 'dps' | 'capLoss';
type SortDirection = 'asc' | 'desc';

const COLUMN_DEFAULTS: Record<SortColumn, SortDirection> = {
  class: 'asc',
  skill: 'asc',
  dps: 'desc',
  capLoss: 'desc',
};

function SortArrow({ direction }: { direction: SortDirection }) {
  return <span className="ml-1 text-[10px]">{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>;
}

function AnimatedDpsCell({ value }: { value: number }) {
  const animated = useAnimatedNumber(value, TRANSITION_DURATION_MS);
  return <>{formatDps(animated)}</>;
}

export function RankingTable({
  data,
  capEnabled,
  editComparison,
  animation,
}: {
  data: { className: string; skillName: string; scenario: string; dps: DpsResult; description?: string; isComposite?: boolean; comboSubResults?: ComboSubResult[] }[];
  capEnabled: boolean;
  editComparison?: ComparisonResult | null;
  animation?: AnimatedDpsResult;
}) {
  const { editEnabled, editChanges, addEditChange, updateEditChange, removeEditChange } = useProposalEdit();

  const [sortColumn, setSortColumn] = useState<SortColumn>('dps');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(COLUMN_DEFAULTS[column]);
    }
  };

  const getDps = useCallback((r: typeof data[0]) => capEnabled ? r.dps.dps : r.dps.uncappedDps, [capEnabled]);

  const deltaMap = useMemo(() => buildDeltaMap(editComparison), [editComparison]);

  const editChangesRef = useRef(editChanges);
  editChangesRef.current = editChanges;

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());

  const lastEmphasisIdRef = useRef(-1);
  const [emphasisFading, setEmphasisFading] = useState(false);

  const getSkillEditInfo = useCallback((className: string, skillName: string) => {
    let classKey: string | null = null;
    let classData = null;
    for (const [key, data] of discoveredData.classDataMap) {
      if (data.className === className) {
        classKey = key;
        classData = data;
        break;
      }
    }
    if (!classKey || !classData) return null;

    const skill = classData.skills.find((s) => s.name === skillName);
    if (!skill) return null;

    const target = `${classKey}.${skillSlug(skillName)}`;
    const skillFields: Record<string, number> = {};
    if (skill.basePower !== undefined) skillFields.basePower = skill.basePower;
    if (skill.multiplier !== undefined) skillFields.multiplier = skill.multiplier;
    if (skill.hitCount !== undefined) skillFields.hitCount = skill.hitCount;
    if (skill.maxTargets !== undefined) skillFields.maxTargets = skill.maxTargets;

    const activeChanges: Record<string, number> = {};
    for (const change of editChangesRef.current) {
      if (change.target === target && typeof change.to === 'number') {
        activeChanges[change.field] = change.to;
      }
    }

    return { skillFields, activeChanges, target };
  }, []);

  const getComboSkillEditInfo = useCallback((className: string, comboGroupName: string) => {
    const classEntry = [...discoveredData.classDataMap.entries()]
      .find(([, data]) => data.className === className);
    if (!classEntry) return null;
    const [classKey, classData] = classEntry;

    const subSkills = classData.skills.filter(s => s.comboGroup === comboGroupName);
    if (subSkills.length === 0) return null;

    return subSkills.map(skill => {
      const slug = skillSlug(skill.name);
      const target = `${classKey}.${slug}`;
      const skillFields: Record<string, number> = {};
      if (skill.basePower !== undefined) skillFields.basePower = skill.basePower;
      if (skill.multiplier !== undefined) skillFields.multiplier = skill.multiplier;
      if (skill.hitCount !== undefined) skillFields.hitCount = skill.hitCount;
      if (skill.maxTargets !== undefined) skillFields.maxTargets = skill.maxTargets;

      const activeChanges: Record<string, number> = {};
      for (const change of editChangesRef.current) {
        if (change.target === target && typeof change.to === 'number') {
          activeChanges[change.field] = change.to;
        }
      }
      return { name: skill.name, skillFields, activeChanges, target };
    });
  }, []);

  const applyFieldChange = useCallback((target: string, field: string, value: number, original: number) => {
    const changes = editChangesRef.current;
    if (value === original) {
      const index = changes.findIndex((c) => c.target === target && c.field === field);
      if (index !== -1) removeEditChange(index);
      return;
    }

    const existingIndex = changes.findIndex((c) => c.target === target && c.field === field);
    if (existingIndex !== -1) {
      updateEditChange(existingIndex, { target, field, from: original, to: value });
    } else {
      addEditChange({ target, field, from: original, to: value });
    }
  }, [addEditChange, updateEditChange, removeEditChange]);

  const handleFieldChange = useCallback((className: string, skillName: string, field: string, value: number, original: number) => {
    let classKey: string | null = null;
    for (const [key, data] of discoveredData.classDataMap) {
      if (data.className === className) {
        classKey = key;
        break;
      }
    }
    if (!classKey) return;

    applyFieldChange(`${classKey}.${skillSlug(skillName)}`, field, value, original);
  }, [applyFieldChange]);

  const getEffectiveDps = useCallback((r: typeof data[0]) => {
    if (deltaMap) {
      const delta = deltaMap.get(deltaMapKey(r.className, r.skillName, r.scenario));
      const change = delta ? (capEnabled ? delta.change : delta.uncappedChange) : 0;
      if (delta && change !== 0) {
        return capEnabled ? delta.after : delta.uncappedAfter;
      }
    }
    return getDps(r);
  }, [deltaMap, capEnabled, getDps]);

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      switch (sortColumn) {
        case 'class': return dir * a.className.localeCompare(b.className);
        case 'skill': return dir * a.skillName.localeCompare(b.skillName);
        case 'dps': return dir * (getEffectiveDps(a) - getEffectiveDps(b));
        case 'capLoss': return dir * (a.dps.capLossPercent - b.dps.capLossPercent);
      }
    });
  }, [data, sortColumn, sortDirection, getEffectiveDps]);

  // Compute visible rank diffs: compare baseline order (data) vs edit-adjusted order (sorted by DPS desc)
  const visibleRankDiffs = useMemo(() => {
    if (!deltaMap || sortColumn !== 'dps') return null;
    // data is already sorted by baseline DPS descending
    const baselineOrder = new Map<string, number>();
    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      baselineOrder.set(`${r.className}\0${r.skillName}`, i + 1);
    }
    // sorted by edit-adjusted DPS (when sorting by DPS desc)
    const editOrder = [...data].sort((a, b) => getEffectiveDps(b) - getEffectiveDps(a));
    const diffs = new Map<string, number>();
    for (let i = 0; i < editOrder.length; i++) {
      const r = editOrder[i];
      const key = `${r.className}\0${r.skillName}`;
      const baseRank = baselineOrder.get(key) ?? i + 1;
      const diff = baseRank - (i + 1);
      if (diff !== 0) diffs.set(key, diff);
    }
    return diffs;
  }, [data, deltaMap, sortColumn, getEffectiveDps]);

  useLayoutEffect(() => {
    if (!animation || animation.prefersReducedMotion) {
      const positions = new Map<string, number>();
      for (const [key, el] of rowRefs.current) {
        positions.set(key, el.getBoundingClientRect().top);
      }
      prevPositions.current = positions;
      return;
    }

    const prev = prevPositions.current;

    if (prev.size > 0) {
      for (const [key, el] of rowRefs.current) {
        const oldTop = prev.get(key);
        if (oldTop === undefined) continue;
        const newTop = el.getBoundingClientRect().top;
        const delta = oldTop - newTop;
        if (Math.abs(delta) < 1) continue;
        if (expandedRows.has(key)) continue;

        el.style.transform = `translateY(${delta}px)`;
        el.style.transition = 'none';

        requestAnimationFrame(() => {
          el.style.transition = `transform ${TRANSITION_DURATION_MS}ms ease-out`;
          el.style.transform = '';
        });
      }
    }

    const positions = new Map<string, number>();
    for (const [key, el] of rowRefs.current) {
      positions.set(key, el.getBoundingClientRect().top);
    }
    prevPositions.current = positions;
  }, [sorted, animation?.transitionId, expandedRows]);

  useEffect(() => {
    if (!animation || animation.transitionId === lastEmphasisIdRef.current) return;
    lastEmphasisIdRef.current = animation.transitionId;
    setEmphasisFading(false);
    const timer = setTimeout(() => setEmphasisFading(true), EMPHASIS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [animation?.transitionId]);

  const thBase = 'px-3 py-2 text-[11px] uppercase tracking-wide text-text-dim font-medium';
  const thSortable = `${thBase} cursor-pointer select-none`;
  const columnCount = capEnabled ? 5 : 4;

  return (
    <>
      <div className="overflow-x-auto">
      <table data-testid="ranking-table" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className={thBase}>#</th>
            <th className={`${thSortable} text-left`} onClick={() => handleSort('class')}>
              Class{sortColumn === 'class' && <SortArrow direction={sortDirection} />}
            </th>
            <th className={`${thSortable} text-left`} onClick={() => handleSort('skill')}>
              Skill{sortColumn === 'skill' && <SortArrow direction={sortDirection} />}
            </th>
            <th className={`${thSortable} text-right`} onClick={() => handleSort('dps')}>
              DPS{sortColumn === 'dps' && <SortArrow direction={sortDirection} />}
            </th>
            {capEnabled && (
              <th className={`${thSortable} text-right`} onClick={() => handleSort('capLoss')}>
                Cap Loss{sortColumn === 'capLoss' && <SortArrow direction={sortDirection} />}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-3 py-6 text-center text-sm text-text-dim">
                No results for this filter combination
              </td>
            </tr>
          ) : (
            sorted.map((r, i) => {
              const rowKey = `${r.className}-${r.skillName}`;
              const isExpanded = expandedRows.has(rowKey);
              const delta = deltaMap?.get(deltaMapKey(r.className, r.skillName, r.scenario));
              const change = delta ? (capEnabled ? delta.change : delta.uncappedChange) : 0;
              const changePercent = delta ? (capEnabled ? delta.changePercent : delta.uncappedChangePercent) : 0;
              const displayDps = change !== 0 && delta
                ? (capEnabled ? delta.after : delta.uncappedAfter)
                : getDps(r);
              const rankDiff = visibleRankDiffs?.get(`${r.className}\0${r.skillName}`) ?? 0;
              const animKey = `${r.className}|${r.skillName}`;
              const animEntry = animation?.entries.get(animKey);
              const isHighImpact = (animEntry?.isHighImpact ?? false) && !emphasisFading;
              return (
                <Fragment key={rowKey}>
                  <tr
                    ref={(el) => {
                      if (el) rowRefs.current.set(rowKey, el);
                      else rowRefs.current.delete(rowKey);
                    }}
                    style={{
                      position: 'relative',
                      backgroundColor: isHighImpact ? `${getClassColor(r.className)}26` : undefined,
                      transition: 'background-color 1s ease-out',
                    }}
                    className={`border-b border-border-subtle hover:bg-white/[0.03] cursor-pointer ${
                      change ? 'border-l-2 border-l-accent' : ''
                    }`}
                    onClick={() => toggleRow(rowKey)}
                  >
                    <td className="px-3 py-2 w-8 text-text-faint">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-[10px] text-text-faint">{isExpanded ? '\u25BE' : '\u25B8'}</span>
                        {i + 1}
                        {rankDiff !== 0 && (
                          <span className={`text-[9px] font-medium ${rankDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {rankDiff > 0 ? `\u2191${rankDiff}` : `\u2193${-rankDiff}`}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <ClassIcon className={r.className} />
                        {r.className}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {r.skillName}
                      {r.description && <Tooltip text={r.description} />}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        {animation && !animation.prefersReducedMotion
                          ? <AnimatedDpsCell value={displayDps} />
                          : formatDps(displayDps)}
                        {change !== 0 && (
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                            change > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                          }`}>
                            {change > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    {capEnabled && (
                      <td className="px-3 py-2 text-right tabular-nums text-text-muted">
                        {r.dps.capLossPercent < 0.05 ? '-' : `${r.dps.capLossPercent.toFixed(1)}%`}
                      </td>
                    )}
                  </tr>
                  {isExpanded && (
                    <ExpandedRow
                      row={r}
                      columnCount={columnCount}
                      capEnabled={capEnabled}
                      editEnabled={editEnabled}
                      getSkillEditInfo={getSkillEditInfo}
                      getComboSkillEditInfo={getComboSkillEditInfo}
                      handleFieldChange={handleFieldChange}
                      applyFieldChange={applyFieldChange}
                    />
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
      </div>
      {sorted.length > 0 && (
        <div className="mt-2 text-right text-xs text-text-faint">
          Showing {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
        </div>
      )}
    </>
  );
}

function ExpandedRow({
  row,
  columnCount,
  capEnabled,
  editEnabled,
  getSkillEditInfo,
  getComboSkillEditInfo,
  handleFieldChange,
  applyFieldChange,
}: {
  row: { className: string; skillName: string; dps: DpsResult; isComposite?: boolean; comboSubResults?: Array<{ skillName: string; dps: DpsResult; weight?: number }> };
  columnCount: number;
  capEnabled: boolean;
  editEnabled: boolean;
  getSkillEditInfo: (className: string, skillName: string) => { skillFields: Record<string, number>; activeChanges: Record<string, number>; target: string } | null;
  getComboSkillEditInfo: (className: string, comboGroupName: string) => { name: string; skillFields: Record<string, number>; activeChanges: Record<string, number>; target: string }[] | null;
  handleFieldChange: (className: string, skillName: string, field: string, value: number, original: number) => void;
  applyFieldChange: (target: string, field: string, value: number, original: number) => void;
}) {
  const editInfo = editEnabled ? getSkillEditInfo(row.className, row.skillName) : null;
  const comboSkills = editEnabled && row.isComposite ? getComboSkillEditInfo(row.className, row.skillName) : null;

  return (
    <tr>
      <td colSpan={columnCount} className="p-0">
        <SkillDetailPanel
          dps={row.dps}
          classColor={getClassColor(row.className)}
          isComposite={!!row.isComposite}
          comboSubResults={row.comboSubResults}
          capEnabled={capEnabled}
          editEnabled={editEnabled}
          skillFields={editInfo?.skillFields}
          onFieldChange={(field, value, original) =>
            handleFieldChange(row.className, row.skillName, field, value, original)
          }
          activeChanges={editInfo?.activeChanges}
          comboSkills={comboSkills ?? undefined}
          onComboFieldChange={applyFieldChange}
        />
      </td>
    </tr>
  );
}
